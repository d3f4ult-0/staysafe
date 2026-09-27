"""Metadata and Pilot Configuration endpoints."""
from fastapi import APIRouter
from bengal_safety_map.core.config import settings
from bengal_safety_map.schemas import (
    SystemMetadataResponse,
    PilotAreaConfig,
    TemporalPolicyConfig,
)

router = APIRouter(tags=["System & Health"])


@router.get("/metadata", response_model=SystemMetadataResponse, summary="Application Metadata & Policies")
def get_metadata():
    """Returns application configuration, pilot boundaries, temporal policy, and emergency disclaimers."""
    pilot = PilotAreaConfig(
        area_code=settings.PILOT_AREA_CODE,
        area_name=settings.PILOT_AREA_NAME,
        center_lat=settings.PILOT_CENTER_LAT,
        center_lon=settings.PILOT_CENTER_LON,
        default_zoom=settings.PILOT_DEFAULT_ZOOM,
        bbox=[
            settings.PILOT_BBOX_MIN_LON,
            settings.PILOT_BBOX_MIN_LAT,
            settings.PILOT_BBOX_MAX_LON,
            settings.PILOT_BBOX_MAX_LAT,
        ],
    )

    temporal = TemporalPolicyConfig(
        timezone=settings.TIMEZONE,
        night_start_hour=settings.NIGHT_START_HOUR,
        night_end_hour=settings.NIGHT_END_HOUR,
        night_definition_label=f"{settings.NIGHT_START_HOUR}:00 - 0{settings.NIGHT_END_HOUR}:00 IST",
        missing_time_policy="Never inferred from publication timestamp; classified as unknown_occurrence_time.",
    )

    return SystemMetadataResponse(
        app_name="Bengal Safety Map",
        version="1.0.0",
        environment=settings.APP_ENV,
        active_release_version=settings.ACTIVE_RELEASE_VERSION,
        data_cutoff="2026-09-26T23:59:59Z",
        pilot_area=pilot,
        temporal_policy=temporal,
        disclaimer=(
            "Transparent public-interest mapping tool for publicly reported safety incidents in West Bengal. "
            "Data points and aggregates represent reported/publicly available records and do NOT predict individual "
            "danger or rate neighborhoods as safe or unsafe."
        ),
        emergency_notice=(
            "EMERGENCY NOTICE: If you are in immediate danger, do NOT rely on this application. "
            "Contact official emergency services immediately via National Emergency Helpline: 112."
        ),
        privacy_safeguards={
            "pii_retention": "Zero direct PII stored in public models",
            "k_anonymity_threshold": settings.MIN_AGGREGATE_COUNT,
            "sensitive_categories_spatial_suppression": "Strict suppression for Sexual Offenses, POCSO, Domestic Violence (zero coordinate pins)",
        },
    )
