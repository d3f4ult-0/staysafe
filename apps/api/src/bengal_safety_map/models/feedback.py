"""Feedback and Correction Request Data Models."""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text
from bengal_safety_map.core.database import Base


class FeedbackReport(Base):
    """
    Feedback reports for source corrections, broken links, and privacy concerns.
    These are strictly internal operational input; NEVER published automatically to map.
    """
    __tablename__ = "feedback_reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    subject_type = Column(String(50), nullable=False)  # incident, case, source, boundary, general
    reference_id = Column(String(100), nullable=True)
    report_text = Column(Text, nullable=False)
    contact_email = Column(String(255), nullable=True)
    status = Column(String(50), default="pending_review", nullable=False)  # pending_review, investigated, actioned, closed
    reviewer_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime(timezone=True), nullable=True)
