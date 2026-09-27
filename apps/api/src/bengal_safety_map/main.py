"""FastAPI Application Entrypoint for Bengal Safety Map."""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from bengal_safety_map.core.config import settings
from bengal_safety_map.api.v1.router import api_router
from bengal_safety_map.core.database import engine, Base

# Create database tables if not existing
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Bengal Safety Map API",
    version="1.0.0",
    description=(
        "Production-oriented civic-tech API for transparent, public-interest incident mapping, "
        "night-time pattern analysis, and institutional case timelines across West Bengal, India."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


# Mount API v1 router under /api/v1 prefix
app.include_router(api_router, prefix=settings.API_V1_PREFIX)

# Also mount health and ready on root for standard container orchestrators
from bengal_safety_map.api.v1.routes.health import router as health_router
app.include_router(health_router)


@app.get("/")
def root():
    return {
        "service": "Bengal Safety Map API",
        "version": "1.0.0",
        "documentation": "/docs",
        "pilot_area": settings.PILOT_AREA_NAME,
        "emergency_helpline": "112 (West Bengal)",
    }
