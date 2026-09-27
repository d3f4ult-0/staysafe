"""Public Incidents Endpoints with Strict Privacy Controls."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from bengal_safety_map.core.database import get_db
from bengal_safety_map.models import Incident, AdministrativeArea
from bengal_safety_map.schemas import PublicIncidentResponse, PublicIncidentListResponse

router = APIRouter(tags=["Incidents"])


@router.get("/incidents", response_model=PublicIncidentListResponse, summary="List Public Incidents")
def list_incidents(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    category: Optional[str] = Query(None, description="Category filter"),
    time_filter: Optional[str] = Query("all", pattern="^(all|night|day)$"),
    area_id: Optional[str] = Query(None, description="Administrative area filter"),
    db: Session = Depends(get_db),
):
    """
    Returns sanitized public incident records.
    Canonical coordinates and raw addresses are strictly excluded.
    Sensitive categories return null coordinates under strict spatial suppression.
    """
    query = db.query(Incident).filter(Incident.is_withheld == False)

    if category:
        query = query.filter(Incident.category_code == category)

    if time_filter == "night":
        query = query.filter(Incident.is_night == True)
    elif time_filter == "day":
        query = query.filter(Incident.is_night == False)

    if area_id:
        query = query.filter(Incident.administrative_area_id == area_id)

    total = query.count()
    items = query.order_by(Incident.occurred_at.desc().nullslast()).offset((page - 1) * page_size).limit(page_size).all()

    response_items = []
    for inc in items:
        loc = inc.location
        area = inc.area
        parent_district = area.parent.name if area and area.parent else (area.name if area else "West Bengal")

        response_items.append(
            PublicIncidentResponse(
                public_id=inc.public_id,
                category_code=inc.category_code,
                category_name=inc.category.name if inc.category else inc.category_code,
                sensitivity_tier=inc.sensitivity_tier,
                occurred_at=inc.occurred_at,
                occurred_time_precision=inc.occurred_time_precision,
                is_night=inc.is_night,
                reported_at=inc.reported_at,
                published_at=inc.published_at,
                # Protected coordinates are NEVER read; display coordinates only
                latitude=loc.display_latitude if loc else None,
                longitude=loc.display_longitude if loc else None,
                spatial_precision=loc.display_precision if loc else "exact_suppressed",
                administrative_area_name=area.name if area else "West Bengal",
                district_name=parent_district,
                source_name=inc.source.name if inc.source else "Public Record",
                source_url=inc.source.canonical_url if inc.source else "",
                source_verification=inc.source.verification_status if inc.source else "unverified",
                has_case_timeline=inc.case_id is not None,
                case_public_id=inc.case.public_id if inc.case else None,
                is_synthetic=inc.is_synthetic,
            )
        )

    return PublicIncidentListResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=response_items,
        disclaimer=(
            "Incident records reflect documented public reports and administrative filings. "
            "Locations of sensitive categories are generalized or suppressed. An allegation is not evidence of guilt."
        ),
    )


@router.get("/incidents/{public_id}", response_model=PublicIncidentResponse, summary="Get Single Incident Detail")
def get_incident(public_id: str, db: Session = Depends(get_db)):
    """Returns single public incident detail with privacy-preserving fields."""
    inc = db.query(Incident).filter_by(public_id=public_id, is_withheld=False).first()
    if not inc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found or withheld")

    loc = inc.location
    area = inc.area
    parent_district = area.parent.name if area and area.parent else (area.name if area else "West Bengal")

    return PublicIncidentResponse(
        public_id=inc.public_id,
        category_code=inc.category_code,
        category_name=inc.category.name if inc.category else inc.category_code,
        sensitivity_tier=inc.sensitivity_tier,
        occurred_at=inc.occurred_at,
        occurred_time_precision=inc.occurred_time_precision,
        is_night=inc.is_night,
        reported_at=inc.reported_at,
        published_at=inc.published_at,
        latitude=loc.display_latitude if loc else None,
        longitude=loc.display_longitude if loc else None,
        spatial_precision=loc.display_precision if loc else "exact_suppressed",
        administrative_area_name=area.name if area else "West Bengal",
        district_name=parent_district,
        source_name=inc.source.name if inc.source else "Public Record",
        source_url=inc.source.canonical_url if inc.source else "",
        source_verification=inc.source.verification_status if inc.source else "unverified",
        has_case_timeline=inc.case_id is not None,
        case_public_id=inc.case.public_id if inc.case else None,
        is_synthetic=inc.is_synthetic,
    )
