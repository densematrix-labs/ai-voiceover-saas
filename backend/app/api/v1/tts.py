from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel, Field
from typing import Optional
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import GenerationToken, FreeTrialUsage, VoiceGeneration
from app.services.tts_service import tts_service
from app.metrics import (
    tokens_consumed, free_trial_used, tts_generations, 
    tts_characters_processed, TOOL_NAME
)

router = APIRouter()


class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    voice_id: str = Field(..., description="Voice ID in format 'provider:voice_name'")
    speed: float = Field(default=1.0, ge=0.5, le=2.0)


class TTSResponse(BaseModel):
    success: bool
    audio_url: Optional[str] = None
    provider: str
    voice_id: str
    characters_used: int
    error: Optional[str] = None


def check_token_or_free_trial(device_id: str, db: Session) -> tuple[bool, str]:
    """Check if user has tokens or free trial available"""
    # Check free trial
    free_trial = db.query(FreeTrialUsage).filter(
        FreeTrialUsage.device_id == device_id
    ).first()
    
    if not free_trial:
        # Create and use free trial
        free_trial = FreeTrialUsage(device_id=device_id, used=True)
        db.add(free_trial)
        db.commit()
        free_trial_used.labels(tool=TOOL_NAME).inc()
        return True, "free_trial"
    
    if not free_trial.used:
        free_trial.used = True
        db.commit()
        free_trial_used.labels(tool=TOOL_NAME).inc()
        return True, "free_trial"
    
    # Check paid tokens
    token_record = db.query(GenerationToken).filter(
        GenerationToken.device_id == device_id
    ).first()
    
    if token_record and token_record.remaining_tokens > 0:
        return True, "paid"
    
    return False, "no_tokens"


def use_token(device_id: str, db: Session):
    """Consume one token"""
    token_record = db.query(GenerationToken).filter(
        GenerationToken.device_id == device_id
    ).first()
    
    if token_record:
        token_record.used_tokens += 1
        db.commit()
        tokens_consumed.labels(tool=TOOL_NAME).inc()


@router.post("/generate", response_model=TTSResponse)
async def generate_speech(
    request: TTSRequest,
    x_device_id: str = Header(..., alias="X-Device-Id"),
    db: Session = Depends(get_db),
):
    """Generate speech from text"""
    # Validate voice_id format
    if ":" not in request.voice_id:
        raise HTTPException(status_code=400, detail="Invalid voice_id format. Use 'provider:voice_name'")
    
    provider, voice_name = request.voice_id.split(":", 1)
    
    # Check tokens/free trial
    has_access, access_type = check_token_or_free_trial(x_device_id, db)
    
    if not has_access:
        raise HTTPException(
            status_code=402,
            detail="No tokens remaining. Please purchase more to continue."
        )
    
    # Generate audio based on provider
    audio_filename = None
    
    if provider.lower() == "openai":
        if voice_name not in tts_service.OPENAI_VOICES:
            raise HTTPException(status_code=400, detail=f"Unknown OpenAI voice: {voice_name}")
        audio_filename = await tts_service.generate_openai(
            request.text, 
            voice_name, 
            request.speed
        )
    elif provider.lower() == "edge":
        audio_filename = await tts_service.generate_edge_tts(
            request.text,
            voice_name,
            f"{int((request.speed - 1) * 100):+d}%"
        )
    else:
        raise HTTPException(status_code=400, detail=f"Unknown provider: {provider}")
    
    if not audio_filename:
        raise HTTPException(status_code=500, detail="Failed to generate audio. Please try again.")
    
    # Use token if paid
    if access_type == "paid":
        use_token(x_device_id, db)
    
    # Record generation
    generation = VoiceGeneration(
        device_id=x_device_id,
        voice_id=request.voice_id,
        provider=provider,
        text_length=len(request.text),
        audio_url=f"/audio/{audio_filename}",
    )
    db.add(generation)
    db.commit()
    
    # Update metrics
    tts_generations.labels(tool=TOOL_NAME, provider=provider, voice_id=voice_name).inc()
    tts_characters_processed.labels(tool=TOOL_NAME, provider=provider).inc(len(request.text))
    
    return TTSResponse(
        success=True,
        audio_url=f"/audio/{audio_filename}",
        provider=provider,
        voice_id=voice_name,
        characters_used=len(request.text),
    )


@router.post("/preview")
async def preview_speech(
    request: TTSRequest,
):
    """Generate a short preview (max 100 chars, no token required)"""
    preview_text = request.text[:100]
    
    if ":" not in request.voice_id:
        raise HTTPException(status_code=400, detail="Invalid voice_id format")
    
    provider, voice_name = request.voice_id.split(":", 1)
    
    # Generate preview
    if provider.lower() == "openai":
        audio_filename = await tts_service.generate_openai(preview_text, voice_name, request.speed)
    elif provider.lower() == "edge":
        audio_filename = await tts_service.generate_edge_tts(
            preview_text, voice_name, f"{int((request.speed - 1) * 100):+d}%"
        )
    else:
        raise HTTPException(status_code=400, detail=f"Unknown provider: {provider}")
    
    if not audio_filename:
        raise HTTPException(status_code=500, detail="Failed to generate preview")
    
    return {
        "success": True,
        "audio_url": f"/audio/{audio_filename}",
        "is_preview": True,
    }
