from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean
from datetime import datetime
from app.database import Base


class GenerationToken(Base):
    __tablename__ = "generation_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, index=True, nullable=False)
    total_tokens = Column(Integer, default=0)
    used_tokens = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    @property
    def remaining_tokens(self):
        return self.total_tokens - self.used_tokens


class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, index=True, nullable=False)
    checkout_id = Column(String, unique=True, nullable=False)
    product_sku = Column(String, nullable=False)
    amount_cents = Column(Integer, nullable=False)
    currency = Column(String, default="USD")
    status = Column(String, default="pending")  # pending, completed, failed
    tokens_granted = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)


class FreeTrialUsage(Base):
    __tablename__ = "free_trial_usage"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, unique=True, index=True, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class VoiceGeneration(Base):
    __tablename__ = "voice_generations"
    
    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(String, index=True, nullable=False)
    voice_id = Column(String, nullable=False)
    provider = Column(String, nullable=False)
    text_length = Column(Integer, nullable=False)
    audio_duration_seconds = Column(Float, nullable=True)
    audio_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
