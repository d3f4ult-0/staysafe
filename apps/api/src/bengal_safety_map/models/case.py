"""Case and Append-Only Case Event Models."""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Integer, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from bengal_safety_map.core.database import Base


class Case(Base):
    __tablename__ = "cases"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    public_id = Column(String(50), unique=True, nullable=False, index=True)
    category_code = Column(String(100), ForeignKey("category_taxonomy.code"), nullable=False)
    administrative_area_id = Column(String(100), ForeignKey("administrative_areas.id"), nullable=False)
    current_status = Column(String(50), default="reported", nullable=False)
    is_guilt_proven = Column(Boolean, default=False, nullable=False)
    disclaimer = Column(Text, nullable=False, default="Allegations, FIRs, or charges are procedural filings, not proof of guilt.")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    events = relationship("CaseEvent", back_populates="case", order_by="CaseEvent.event_order", cascade="all, delete-orphan")
    incidents = relationship("Incident", back_populates="case")


class CaseEvent(Base):
    """
    Append-only temporal event history.
    NEVER overwrite prior events; append a new event row with its own timestamp, status, and source citation.
    """
    __tablename__ = "case_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=False, index=True)
    event_order = Column(Integer, nullable=False)
    status = Column(String(50), nullable=False)  # reported, fir_registered, investigation, chargesheet, trial, convicted, acquitted, case_closed_untraced, unknown
    status_label = Column(String(100), nullable=False)
    effective_date = Column(DateTime(timezone=True), nullable=False)
    effective_date_precision = Column(String(20), default="exact", nullable=False)  # exact, hour_only, date_only, month_only, unknown
    recorded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    source_id = Column(String(100), ForeignKey("sources.id"), nullable=False)
    source_excerpt = Column(Text, nullable=True)
    is_guilt_finding = Column(Boolean, default=False, nullable=False)
    notes = Column(Text, nullable=True)

    case = relationship("Case", back_populates="events")
    source = relationship("Source")
