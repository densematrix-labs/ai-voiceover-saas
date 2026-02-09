from fastapi import APIRouter, HTTPException, Request, Header, Depends
from pydantic import BaseModel
from typing import Optional
import httpx
import json
import hmac
import hashlib
from datetime import datetime
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models import PaymentTransaction, GenerationToken
from app.metrics import payment_success, payment_revenue_cents, TOOL_NAME

router = APIRouter()
settings = get_settings()

# Product configuration
PRODUCTS = {
    "basic": {"tokens": 10, "price_cents": 499, "name": "Basic Pack"},
    "standard": {"tokens": 30, "price_cents": 999, "name": "Standard Pack"},
    "pro": {"tokens": 100, "price_cents": 1999, "name": "Pro Pack"},
}


class CheckoutRequest(BaseModel):
    product_id: str
    device_id: str
    success_url: str
    cancel_url: Optional[str] = None


class CheckoutResponse(BaseModel):
    checkout_url: str
    checkout_id: str


@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout(
    request: CheckoutRequest,
    db: Session = Depends(get_db),
):
    """Create a Creem checkout session"""
    if request.product_id not in PRODUCTS:
        raise HTTPException(status_code=400, detail=f"Unknown product: {request.product_id}")
    
    product = PRODUCTS[request.product_id]
    
    # Parse product IDs from settings
    try:
        creem_product_ids = json.loads(settings.CREEM_PRODUCT_IDS)
    except:
        creem_product_ids = {}
    
    creem_product_id = creem_product_ids.get(request.product_id)
    if not creem_product_id:
        raise HTTPException(status_code=500, detail="Product not configured in Creem")
    
    # Create checkout via Creem API
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.creem.io/v1/checkouts",
                headers={
                    "Authorization": f"Bearer {settings.CREEM_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "product_id": creem_product_id,
                    "success_url": request.success_url,
                    "cancel_url": request.cancel_url or request.success_url,
                    "metadata": {
                        "device_id": request.device_id,
                        "product_id": request.product_id,
                        "tokens": product["tokens"],
                    },
                },
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail="Failed to create checkout")
            
            data = response.json()
            checkout_id = data.get("id")
            checkout_url = data.get("checkout_url")
            
            # Record transaction
            transaction = PaymentTransaction(
                device_id=request.device_id,
                checkout_id=checkout_id,
                product_sku=request.product_id,
                amount_cents=product["price_cents"],
                tokens_granted=product["tokens"],
            )
            db.add(transaction)
            db.commit()
            
            return CheckoutResponse(
                checkout_url=checkout_url,
                checkout_id=checkout_id,
            )
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Payment service error: {str(e)}")


@router.post("/webhook")
async def handle_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    """Handle Creem webhook events"""
    # Verify signature
    signature = request.headers.get("creem-signature")
    body = await request.body()
    
    if settings.CREEM_WEBHOOK_SECRET:
        expected = hmac.new(
            settings.CREEM_WEBHOOK_SECRET.encode(),
            body,
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(signature or "", expected):
            raise HTTPException(status_code=401, detail="Invalid signature")
    
    # Parse event
    try:
        event = json.loads(body)
    except:
        raise HTTPException(status_code=400, detail="Invalid JSON")
    
    event_type = event.get("type")
    
    if event_type == "checkout.completed":
        checkout_data = event.get("data", {})
        checkout_id = checkout_data.get("id")
        metadata = checkout_data.get("metadata", {})
        
        # Find transaction
        transaction = db.query(PaymentTransaction).filter(
            PaymentTransaction.checkout_id == checkout_id
        ).first()
        
        if transaction and transaction.status == "pending":
            transaction.status = "completed"
            transaction.completed_at = datetime.utcnow()
            
            # Grant tokens
            device_id = metadata.get("device_id") or transaction.device_id
            tokens_to_grant = metadata.get("tokens") or transaction.tokens_granted
            
            token_record = db.query(GenerationToken).filter(
                GenerationToken.device_id == device_id
            ).first()
            
            if token_record:
                token_record.total_tokens += tokens_to_grant
            else:
                token_record = GenerationToken(
                    device_id=device_id,
                    total_tokens=tokens_to_grant,
                    used_tokens=0,
                )
                db.add(token_record)
            
            db.commit()
            
            # Update metrics
            payment_success.labels(tool=TOOL_NAME, product_sku=transaction.product_sku).inc()
            payment_revenue_cents.labels(tool=TOOL_NAME).inc(transaction.amount_cents)
    
    return {"received": True}


@router.get("/products")
async def list_products():
    """List available products"""
    return {
        "products": [
            {
                "id": pid,
                "name": info["name"],
                "tokens": info["tokens"],
                "price": info["price_cents"] / 100,
                "price_formatted": f"${info['price_cents'] / 100:.2f}",
            }
            for pid, info in PRODUCTS.items()
        ]
    }
