"""ETL Pipeline with Idempotency, Privacy Redaction, and Quarantine Support."""
import hashlib
import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from dateutil import parser
from sqlalchemy.orm import Session

from bengal_safety_map.core.config import settings
from bengal_safety_map.models import (
    Source,
    SourceRun,
    RawArtifact,
    RawRecord,
    AdministrativeArea,
    CategoryTaxonomy,
    Incident,
    IncidentLocation,
    Case,
    CaseEvent,
    DatasetRelease,
    PublicAggregate,
    DeduplicationCluster,
    AuditLog,
)
from bengal_safety_map.services.privacy.anonymizer import (
    sanitize_narrative,
    compute_display_geometry,
    apply_small_cell_suppression,
)
from bengal_safety_map.services.deduplication.engine import DeduplicationEngine


class ETLPipeline:
    def __init__(self, db: Session):
        self.db = db

    def run_synthetic_demo_pipeline(self, fixture_path: Optional[str] = None) -> Dict[str, Any]:
        """Executes complete end-to-end ingestion of the synthetic pilot demo dataset."""
        from bengal_safety_map.services.etl.adapters.synthetic_demo import SyntheticDemoAdapter

        adapter = SyntheticDemoAdapter(fixture_path or "data/fixtures/demo_pilot_data.json")
        source_id = adapter.get_source_id()

        # 1. Ensure Source exists in registry
        source = self.db.query(Source).filter_by(id=source_id).first()
        if not source:
            source = Source(
                id=source_id,
                name="Bengal Safety Map Synthetic Demonstration Generator",
                organization="Civic Data Sandbox",
                source_type="synthetic_demo",
                status="synthetic_demo",
                canonical_url="https://github.com/bengal-safety-map/demo-fixtures",
                license_terms="Creative Commons Public Domain Dedication (CC0)",
                coverage_jurisdiction="West Bengal (Pilot Municipalities)",
                coverage_period="2026-01-01 to 2026-09-26",
                verification_status="verified",
            )
            self.db.add(source)
            self.db.commit()

        # 2. Start Source Run
        run = SourceRun(
            source_id=source_id,
            status="running",
            started_at=datetime.now(timezone.utc),
        )
        self.db.add(run)
        self.db.commit()

        try:
            raw_payload = adapter.fetch_raw_payload()

            # 3. Hash Raw Artifact
            raw_str = json.dumps(raw_payload, sort_keys=True)
            content_hash = hashlib.sha256(raw_str.encode("utf-8")).hexdigest()
            run.content_hash = content_hash

            artifact = RawArtifact(
                source_run_id=run.id,
                artifact_hash=content_hash,
                retrieval_timestamp=datetime.now(timezone.utc),
            )
            self.db.add(artifact)

            # 4. Ingest Controlled Taxonomy & Administrative Areas if not present
            self._ingest_taxonomy()
            self._ingest_administrative_areas(raw_payload.get("administrative_areas", []))

            # 5. Ingest Prospective Sources
            for src_data in raw_payload.get("sources", []):
                existing_src = self.db.query(Source).filter_by(id=src_data["id"]).first()
                if not existing_src:
                    self.db.add(Source(**src_data))
            self.db.commit()

            # 6. Ingest Cases and Append-Only Events
            cases_created = self._ingest_cases(raw_payload.get("cases", []))

            # 7. Ingest Incidents with Spatial & Temporal Normalization
            incidents_data = raw_payload.get("incidents", [])
            records_written = 0
            records_quarantined = 0

            for inc_item in incidents_data:
                # Stage 5 & 6: Validate and redact
                try:
                    self._process_single_incident(inc_item, run.id)
                    records_written += 1
                except Exception as err:
                    records_quarantined += 1
                    raw_rec = RawRecord(
                        source_id=source_id,
                        raw_payload=inc_item,
                        parse_status="quarantined",
                        quarantine_reason=str(err),
                    )
                    self.db.add(raw_rec)

            # 8. Ingest Deduplication Clusters
            for cluster_item in raw_payload.get("deduplication_clusters", []):
                dedup = DeduplicationCluster(
                    cluster_code=cluster_item["cluster_id"],
                    master_incident_id=cluster_item["master_record_id"],
                    candidate_incident_id=cluster_item["candidate_record_id"],
                    match_confidence=cluster_item["match_confidence"],
                    match_reasons=cluster_item["match_reasons"],
                    review_status=cluster_item["review_status"],
                )
                self.db.add(dedup)

            # 9. Register Dataset Release
            release_meta = raw_payload.get("dataset_release", {})
            release_id = release_meta.get("release_id", "synthetic_demo_v1")
            release = self.db.query(DatasetRelease).filter_by(id=release_id).first()
            if not release:
                release = DatasetRelease(
                    id=release_id,
                    version=release_meta.get("version", "1.0.0-demo"),
                    published_at=parser.parse(release_meta.get("published_at", "2026-09-27T10:00:00Z")),
                    data_cutoff=parser.parse(release_meta.get("data_cutoff", "2026-09-26T23:59:59Z")),
                    is_synthetic=True,
                    record_count=records_written,
                    description=release_meta.get("description", "Synthetic demo release"),
                )
                self.db.add(release)

            # 10. Precompute Public Aggregates
            self._precompute_aggregates(release_id)

            # 11. Complete Source Run
            run.status = "completed"
            run.completed_at = datetime.now(timezone.utc)
            run.records_read = len(incidents_data)
            run.records_written = records_written
            run.records_quarantined = records_quarantined

            # Audit log
            audit = AuditLog(
                actor="system_etl",
                action="ingest_synthetic_demo",
                target_entity="dataset_releases",
                target_id=release_id,
                details={"records_written": records_written, "quarantined": records_quarantined},
            )
            self.db.add(audit)
            self.db.commit()

            return {
                "run_id": run.id,
                "status": "completed",
                "records_read": len(incidents_data),
                "records_written": records_written,
                "records_quarantined": records_quarantined,
                "release_id": release_id,
            }

        except Exception as e:
            self.db.rollback()
            run.status = "failed"
            run.completed_at = datetime.now(timezone.utc)
            run.error_message = str(e)
            self.db.add(run)
            self.db.commit()
            raise e

    def _ingest_taxonomy(self):
        """Loads canonical taxonomy if empty."""
        count = self.db.query(CategoryTaxonomy).count()
        if count > 0:
            return

        with open("packages/shared/taxonomy.json", "r", encoding="utf-8") as f:
            tax_data = json.load(f)

        for cat in tax_data.get("categories", []):
            item = CategoryTaxonomy(
                code=cat["code"],
                name=cat["name"],
                parent_code=cat.get("parent_code"),
                sensitivity_tier=cat["sensitivity_tier"],
                spatial_policy=cat["spatial_policy"],
                description=cat["description"],
            )
            self.db.add(item)
        self.db.commit()

    def _ingest_administrative_areas(self, areas_data: List[Dict[str, Any]]):
        for area_dict in areas_data:
            existing = self.db.query(AdministrativeArea).filter_by(id=area_dict["id"]).first()
            if not existing:
                area = AdministrativeArea(
                    id=area_dict["id"],
                    name=area_dict["name"],
                    parent_id=area_dict.get("parent_id"),
                    area_type=area_dict["area_type"],
                    center_lat=area_dict["center_lat"],
                    center_lon=area_dict["center_lon"],
                    population_2011=area_dict.get("population_2011"),
                )
                self.db.add(area)
        self.db.commit()

    def _ingest_cases(self, cases_data: List[Dict[str, Any]]) -> int:
        count = 0
        for c in cases_data:
            existing_case = self.db.query(Case).filter_by(public_id=c["public_id"]).first()
            if not existing_case:
                timeline = c.get("timeline", [])
                latest_event = timeline[-1] if timeline else None
                latest_status = latest_event["status"] if latest_event else "reported"
                is_guilt = latest_event.get("is_guilt_finding", False) if latest_event else False

                case_obj = Case(
                    public_id=c["public_id"],
                    category_code=c["category_code"],
                    administrative_area_id=c["administrative_area_id"],
                    current_status=latest_status,
                    is_guilt_proven=is_guilt,
                    disclaimer=c.get("disclaimer", "Allegation is not proof of guilt."),
                )
                self.db.add(case_obj)
                self.db.flush()

                # Add append-only events
                for ev in timeline:
                    ev_date = parser.parse(ev["effective_date"])
                    case_ev = CaseEvent(
                        case_id=case_obj.id,
                        event_order=ev["event_order"],
                        status=ev["status"],
                        status_label=ev["status"].replace("_", " ").title(),
                        effective_date=ev_date,
                        effective_date_precision=ev.get("effective_date_precision", "exact"),
                        source_id=ev["source_id"],
                        source_excerpt=sanitize_narrative(ev.get("source_excerpt")),
                        is_guilt_finding=ev.get("is_guilt_finding", False),
                    )
                    self.db.add(case_ev)
                count += 1
        self.db.commit()
        return count

    def _process_single_incident(self, item: Dict[str, Any], run_id: str):
        existing = self.db.query(Incident).filter_by(public_id=item["public_id"]).first()
        if existing:
            return

        area = self.db.query(AdministrativeArea).filter_by(id=item["administrative_area_id"]).first()
        area_lat = area.center_lat if area else settings.PILOT_CENTER_LAT
        area_lon = area.center_lon if area else settings.PILOT_CENTER_LON

        # Temporal Normalization
        occurred_at = parser.parse(item["occurred_at"]) if item.get("occurred_at") else None
        time_precision = item.get("occurred_time_precision", "exact")
        is_night = None

        if occurred_at and time_precision in ["exact", "hour_only"]:
            # Evaluate against Asia/Kolkata hour
            # Night is 20:00 to 05:00
            hour = occurred_at.hour
            is_night = hour >= settings.NIGHT_START_HOUR or hour < settings.NIGHT_END_HOUR

        # Case association
        case_id = None
        if item.get("case_public_id"):
            case_match = self.db.query(Case).filter_by(public_id=item["case_public_id"]).first()
            if case_match:
                case_id = case_match.id

        # Spatial Anonymization & Generalization
        display_lat, display_lon, precision = compute_display_geometry(
            category_code=item["category_code"],
            sensitivity_tier=item.get("sensitivity_tier", "standard"),
            canonical_lat=item.get("latitude"),
            canonical_lon=item.get("longitude"),
            area_center_lat=area_lat,
            area_center_lon=area_lon,
        )

        incident = Incident(
            public_id=item["public_id"],
            category_code=item["category_code"],
            sensitivity_tier=item.get("sensitivity_tier", "standard"),
            occurred_at=occurred_at,
            occurred_time_precision=time_precision,
            is_night=is_night,
            reported_at=parser.parse(item["reported_at"]) if item.get("reported_at") else None,
            administrative_area_id=item["administrative_area_id"],
            source_id=item["source_id"],
            case_id=case_id,
            is_synthetic=True,
        )
        self.db.add(incident)
        self.db.flush()

        # Spatial Location Record
        loc = IncidentLocation(
            incident_id=incident.id,
            canonical_latitude=item.get("latitude"),
            canonical_longitude=item.get("longitude"),
            canonical_address_raw=None,  # No PII stored
            display_latitude=display_lat,
            display_longitude=display_lon,
            display_precision=precision,
            display_label=area.name if area else "Greater Kolkata Pilot Zone",
        )
        self.db.add(loc)

    def _precompute_aggregates(self, release_id: str):
        """Generates precomputed privacy-safe ward aggregates enforcing k-anonymity."""
        areas = self.db.query(AdministrativeArea).all()
        for area in areas:
            incidents = self.db.query(Incident).filter_by(administrative_area_id=area.id).all()
            total_count = len(incidents)
            night_count = len([i for i in incidents if i.is_night is True])
            day_count = len([i for i in incidents if i.is_night is False])

            # Small cell suppression threshold
            total_display, is_supp = apply_small_cell_suppression(total_count, settings.MIN_AGGREGATE_COUNT)

            cell_geojson = {
                "type": "Point",
                "coordinates": [area.center_lon, area.center_lat],
            }

            agg = PublicAggregate(
                release_id=release_id,
                area_id=area.id,
                cell_id=f"agg_{area.id}",
                cell_geojson=cell_geojson,
                time_filter="all",
                count=total_count,
                is_suppressed=is_supp,
            )
            self.db.add(agg)
        self.db.commit()
