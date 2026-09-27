"""Health and Readiness endpoints."""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from bengal_safety_map.core.database import get_db

router = APIRouter(tags=["System & Health"])


@router.get("/health", summary="Liveness Probe")
def get_health():
    """Returns application liveness state."""
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "bengal-safety-map-api",
    }


@router.get("/ready", summary="Readiness Probe")
def get_ready(db: Session = Depends(get_db)):
    """Verifies database connectivity."""
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "ready",
            "database": "connected",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connectivity failed: {str(e)}",
        )
