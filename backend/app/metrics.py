import os
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from fastapi import APIRouter, Response

TOOL_NAME = os.getenv("TOOL_NAME", "voiceover")

# HTTP Metrics
http_requests = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["tool", "endpoint", "method", "status"]
)

http_request_duration = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration",
    ["tool", "endpoint"]
)

# Payment Metrics
payment_success = Counter(
    "payment_success_total",
    "Successful payments",
    ["tool", "product_sku"]
)

payment_revenue_cents = Counter(
    "payment_revenue_cents_total",
    "Total revenue in cents",
    ["tool"]
)

# Token Metrics
tokens_consumed = Counter(
    "tokens_consumed_total",
    "Total tokens consumed",
    ["tool"]
)

free_trial_used = Counter(
    "free_trial_used_total",
    "Free trial usage count",
    ["tool"]
)

# TTS Specific Metrics
tts_generations = Counter(
    "tts_generations_total",
    "Total TTS generations",
    ["tool", "provider", "voice_id"]
)

tts_characters_processed = Counter(
    "tts_characters_processed_total",
    "Total characters processed",
    ["tool", "provider"]
)

# SEO Metrics
page_views = Counter(
    "page_views_total",
    "Page views",
    ["tool", "page"]
)

crawler_visits = Counter(
    "crawler_visits_total",
    "Crawler visits",
    ["tool", "bot"]
)

programmatic_pages_count = Gauge(
    "programmatic_pages_count",
    "Number of programmatic SEO pages",
    ["tool"]
)

# Router
metrics_router = APIRouter()


@metrics_router.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)
