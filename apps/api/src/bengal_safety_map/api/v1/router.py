"""API v1 Aggregated Router."""
from fastapi import APIRouter
from bengal_safety_map.api.v1.routes import (
    health,
    metadata,
    sources,
    areas,
    aggregates,
    incidents,
    cases,
    releases,
    packages,
    feedback,
    admin,
)

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(metadata.router)
api_router.include_router(sources.router)
api_router.include_router(areas.router)
api_router.include_router(aggregates.router)
api_router.include_router(incidents.router)
api_router.include_router(cases.router)
api_router.include_router(releases.router)
api_router.include_router(packages.router)
api_router.include_router(feedback.router)
api_router.include_router(admin.router)
