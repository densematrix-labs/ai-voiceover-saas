import pytest
from app.services.tts_service import TTSService


def test_openai_voices_defined():
    """Test OpenAI voices are properly defined"""
    assert len(TTSService.OPENAI_VOICES) == 6
    
    expected_voices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"]
    for voice in expected_voices:
        assert voice in TTSService.OPENAI_VOICES
        assert "name" in TTSService.OPENAI_VOICES[voice]
        assert "gender" in TTSService.OPENAI_VOICES[voice]
        assert "description" in TTSService.OPENAI_VOICES[voice]


def test_voice_has_required_fields():
    """Test each voice has required metadata"""
    for voice_id, voice_info in TTSService.OPENAI_VOICES.items():
        assert isinstance(voice_info["name"], str)
        assert voice_info["gender"] in ["male", "female", "neutral"]
        assert len(voice_info["description"]) > 0


@pytest.mark.asyncio
async def test_get_edge_voices():
    """Test getting Edge TTS voices (may be empty if service unavailable)"""
    service = TTSService()
    voices = await service.get_edge_voices()
    # Just check it returns a list
    assert isinstance(voices, list)
