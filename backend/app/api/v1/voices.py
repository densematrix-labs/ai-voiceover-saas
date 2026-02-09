from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.services.tts_service import tts_service

router = APIRouter()


class Voice(BaseModel):
    id: str
    name: str
    provider: str
    gender: str
    language: str
    locale: str
    description: Optional[str] = None
    preview_url: Optional[str] = None
    available: bool = True


class VoicesResponse(BaseModel):
    voices: List[Voice]
    total: int
    providers: dict


@router.get("/", response_model=VoicesResponse)
async def list_voices(
    provider: Optional[str] = None,
    language: Optional[str] = None,
    gender: Optional[str] = None,
):
    """List all available voices with optional filtering"""
    voices = []
    
    # OpenAI voices
    for voice_id, info in tts_service.OPENAI_VOICES.items():
        voices.append(Voice(
            id=f"openai:{voice_id}",
            name=info["name"],
            provider="OpenAI",
            gender=info["gender"],
            language="English",
            locale="en-US",
            description=info["description"],
            available=True,
        ))
    
    # Edge TTS voices (static list for common ones)
    edge_voices_static = [
        {"id": "en-US-GuyNeural", "name": "Guy", "gender": "male", "language": "English", "locale": "en-US"},
        {"id": "en-US-JennyNeural", "name": "Jenny", "gender": "female", "language": "English", "locale": "en-US"},
        {"id": "en-US-AriaNeural", "name": "Aria", "gender": "female", "language": "English", "locale": "en-US"},
        {"id": "en-GB-SoniaNeural", "name": "Sonia", "gender": "female", "language": "English", "locale": "en-GB"},
        {"id": "en-GB-RyanNeural", "name": "Ryan", "gender": "male", "language": "English", "locale": "en-GB"},
        {"id": "zh-CN-XiaoxiaoNeural", "name": "Xiaoxiao", "gender": "female", "language": "Chinese", "locale": "zh-CN"},
        {"id": "zh-CN-YunxiNeural", "name": "Yunxi", "gender": "male", "language": "Chinese", "locale": "zh-CN"},
        {"id": "ja-JP-NanamiNeural", "name": "Nanami", "gender": "female", "language": "Japanese", "locale": "ja-JP"},
        {"id": "ja-JP-KeitaNeural", "name": "Keita", "gender": "male", "language": "Japanese", "locale": "ja-JP"},
        {"id": "ko-KR-SunHiNeural", "name": "Sun-Hi", "gender": "female", "language": "Korean", "locale": "ko-KR"},
        {"id": "ko-KR-InJoonNeural", "name": "InJoon", "gender": "male", "language": "Korean", "locale": "ko-KR"},
        {"id": "de-DE-KatjaNeural", "name": "Katja", "gender": "female", "language": "German", "locale": "de-DE"},
        {"id": "de-DE-ConradNeural", "name": "Conrad", "gender": "male", "language": "German", "locale": "de-DE"},
        {"id": "fr-FR-DeniseNeural", "name": "Denise", "gender": "female", "language": "French", "locale": "fr-FR"},
        {"id": "fr-FR-HenriNeural", "name": "Henri", "gender": "male", "language": "French", "locale": "fr-FR"},
        {"id": "es-ES-ElviraNeural", "name": "Elvira", "gender": "female", "language": "Spanish", "locale": "es-ES"},
        {"id": "es-ES-AlvaroNeural", "name": "Alvaro", "gender": "male", "language": "Spanish", "locale": "es-ES"},
        {"id": "pt-BR-FranciscaNeural", "name": "Francisca", "gender": "female", "language": "Portuguese", "locale": "pt-BR"},
        {"id": "it-IT-ElsaNeural", "name": "Elsa", "gender": "female", "language": "Italian", "locale": "it-IT"},
        {"id": "ru-RU-SvetlanaNeural", "name": "Svetlana", "gender": "female", "language": "Russian", "locale": "ru-RU"},
        {"id": "hi-IN-SwaraNeural", "name": "Swara", "gender": "female", "language": "Hindi", "locale": "hi-IN"},
        {"id": "ar-SA-ZariyahNeural", "name": "Zariyah", "gender": "female", "language": "Arabic", "locale": "ar-SA"},
    ]
    
    for ev in edge_voices_static:
        voices.append(Voice(
            id=f"edge:{ev['id']}",
            name=ev["name"],
            provider="Edge TTS",
            gender=ev["gender"],
            language=ev["language"],
            locale=ev["locale"],
            description=f"{ev['language']} voice",
            available=True,
        ))
    
    # Apply filters
    if provider:
        voices = [v for v in voices if v.provider.lower() == provider.lower()]
    if language:
        voices = [v for v in voices if language.lower() in v.language.lower()]
    if gender:
        voices = [v for v in voices if v.gender.lower() == gender.lower()]
    
    # Provider counts
    providers = {}
    for v in voices:
        providers[v.provider] = providers.get(v.provider, 0) + 1
    
    return VoicesResponse(
        voices=voices,
        total=len(voices),
        providers=providers,
    )


@router.get("/all")
async def get_all_edge_voices():
    """Get all Edge TTS voices (dynamic fetch)"""
    voices = await tts_service.get_edge_voices()
    return {
        "voices": voices,
        "total": len(voices),
    }
