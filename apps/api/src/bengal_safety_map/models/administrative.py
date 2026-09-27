"""Administrative Areas and Category Taxonomy Data Models."""
from sqlalchemy import Column, String, Float, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from bengal_safety_map.core.database import Base


class AdministrativeArea(Base):
    __tablename__ = "administrative_areas"

    id = Column(String(100), primary_key=True)
    name = Column(String(255), nullable=False)
    parent_id = Column(String(100), ForeignKey("administrative_areas.id"), nullable=True)
    area_type = Column(String(50), nullable=False)  # state, district, municipality, ward
    center_lat = Column(Float, nullable=False)
    center_lon = Column(Float, nullable=False)
    boundary_geojson = Column(JSON, nullable=True)
    population_2011 = Column(Integer, nullable=True)

    parent = relationship("AdministrativeArea", remote_side=[id], backref="children")
    incidents = relationship("Incident", back_populates="area")


class CategoryTaxonomy(Base):
    __tablename__ = "category_taxonomy"

    code = Column(String(100), primary_key=True)
    name = Column(String(255), nullable=False)
    parent_code = Column(String(100), ForeignKey("category_taxonomy.code"), nullable=True)
    sensitivity_tier = Column(String(50), nullable=False)  # standard, high, critical
    spatial_policy = Column(String(50), nullable=False)  # cluster_250m, hex_500m, ward_centroid, strict_suppression
    description = Column(String(500), nullable=False)

    parent = relationship("CategoryTaxonomy", remote_side=[code], backref="children")
    incidents = relationship("Incident", back_populates="category")
