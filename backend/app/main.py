from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from app.config import get_settings
from app.api.v1 import tts, voices, payment, tokens
from app.database import create_tables
from app.metrics import metrics_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    create_tables()
    # Create audio directory
    os.makedirs("audio_output", exist_ok=True)
    yield
    # Shutdown
    pass


app = FastAPI(
    title=settings.APP_NAME,
    description="Multi-provider AI voiceover platform",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for generated audio
app.mount("/audio", StaticFiles(directory="audio_output"), name="audio")

# Routes
app.include_router(tts.router, prefix="/api/v1/tts", tags=["TTS"])
app.include_router(voices.router, prefix="/api/v1/voices", tags=["Voices"])
app.include_router(payment.router, prefix="/api/v1/payment", tags=["Payment"])
app.include_router(tokens.router, prefix="/api/v1/tokens", tags=["Tokens"])
app.include_router(metrics_router, tags=["Metrics"])


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": settings.APP_NAME}


@app.get("/")
async def root():
    return {
        "message": "Welcome to AI Voiceover SaaS API",
        "docs": "/docs",
        "health": "/health",
    }
