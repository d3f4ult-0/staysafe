"""Administrative and Operational Visibility Endpoints."""
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from bengal_safety_map.core.database import get_db
from bengal_safety_map.models import SourceRun, RawRecord, DeduplicationCluster

router = APIRouter(prefix="/admin", tags=["Operations & Administration"])


@router.get("/source-runs", summary="List Source Ingestion Runs")
def list_source_runs(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """Returns recent ingestion runs with counts and statuses."""
    runs = db.query(SourceRun).order_by(SourceRun.started_at.desc()).limit(20).all()
    return [
        {
            "id": r.id,
            "source_id": r.source_id,
            "status": r.status,
            "started_at": r.started_at.isoformat() if r.started_at else None,
            "completed_at": r.completed_at.isoformat() if r.completed_at else None,
            "records_read": r.records_read,
            "records_written": r.records_written,
            "records_quarantined": r.records_quarantined,
            "error_message": r.error_message,
            "content_hash": r.content_hash,
        }
        for r in runs
    ]


@router.get("/quarantine", summary="List Quarantined Records")
def list_quarantined_records(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """Returns records held in quarantine due to schema validation or privacy policy violations."""
    records = db.query(RawRecord).filter_by(parse_status="quarantined").limit(50).all()
    return [
        {
            "id": rec.id,
            "source_id": rec.source_id,
            "parse_status": rec.parse_status,
            "quarantine_reason": rec.quarantine_reason,
            "created_at": rec.created_at.isoformat(),
        }
        for rec in records
    ]


@router.get("/deduplication", summary="List Deduplication Clusters")
def list_deduplication_clusters(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """Returns candidate deduplication groupings for operator review."""
    clusters = db.query(DeduplicationCluster).all()
    return [
        {
            "id": c.id,
            "cluster_code": c.cluster_code,
            "master_incident_id": c.master_incident_id,
            "candidate_incident_id": c.candidate_incident_id,
            "match_confidence": c.match_confidence,
            "match_reasons": c.match_reasons,
            "review_status": c.review_status,
            "created_at": c.created_at.isoformat(),
        }
        for c in clusters
    ]
