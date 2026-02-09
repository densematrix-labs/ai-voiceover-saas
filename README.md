# VoiceForge AI — Multi-Provider AI Voiceover SaaS

聚合多家 AI TTS 服务商的语音，为内容创作者提供一站式配音解决方案。

## Features

- 🎙️ **Multi-Provider**: Access voices from OpenAI, Edge TTS, and more
- 🌍 **50+ Languages**: Native voices for global content
- ⚡ **Lightning Fast**: Generate voiceovers in seconds
- 💳 **Pay-as-you-go**: No subscriptions, buy tokens when you need them

## Tech Stack

- **Frontend**: React + Vite (TypeScript), Tailwind CSS
- **Backend**: Python FastAPI
- **TTS Providers**: OpenAI TTS, Edge TTS
- **Deployment**: Docker

## Quick Start

### Local Development

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

### Docker Deployment

```bash
docker-compose up -d --build
```

## Environment Variables

```bash
# Backend
LLM_PROXY_URL=https://llm-proxy.densematrix.ai
LLM_PROXY_KEY=your-key
CREEM_API_KEY=your-creem-key
CREEM_WEBHOOK_SECRET=your-webhook-secret
CREEM_PRODUCT_IDS='{"basic":"prod_xxx","standard":"prod_yyy","pro":"prod_zzz"}'
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/voices/` | GET | List available voices |
| `/api/v1/tts/generate` | POST | Generate voiceover |
| `/api/v1/tts/preview` | POST | Preview voice (100 chars max) |
| `/api/v1/tokens/status` | GET | Get token status |
| `/api/v1/payment/products` | GET | List products |
| `/api/v1/payment/checkout` | POST | Create checkout session |

## License

© 2026 DenseMatrix Labs
