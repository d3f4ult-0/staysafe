"""Dataset Releases, Precomputed Aggregates, Offline Packages, and Audit Models."""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Integer, Boolean, Text, ForeignKey, JSON
from bengal_safety_map.core.database import Base


class DatasetRelease(Base):
    __tablename__ = "dataset_releases"

    id = Column(String(50), primary_key=True)  # e.g. synthetic_demo_v1 or release_2026_09_27
    version = Column(String(50), nullable=False)
    published_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    data_cutoff = Column(DateTime(timezone=True), nullable=False)
    is_synthetic = Column(Boolean, default=False, nullable=False)
    record_count = Column(Integer, default=0, nullable=False)
    description = Column(Text, nullable=False)


class PublicAggregate(Base):
    """
    Precomputed privacy-safe aggregate counts by cell/area and time filter.
    Enforces small-cell suppression (is_suppressed = True if count < MIN_AGGREGATE_COUNT).
    """
    __tablename__ = "public_aggregates"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    release_id = Column(String(50), ForeignKey("dataset_releases.id"), nullable=False)
    area_id = Column(String(100), ForeignKey("administrative_areas.id"), nullable=False)
    cell_id = Column(String(100), nullable=False, index=True)
    cell_geojson = Column(JSON, nullable=False)
    category_code = Column(String(100), nullable=True)  # NULL for all categories aggregate
    time_filter = Column(String(20), default="all", nullable=False)  # all, night, day
    count = Column(Integer, default=0, nullable=False)
    is_suppressed = Column(Boolean, default=False, nullable=False)


class OfflinePackage(Base):
    __tablename__ = "offline_packages"

    id = Column(String(50), primary_key=True)  # e.g. pkg_kolkata_metro_v1
    area_code = Column(String(100), nullable=False)
    area_name = Column(String(255), nullable=False)
    release_version = Column(String(50), nullable=False)
    data_cutoff = Column(DateTime(timezone=True), nullable=False)
    record_count = Column(Integer, nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    sha256_checksum = Column(String(64), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_stale = Column(Boolean, default=False, nullable=False)
    package_payload_json = Column(JSON, nullable=False)  # Full offline package bundle


class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    actor = Column(String(100), nullable=False)
    action = Column(String(100), nullable=False)  # e.g. ingest_run, takedown_record, approve_dedup, release_publish
    target_entity = Column(String(100), nullable=False)
    target_id = Column(String(100), nullable=True)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
