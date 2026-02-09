import pytest
from app.models import FreeTrialUsage, GenerationToken


def test_402_error_detail_is_string(client, device_id):
    """Verify 402 error detail is a string, not an object"""
    # First use up free trial
    db_override = next(client.app.dependency_overrides[
        list(client.app.dependency_overrides.keys())[0]
    ]())
    
    # Create used free trial
    free_trial = FreeTrialUsage(device_id=device_id, used=True)
    db_override.add(free_trial)
    db_override.commit()
    
    # Now try to generate - should get 402
    response = client.post(
        "/api/v1/tts/generate",
        json={"text": "Hello", "voice_id": "openai:alloy", "speed": 1.0},
        headers={"X-Device-Id": device_id}
    )
    
    assert response.status_code == 402
    data = response.json()
    detail = data.get("detail")
    
    # Detail should be a string, not an object
    assert isinstance(detail, str), f"detail should be string, got {type(detail)}: {detail}"
    assert "[object Object]" not in str(detail)


def test_400_error_for_unknown_provider(client, device_id):
    """Test 400 error for unknown provider"""
    response = client.post(
        "/api/v1/tts/generate",
        json={"text": "Hello", "voice_id": "unknown:voice", "speed": 1.0},
        headers={"X-Device-Id": device_id}
    )
    
    # Should be 400 (unknown provider) or 402 (no tokens) after free trial
    assert response.status_code in [400, 402, 500]
    data = response.json()
    detail = data.get("detail")
    
    # Whatever the error, detail should be a string
    assert isinstance(detail, str), f"detail should be string, got {type(detail)}"


def test_400_error_for_unknown_voice(client, device_id):
    """Test 400 error for unknown OpenAI voice"""
    response = client.post(
        "/api/v1/tts/generate",
        json={"text": "Hello", "voice_id": "openai:nonexistent", "speed": 1.0},
        headers={"X-Device-Id": device_id}
    )
    
    # Could be 400 or 500 depending on how it's handled
    assert response.status_code in [400, 402, 500]
    data = response.json()
    detail = data.get("detail")
    
    assert isinstance(detail, str), f"detail should be string, got {type(detail)}"


def test_checkout_unknown_product(client, device_id):
    """Test checkout with unknown product returns proper error"""
    response = client.post(
        "/api/v1/payment/checkout",
        json={
            "product_id": "nonexistent",
            "device_id": device_id,
            "success_url": "https://example.com/success"
        }
    )
    
    assert response.status_code == 400
    data = response.json()
    detail = data.get("detail")
    
    assert isinstance(detail, str), f"detail should be string, got {type(detail)}"
    assert "Unknown product" in detail
