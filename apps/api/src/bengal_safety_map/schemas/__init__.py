"""Pydantic Schemas for Bengal Safety Map API."""
from typing import List, Optional, Any, Dict
from datetime import datetime
from pydantic import BaseModel, Field


# -------------------------------------------------------------
# Metadata Schemas
# -------------------------------------------------------------
class PilotAreaConfig(BaseModel):
    area_code: str
    area_name: str
    center_lat: float
    center_lon: float
    default_zoom: int
    bbox: List[float]  # [min_lon, min_lat, max_lon, max_lat]


class TemporalPolicyConfig(BaseModel):
    timezone: str
    night_start_hour: int
    night_end_hour: int
    night_definition_label: str
    missing_time_policy: str


class SystemMetadataResponse(BaseModel):
    app_name: str
    version: str
    environment: str
    active_release_version: str
    data_cutoff: str
    pilot_area: PilotAreaConfig
    temporal_policy: TemporalPolicyConfig
    disclaimer: str
    emergency_notice: str
    privacy_safeguards: Dict[str, Any]


# -------------------------------------------------------------
# Source Schemas
# -------------------------------------------------------------
class SourceResponse(BaseModel):
    id: str
    name: str
    organization: str
    source_type: str
    status: str
    canonical_url: str
    license_terms: str
    coverage_jurisdiction: str
    coverage_period: str
    verification_status: str

    model_config = {"from_attributes": True}


# -------------------------------------------------------------
# Administrative Area & Summary Schemas
# -------------------------------------------------------------
class AdministrativeAreaResponse(BaseModel):
    id: str
    name: str
    parent_id: Optional[str] = None
    area_type: str
    center_lat: float
    center_lon: float
    population_2011: Optional[int] = None

    model_config = {"from_attributes": True}


class AreaSummaryResponse(BaseModel):
    area_id: str
    area_name: str
    area_type: str
    district_name: str
    total_records: int
    night_records: int
    day_records: int
    unknown_time_records: int
    night_time_share_pct: Optional[float] = None
    unknown_time_pct: float
    available_court_outcomes_count: int
    sources_count: int
    freshness_latest_record: str
    data_cutoff_date: str
    denominator_used: Optional[str] = None
    rate_per_capita: Optional[float] = None
    uncertainty_notes: List[str]
    caveats: List[str]


# -------------------------------------------------------------
# Aggregate Map Feature Schemas
# -------------------------------------------------------------
class AggregateProperties(BaseModel):
    cell_id: str
    total_count: Any  # integer or string "<5"
    night_count: Any
    day_count: Any
    unknown_time_count: int
    is_suppressed: bool
    dominant_category: Optional[str] = None


class AggregateFeature(BaseModel):
    type: str = "Feature"
    id: str
    geometry: Dict[str, Any]
    properties: AggregateProperties


class AggregateFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[AggregateFeature]
    metadata: Dict[str, Any]


# -------------------------------------------------------------
# Incident Schemas (Strictly Sanitized Public Output)
# -------------------------------------------------------------
class PublicIncidentResponse(BaseModel):
    public_id: str
    category_code: str
    category_name: str
    sensitivity_tier: str
    occurred_at: Optional[datetime] = None
    occurred_time_precision: str
    is_night: Optional[bool] = None
    reported_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    # Public display coordinates only. NULL if strictly suppressed.
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    spatial_precision: str
    administrative_area_name: str
    district_name: str
    source_name: str
    source_url: str
    source_verification: str
    has_case_timeline: bool = False
    case_public_id: Optional[str] = None
    is_synthetic: bool = True

    model_config = {"from_attributes": True}


class PublicIncidentListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[PublicIncidentResponse]
    disclaimer: str


# -------------------------------------------------------------
# Case and Timeline Schemas
# -------------------------------------------------------------
class CaseEventResponse(BaseModel):
    id: str
    event_order: int
    status: str
    status_label: str
    effective_date: datetime
    effective_date_precision: str
    recorded_at: datetime
    source_id: str
    source_name: str
    source_url: str
    source_excerpt: Optional[str] = None
    is_guilt_finding: bool
    notes: Optional[str] = None

    model_config = {"from_attributes": True}


class CaseDetailResponse(BaseModel):
    id: str
    public_id: str
    category_code: str
    category_name: str
    primary_area_name: str
    jurisdiction_name: str
    current_status: str
    current_status_label: str
    is_guilt_proven: bool
    disclaimer: str
    timeline: List[CaseEventResponse]

    model_config = {"from_attributes": True}


# -------------------------------------------------------------
# Offline Package & Release Schemas
# -------------------------------------------------------------
class DatasetReleaseResponse(BaseModel):
    id: str
    version: str
    published_at: datetime
    data_cutoff: datetime
    is_synthetic: bool
    record_count: int
    description: str

    model_config = {"from_attributes": True}


class OfflinePackageResponse(BaseModel):
    package_id: str
    area_code: str
    area_name: str
    release_version: str
    data_cutoff: str
    record_count: int
    file_size_bytes: int
    sha256_checksum: str
    created_at: str
    expires_at: str
    is_stale: bool
    download_url: str


# -------------------------------------------------------------
# Feedback Schemas
# -------------------------------------------------------------
class FeedbackCreateRequest(BaseModel):
    subject_type: str = Field(..., pattern="^(incident|case|source|boundary|general)$")
    reference_id: Optional[str] = None
    report_text: str = Field(..., min_length=10, max_length=5000)
    contact_email: Optional[str] = None


class FeedbackResponse(BaseModel):
    id: str
    status: str
    message: str
    created_at: datetime
