import httpx
import edge_tts
import uuid
import os
from typing import Optional, Dict, Any
from app.config import get_settings

settings = get_settings()


class TTSService:
    """Multi-provider TTS service"""
    
    # OpenAI voices
    OPENAI_VOICES = {
        "alloy": {"name": "Alloy", "gender": "neutral", "description": "Balanced and versatile"},
        "echo": {"name": "Echo", "gender": "male", "description": "Clear and confident"},
        "fable": {"name": "Fable", "gender": "female", "description": "Warm and expressive"},
        "onyx": {"name": "Onyx", "gender": "male", "description": "Deep and authoritative"},
        "nova": {"name": "Nova", "gender": "female", "description": "Friendly and upbeat"},
        "shimmer": {"name": "Shimmer", "gender": "female", "description": "Soft and soothing"},
    }
    
    @staticmethod
    async def generate_openai(text: str, voice: str, speed: float = 1.0) -> Optional[str]:
        """Generate TTS using OpenAI via llm-proxy"""
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{settings.LLM_PROXY_URL}/v1/audio/speech",
                    headers={
                        "Authorization": f"Bearer {settings.LLM_PROXY_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": "tts-1",
                        "input": text,
                        "voice": voice,
                        "response_format": "mp3",
                        "speed": speed,
                    },
                )
                
                if response.status_code == 200:
                    # Save audio file
                    filename = f"{uuid.uuid4()}.mp3"
                    filepath = f"audio_output/{filename}"
                    with open(filepath, "wb") as f:
                        f.write(response.content)
                    return filename
                else:
                    print(f"OpenAI TTS error: {response.status_code} - {response.text}")
                    return None
        except Exception as e:
            print(f"OpenAI TTS exception: {e}")
            return None
    
    @staticmethod
    async def generate_edge_tts(text: str, voice: str, rate: str = "+0%") -> Optional[str]:
        """Generate TTS using Edge TTS (free)"""
        try:
            filename = f"{uuid.uuid4()}.mp3"
            filepath = f"audio_output/{filename}"
            
            communicate = edge_tts.Communicate(text, voice, rate=rate)
            await communicate.save(filepath)
            
            if os.path.exists(filepath):
                return filename
            return None
        except Exception as e:
            print(f"Edge TTS exception: {e}")
            return None
    
    @staticmethod
    async def get_edge_voices() -> list:
        """Get all available Edge TTS voices"""
        try:
            voices = await edge_tts.list_voices()
            return voices
        except Exception as e:
            print(f"Error getting Edge voices: {e}")
            return []


# Singleton instance
tts_service = TTSService()
