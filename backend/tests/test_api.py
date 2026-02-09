import pytest


def test_health_check(client):
    """Test health endpoint returns 200"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


def test_root_endpoint(client):
    """Test root endpoint returns API info"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "docs" in data


def test_list_voices(client):
    """Test listing available voices"""
    response = client.get("/api/v1/voices/")
    assert response.status_code == 200
    data = response.json()
    assert "voices" in data
    assert "total" in data
    assert "providers" in data
    assert len(data["voices"]) > 0


def test_list_voices_filter_provider(client):
    """Test filtering voices by provider"""
    response = client.get("/api/v1/voices/?provider=OpenAI")
    assert response.status_code == 200
    data = response.json()
    for voice in data["voices"]:
        assert voice["provider"] == "OpenAI"


def test_list_voices_filter_language(client):
    """Test filtering voices by language"""
    response = client.get("/api/v1/voices/?language=English")
    assert response.status_code == 200
    data = response.json()
    for voice in data["voices"]:
        assert "English" in voice["language"]


def test_token_status_new_device(client, device_id):
    """Test token status for new device"""
    response = client.get(
        "/api/v1/tokens/status",
        headers={"X-Device-Id": device_id}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total_tokens"] == 0
    assert data["remaining_tokens"] == 0
    assert data["free_trial_available"] == True
    assert data["free_trial_used"] == False


def test_token_status_missing_header(client):
    """Test token status without device ID returns 422"""
    response = client.get("/api/v1/tokens/status")
    assert response.status_code == 422


def test_list_products(client):
    """Test listing available products"""
    response = client.get("/api/v1/payment/products")
    assert response.status_code == 200
    data = response.json()
    assert "products" in data
    assert len(data["products"]) > 0
    
    for product in data["products"]:
        assert "id" in product
        assert "name" in product
        assert "tokens" in product
        assert "price" in product


def test_metrics_endpoint(client):
    """Test metrics endpoint returns prometheus data"""
    response = client.get("/metrics")
    assert response.status_code == 200
    assert "text/plain" in response.headers["content-type"] or "text/plain" in str(response.headers.get("content-type", ""))


def test_tts_generate_missing_device_id(client):
    """Test TTS generation without device ID returns 422"""
    response = client.post(
        "/api/v1/tts/generate",
        json={"text": "Hello", "voice_id": "openai:alloy", "speed": 1.0}
    )
    assert response.status_code == 422


def test_tts_generate_invalid_voice_format(client, device_id):
    """Test TTS generation with invalid voice format"""
    response = client.post(
        "/api/v1/tts/generate",
        json={"text": "Hello", "voice_id": "invalid", "speed": 1.0},
        headers={"X-Device-Id": device_id}
    )
    assert response.status_code == 400
    data = response.json()
    assert "Invalid voice_id format" in data["detail"]


def test_tts_generate_text_too_long(client, device_id):
    """Test TTS generation with text exceeding limit"""
    response = client.post(
        "/api/v1/tts/generate",
        json={"text": "a" * 5001, "voice_id": "openai:alloy", "speed": 1.0},
        headers={"X-Device-Id": device_id}
    )
    assert response.status_code == 422


def test_tts_generate_empty_text(client, device_id):
    """Test TTS generation with empty text"""
    response = client.post(
        "/api/v1/tts/generate",
        json={"text": "", "voice_id": "openai:alloy", "speed": 1.0},
        headers={"X-Device-Id": device_id}
    )
    assert response.status_code == 422


def test_tts_generate_speed_out_of_range(client, device_id):
    """Test TTS generation with invalid speed"""
    response = client.post(
        "/api/v1/tts/generate",
        json={"text": "Hello", "voice_id": "openai:alloy", "speed": 5.0},
        headers={"X-Device-Id": device_id}
    )
    assert response.status_code == 422
