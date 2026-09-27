"""Map Aggregates and Privacy-Safe Binning Endpoints."""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from bengal_safety_map.core.database import get_db
from bengal_safety_map.core.config import settings
from bengal_safety_map.models import AdministrativeArea, Incident
from bengal_safety_map.schemas import AggregateFeatureCollection, AggregateFeature, AggregateProperties
from bengal_safety_map.services.privacy.anonymizer import apply_small_cell_suppression

router = APIRouter(tags=["Map & Spatial Aggregates"])


@router.get("/map/aggregates", response_model=AggregateFeatureCollection, summary="Map Spatial Aggregates")
def get_map_aggregates(
    time_filter: Optional[str] = Query("all", pattern="^(all|night|day)$", description="Filter by temporal window"),
    category: Optional[str] = Query(None, description="Filter by incident category code"),
    db: Session = Depends(get_db),
):
    """
    Returns privacy-safe spatial aggregates formatted as GeoJSON FeatureCollection.
    Enforces small-cell suppression (k-anonymity): any aggregate with fewer than 5 records displays '<5'.
    """
    areas = db.query(AdministrativeArea).filter_by(area_type="ward").all()
    features = []
    suppressed_count = 0

    for area in areas:
        query = db.query(Incident).filter_by(administrative_area_id=area.id, is_withheld=False)
        if category:
            query = query.filter_by(category_code=category)

        incidents = query.all()
        total_in_area = len(incidents)
        night_in_area = len([i for i in incidents if i.is_night is True])
        day_in_area = len([i for i in incidents if i.is_night is False])
        unknown_in_area = len([i for i in incidents if i.is_night is None])

        # Filter count based on requested time_filter
        if time_filter == "night":
            effective_count = night_in_area
        elif time_filter == "day":
            effective_count = day_in_area
        else:
            effective_count = total_in_area

        # Apply k-anonymity small-cell suppression
        display_total, is_supp = apply_small_cell_suppression(effective_count, settings.MIN_AGGREGATE_COUNT)
        if is_supp:
            suppressed_count += 1
            display_night = f"<{settings.MIN_AGGREGATE_COUNT}"
            display_day = f"<{settings.MIN_AGGREGATE_COUNT}"
        else:
            display_night = night_in_area
            display_day = day_in_area

        feature = AggregateFeature(
            id=f"agg_{area.id}",
            geometry={
                "type": "Point",
                "coordinates": [area.center_lon, area.center_lat],
            },
            properties=AggregateProperties(
                cell_id=f"cell_{area.id}",
                total_count=display_total,
                night_count=display_night,
                day_count=display_day,
                unknown_time_count=unknown_in_area,
                is_suppressed=is_supp,
                dominant_category=incidents[0].category_code if incidents else None,
            ),
        )
        features.append(feature)

    return AggregateFeatureCollection(
        features=features,
        metadata={
            "time_filter": time_filter,
            "category_filter": category or "all",
            "small_cell_threshold": settings.MIN_AGGREGATE_COUNT,
            "total_cells": len(features),
            "suppressed_cells": suppressed_count,
            "disclaimer": "Aggregates represent reported incidents and do not predict individual danger.",
        },
    )
