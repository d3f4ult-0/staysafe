"""Incident and Spatial Location Models."""
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Float, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from bengal_safety_map.core.database import Base


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    public_id = Column(String(50), unique=True, nullable=False, index=True)
    category_code = Column(String(100), ForeignKey("category_taxonomy.code"), nullable=False)
    sensitivity_tier = Column(String(50), nullable=False)  # standard, high, critical
    occurred_at = Column(DateTime(timezone=True), nullable=True)
    occurred_time_precision = Column(String(20), default="exact", nullable=False)  # exact, hour_only, date_only, month_only, unknown
    is_night = Column(Boolean, nullable=True)  # True if occurred between 20:00 and 05:00 IST, null if time unknown
    reported_at = Column(DateTime(timezone=True), nullable=True)
    published_at = Column(DateTime(timezone=True), nullable=True)
    administrative_area_id = Column(String(100), ForeignKey("administrative_areas.id"), nullable=False)
    source_id = Column(String(100), ForeignKey("sources.id"), nullable=False)
    case_id = Column(String(36), ForeignKey("cases.id"), nullable=True)
    is_synthetic = Column(Boolean, default=False, nullable=False)
    is_withheld = Column(Boolean, default=False, nullable=False)  # Privacy or legal takedown flag
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    category = relationship("CategoryTaxonomy", back_populates="incidents")
    area = relationship("AdministrativeArea", back_populates="incidents")
    source = relationship("Source")
    case = relationship("Case", back_populates="incidents")
    location = relationship("IncidentLocation", uselist=False, back_populates="incident", cascade="all, delete-orphan")


class IncidentLocation(Base):
    """
    Separation of Canonical (Protected Internal) and Display (Public Safe) Geometries.
    Public APIs MUST ONLY query and serialize display fields.
    """
    __tablename__ = "incident_locations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    incident_id = Column(String(36), ForeignKey("incidents.id"), unique=True, nullable=False)

    # 1. Protected Canonical Data (Restricted - NEVER returned in public responses)
    canonical_latitude = Column(Float, nullable=True)
    canonical_longitude = Column(Float, nullable=True)
    canonical_address_raw = Column(Text, nullable=True)

    # 2. Public-Safe Display Data (Returned in public APIs)
    # For critical sensitivity tier, display coordinates are NULL and display_precision is exact_suppressed
    display_latitude = Column(Float, nullable=True)
    display_longitude = Column(Float, nullable=True)
    display_precision = Column(String(50), nullable=False)  # exact_suppressed, hex_500m, ward_centroid, district_centroid
    display_label = Column(String(255), nullable=True)

    incident = relationship("Incident", back_populates="location")
