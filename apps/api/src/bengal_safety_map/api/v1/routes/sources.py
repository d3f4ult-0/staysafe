"""Source Registry and Methodology Endpoints."""
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from bengal_safety_map.core.database import get_db
from bengal_safety_map.models import Source
from bengal_safety_map.schemas import SourceResponse

router = APIRouter(tags=["Sources & Methodology"])


@router.get("/sources", response_model=List[SourceResponse], summary="Source Registry")
def get_sources(db: Session = Depends(get_db)):
    """Returns the comprehensive source registry with adapter status and verification states."""
    sources = db.query(Source).all()
    return sources


@router.get("/methodology", summary="Statistical & Spatial Methodology")
def get_methodology() -> Dict[str, Any]:
    """Returns methodology details, data inclusion/exclusion rules, and small-cell thresholds."""
    return {
        "version": "1.0.0",
        "updated_at": "2026-09-27T00:00:00Z",
        "jurisdiction": "West Bengal, India",
        "principles": [
            "Descriptive Civic Statistics: Zero danger predictions or individual risk rankings.",
            "Append-Only Legal Status: Allegations, FIRs, chargesheets, and court outcomes are discretely tracked.",
            "Strict Non-Inference: Occurrence time is never guessed from publication timestamp.",
            "k-Anonymity Enforcement: Cells with fewer than 5 records are masked to prevent re-identification.",
            "Zero PII: Names of complainants, victims, witnesses, and accused persons are completely stripped.",
        ],
        "night_time_lens": {
            "window": "20:00:00 to 04:59:59 IST",
            "calculation": "Calculated strictly on confirmed occurrence time. Proportion of unknown time is always reported.",
            "caveat": "Night-time distribution variations may stem from policing deployment, public transit availability, or reporting latency, not inherent neighborhood safety.",
        },
        "denominators_and_rates": {
            "policy": "Per-capita rates are computed only when official census or municipal denominators are certified.",
            "current_pilot_denominator": "Census 2011 official counts where available; otherwise raw counts only.",
        },
    }
