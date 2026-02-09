from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    APP_NAME: str = "AI Voiceover SaaS"
    DEBUG: bool = False
    TOOL_NAME: str = "voiceover"
    
    # LLM Proxy (for OpenAI TTS)
    LLM_PROXY_URL: str = "https://llm-proxy.densematrix.ai"
    LLM_PROXY_KEY: str = ""
    
    # Database
    DATABASE_URL: str = "sqlite:///./app.db"
    
    # Creem Payment
    CREEM_API_KEY: str = ""
    CREEM_WEBHOOK_SECRET: str = ""
    CREEM_PRODUCT_IDS: str = "{}"  # JSON string
    
    # CORS
    CORS_ORIGINS: str = "*"
    
    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()
