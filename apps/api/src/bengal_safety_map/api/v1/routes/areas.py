"""Administrative Areas and Area Summary Endpoints."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from bengal_safety_map.core.database import get_db
from bengal_safety_map.models import AdministrativeArea, Incident, Case
from bengal_safety_map.schemas import AdministrativeAreaResponse, AreaSummaryResponse

router = APIRouter(tags=["Administrative Geography"])


@router.get("/areas", response_model=List[AdministrativeAreaResponse], summary="List Administrative Areas")
def list_areas(
    parent_id: Optional[str] = Query(None, description="Filter by parent area ID"),
    area_type: Optional[str] = Query(None, description="Filter by area type (district, ward)"),
    db: Session = Depends(get_db),
):
    """Returns list of supported administrative geographies in West Bengal."""
    query = db.query(AdministrativeArea)
    if parent_id is not None:
        query = query.filter(AdministrativeArea.parent_id == parent_id)
    if area_type is not None:
        query = query.filter(AdministrativeArea.area_type == area_type)
    return query.all()


@router.get("/areas/{area_id}", response_model=AdministrativeAreaResponse, summary="Get Single Area")
def get_area(area_id: str, db: Session = Depends(get_db)):
    """Returns details for a specific administrative area."""
    area = db.query(AdministrativeArea).filter_by(id=area_id).first()
    if not area:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Area not found")
    return area


@router.get("/areas/{area_id}/summary", response_model=AreaSummaryResponse, summary="Area Descriptive Summary")
def get_area_summary(area_id: str, db: Session = Depends(get_db)):
    """
    Computes non-alarmist descriptive summary for an area:
    - Counts of reported records
    - Night vs Day breakdown and Unknown occurrence time proportion
    - Available court-recorded outcomes
    - Sourced per-capita normalization if valid denominator exists, with explicit caveats
    """
    area = db.query(AdministrativeArea).filter_by(id=area_id).first()
    if not area:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Area not found")

    # Fetch incidents for this area or its child wards if it's a district
    if area.area_type == "district":
        child_ids = [c.id for c in area.children] + [area.id]
        incidents = db.query(Incident).filter(Incident.administrative_area_id.in_(child_ids)).all()
    else:
        incidents = db.query(Incident).filter_by(administrative_area_id=area.id).all()

    total_records = len(incidents)
    night_records = len([i for i in incidents if i.is_night is True])
    day_records = len([i for i in incidents if i.is_night is False])
    unknown_time_records = len([i for i in incidents if i.is_night is None])

    known_time_total = night_records + day_records
    night_time_share_pct = round((night_records / known_time_total) * 100, 1) if known_time_total > 0 else None
    unknown_time_pct = round((unknown_time_records / total_records) * 100, 1) if total_records > 0 else 0.0

    # Count court outcomes associated with cases in this area
    court_outcomes_count = (
        db.query(Case)
        .filter(Case.administrative_area_id == area.id)
        .filter(Case.current_status.in_(["convicted", "acquitted"]))
        .count()
    )

    # Distinct sources count
    source_ids = {i.source_id for i in incidents}

    # Per-capita calculation
    denominator_used = None
    rate_per_capita = None
    uncertainty_notes = []
    caveats = [
        "Reported numbers reflect public complaints and formal administrative filings, not actual total events.",
        "Night-time comparisons are based strictly on records with documented incident occurrence times.",
    ]

    if area.population_2011 and area.population_2011 > 0:
        denominator_used = f"Census of India 2011 ({area.population_2011:,} residents)"
        rate_per_capita = round((total_records / area.population_2011) * 100000, 2)
        caveats.append("Per-capita rates use 2011 baseline figures; changes in commercial footfall and residency apply.")
    else:
        uncertainty_notes.append("Authoritative population denominator unavailable for this specific zone; raw counts shown.")

    if unknown_time_pct > 20:
        uncertainty_notes.append(f"Significant temporal missingness: {unknown_time_pct}% of records lack exact occurrence time.")

    parent_name = area.parent.name if area.parent else area.name

    return AreaSummaryResponse(
        area_id=area.id,
        area_name=area.name,
        area_type=area.area_type,
        district_name=parent_name,
        total_records=total_records,
        night_records=night_records,
        day_records=day_records,
        unknown_time_records=unknown_time_records,
        night_time_share_pct=night_time_share_pct,
        unknown_time_pct=unknown_time_pct,
        available_court_outcomes_count=court_outcomes_count,
        sources_count=len(source_ids),
        freshness_latest_record="2026-09-24",
        data_cutoff_date="2026-09-26",
        denominator_used=denominator_used,
        rate_per_capita=rate_per_capita,
        uncertainty_notes=uncertainty_notes,
        caveats=caveats,
    )
