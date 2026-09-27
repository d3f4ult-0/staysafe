"""Deduplication and Review Workflow Models."""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Float, Text, ForeignKey, JSON
from bengal_safety_map.core.database import Base


class DeduplicationCluster(Base):
    __tablename__ = "deduplication_clusters"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    cluster_code = Column(String(50), nullable=False, index=True)
    master_incident_id = Column(String(50), nullable=False)
    candidate_incident_id = Column(String(50), nullable=False)
    match_confidence = Column(Float, nullable=False)
    match_reasons = Column(JSON, nullable=False)  # List of strings e.g. ["same_ward_geometry", "same_date"]
    review_status = Column(String(50), default="pending_operator_review", nullable=False)  # pending_operator_review, confirmed_duplicate, false_positive
    reviewer_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime(timezone=True), nullable=True)


class ReviewQueue(Base):
    __tablename__ = "review_queue"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    entity_type = Column(String(50), nullable=False)  # incident, case_event, source_run, deduplication
    entity_id = Column(String(100), nullable=False)
    reason = Column(String(255), nullable=False)  # pii_flag, low_confidence_geo, uncertain_duplicate, outcome_verification
    status = Column(String(50), default="pending", nullable=False)  # pending, approved, rejected
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    reviewer = Column(String(100), nullable=True)
    decision_notes = Column(Text, nullable=True)
