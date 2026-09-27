"""Source and Ingestion Run Data Models."""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Integer, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from bengal_safety_map.core.database import Base


class Source(Base):
    __tablename__ = "sources"

    id = Column(String(100), primary_key=True)
    name = Column(String(255), nullable=False)
    organization = Column(String(255), nullable=False)
    source_type = Column(String(50), nullable=False)  # official, court, civic, media_evidence, synthetic_demo
    status = Column(String(50), default="unconfigured", nullable=False)  # unconfigured, disabled, active_pilot, synthetic_demo
    canonical_url = Column(Text, nullable=False)
    license_terms = Column(String(255), nullable=False)
    coverage_jurisdiction = Column(String(255), nullable=False)
    coverage_period = Column(String(100), nullable=False)
    verification_status = Column(String(50), default="unverified", nullable=False)  # unverified, reviewed, verified, rejected, superseded
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    runs = relationship("SourceRun", back_populates="source", cascade="all, delete-orphan")


class SourceRun(Base):
    __tablename__ = "source_runs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source_id = Column(String(100), ForeignKey("sources.id"), nullable=False)
    status = Column(String(50), default="running", nullable=False)  # running, completed, failed
    started_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime(timezone=True), nullable=True)
    records_read = Column(Integer, default=0)
    records_written = Column(Integer, default=0)
    records_quarantined = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    content_hash = Column(String(64), nullable=True)

    source = relationship("Source", back_populates="runs")
    artifacts = relationship("RawArtifact", back_populates="source_run", cascade="all, delete-orphan")


class RawArtifact(Base):
    __tablename__ = "raw_artifacts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source_run_id = Column(String(36), ForeignKey("source_runs.id"), nullable=False)
    artifact_hash = Column(String(64), nullable=False)
    storage_path = Column(Text, nullable=True)
    retrieval_timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    source_run = relationship("SourceRun", back_populates="artifacts")


class RawRecord(Base):
    __tablename__ = "raw_records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    source_id = Column(String(100), ForeignKey("sources.id"), nullable=False)
    raw_payload = Column(JSON, nullable=False)
    parse_status = Column(String(50), default="staged", nullable=False)  # staged, parsed, quarantined, rejected
    quarantine_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
