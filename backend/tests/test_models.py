import pytest
from app.models import GenerationToken, FreeTrialUsage, PaymentTransaction, VoiceGeneration


def test_generation_token_remaining(client):
    """Test GenerationToken remaining_tokens property"""
    from app.database import get_db
    
    db = next(client.app.dependency_overrides[get_db]())
    
    token = GenerationToken(
        device_id="test-device",
        total_tokens=100,
        used_tokens=30
    )
    db.add(token)
    db.commit()
    
    assert token.remaining_tokens == 70


def test_free_trial_usage_creation(client):
    """Test FreeTrialUsage creation"""
    from app.database import get_db
    
    db = next(client.app.dependency_overrides[get_db]())
    
    trial = FreeTrialUsage(device_id="test-device", used=False)
    db.add(trial)
    db.commit()
    
    assert trial.id is not None
    assert trial.used == False


def test_payment_transaction_creation(client):
    """Test PaymentTransaction creation"""
    from app.database import get_db
    
    db = next(client.app.dependency_overrides[get_db]())
    
    transaction = PaymentTransaction(
        device_id="test-device",
        checkout_id="checkout-123",
        product_sku="basic",
        amount_cents=499,
        tokens_granted=10
    )
    db.add(transaction)
    db.commit()
    
    assert transaction.id is not None
    assert transaction.status == "pending"


def test_voice_generation_creation(client):
    """Test VoiceGeneration creation"""
    from app.database import get_db
    
    db = next(client.app.dependency_overrides[get_db]())
    
    generation = VoiceGeneration(
        device_id="test-device",
        voice_id="openai:alloy",
        provider="openai",
        text_length=100
    )
    db.add(generation)
    db.commit()
    
    assert generation.id is not None
    assert generation.created_at is not None
