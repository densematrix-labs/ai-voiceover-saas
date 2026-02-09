from fastapi import APIRouter, Header, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import GenerationToken, FreeTrialUsage

router = APIRouter()


class TokenStatus(BaseModel):
    total_tokens: int
    used_tokens: int
    remaining_tokens: int
    free_trial_available: bool
    free_trial_used: bool


@router.get("/status", response_model=TokenStatus)
async def get_token_status(
    x_device_id: str = Header(..., alias="X-Device-Id"),
    db: Session = Depends(get_db),
):
    """Get token status for a device"""
    # Check free trial
    free_trial = db.query(FreeTrialUsage).filter(
        FreeTrialUsage.device_id == x_device_id
    ).first()
    
    free_trial_used = free_trial.used if free_trial else False
    free_trial_available = not free_trial_used
    
    # Check tokens
    token_record = db.query(GenerationToken).filter(
        GenerationToken.device_id == x_device_id
    ).first()
    
    if token_record:
        return TokenStatus(
            total_tokens=token_record.total_tokens,
            used_tokens=token_record.used_tokens,
            remaining_tokens=token_record.remaining_tokens,
            free_trial_available=free_trial_available,
            free_trial_used=free_trial_used,
        )
    
    return TokenStatus(
        total_tokens=0,
        used_tokens=0,
        remaining_tokens=0,
        free_trial_available=free_trial_available,
        free_trial_used=free_trial_used,
    )
