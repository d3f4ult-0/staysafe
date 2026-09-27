"""Offline Package Generator with Cryptographic Checksum and Expiry Manifest."""
import hashlib
import json
from datetime import datetime, timezone, timedelta
from typing import Dict, Any
from sqlalchemy.orm import Session

from bengal_safety_map.core.config import settings
from bengal_safety_map.models import (
    OfflinePackage,
    DatasetRelease,
    AdministrativeArea,
    Source,
    Incident,
    IncidentLocation,
    PublicAggregate,
)


class OfflinePackager:
    def __init__(self, db: Session):
        self.db = db

    def generate_pilot_package(self, area_code: str = "kolkata_metro") -> OfflinePackage:
        """Constructs an immutable, self-contained offline package bundle for the pilot region."""
        release = self.db.query(DatasetRelease).first()
        cutoff = release.data_cutoff if release else datetime.now(timezone.utc)
        version = release.version if release else "1.0.0-demo"

        # Gather sources for provenance manifest
        sources = self.db.query(Source).all()
        source_manifest = [
            {
                "id": s.id,
                "name": s.name,
                "organization": s.organization,
                "license": s.license_terms,
                "status": s.status,
                "canonical_url": s.canonical_url,
            }
            for s in sources
        ]

        # Gather public aggregates
        aggregates = self.db.query(PublicAggregate).all()
        aggregate_features = []
        for agg in aggregates:
            count_val = f"<{settings.MIN_AGGREGATE_COUNT}" if agg.is_suppressed else agg.count
            feat = {
                "type": "Feature",
                "id": agg.cell_id,
                "geometry": agg.cell_geojson,
                "properties": {
                    "cell_id": agg.cell_id,
                    "area_id": agg.area_id,
                    "total_count": count_val,
                    "is_suppressed": agg.is_suppressed,
                },
            }
            aggregate_features.append(feat)

        # Gather public incidents (strictly display coordinates only!)
        incidents = self.db.query(Incident).filter_by(is_withheld=False).all()
        incident_features = []
        for inc in incidents:
            loc = inc.location
            # If coordinates are suppressed, don't emit a point geometry or emit null
            geom = None
            if loc and loc.display_latitude is not None and loc.display_longitude is not None:
                geom = {
                    "type": "Point",
                    "coordinates": [loc.display_longitude, loc.display_latitude],
                }

            feat = {
                "type": "Feature",
                "id": inc.public_id,
                "geometry": geom,
                "properties": {
                    "public_id": inc.public_id,
                    "category_code": inc.category_code,
                    "sensitivity_tier": inc.sensitivity_tier,
                    "occurred_at": inc.occurred_at.isoformat() if inc.occurred_at else None,
                    "occurred_time_precision": inc.occurred_time_precision,
                    "is_night": inc.is_night,
                    "spatial_precision": loc.display_precision if loc else "unknown",
                    "source_id": inc.source_id,
                },
            }
            incident_features.append(feat)

        created_now = datetime.now(timezone.utc)
        expires_at = created_now + timedelta(days=30)

        # Build bundle payload
        bundle_payload = {
            "package_id": f"pkg_{area_code}_v1",
            "area_code": area_code,
            "area_name": settings.PILOT_AREA_NAME,
            "release_version": version,
            "data_cutoff": cutoff.isoformat(),
            "created_at": created_now.isoformat(),
            "expires_at": expires_at.isoformat(),
            "methodology": {
                "night_definition": f"{settings.NIGHT_START_HOUR}:00 - {settings.NIGHT_END_HOUR}:00 IST",
                "small_cell_threshold": settings.MIN_AGGREGATE_COUNT,
                "non_prediction_guarantee": "This offline package contains descriptive historical reporting. It contains zero danger predictions or individual risk scores.",
            },
            "source_manifest": source_manifest,
            "aggregates": {
                "type": "FeatureCollection",
                "features": aggregate_features,
            },
            "incidents": {
                "type": "FeatureCollection",
                "features": incident_features,
            },
        }

        bundle_str = json.dumps(bundle_payload, sort_keys=True)
        checksum = hashlib.sha256(bundle_str.encode("utf-8")).hexdigest()
        file_size = len(bundle_str.encode("utf-8"))

        package_id = f"pkg_{area_code}_v1"
        existing_pkg = self.db.query(OfflinePackage).filter_by(id=package_id).first()
        if existing_pkg:
            existing_pkg.release_version = version
            existing_pkg.data_cutoff = cutoff
            existing_pkg.record_count = len(incidents)
            existing_pkg.file_size_bytes = file_size
            existing_pkg.sha256_checksum = checksum
            existing_pkg.created_at = created_now
            existing_pkg.expires_at = expires_at
            existing_pkg.is_stale = False
            existing_pkg.package_payload_json = bundle_payload
            pkg = existing_pkg
        else:
            pkg = OfflinePackage(
                id=package_id,
                area_code=area_code,
                area_name=settings.PILOT_AREA_NAME,
                release_version=version,
                data_cutoff=cutoff,
                record_count=len(incidents),
                file_size_bytes=file_size,
                sha256_checksum=checksum,
                created_at=created_now,
                expires_at=expires_at,
                is_stale=False,
                package_payload_json=bundle_payload,
            )
            self.db.add(pkg)

        self.db.commit()
        return pkg
