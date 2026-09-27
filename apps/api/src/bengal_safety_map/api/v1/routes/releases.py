"""Dataset Releases Endpoints."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from bengal_safety_map.core.database import get_db
from bengal_safety_map.models import DatasetRelease
from bengal_safety_map.schemas import DatasetReleaseResponse

router = APIRouter(tags=["Dataset Releases"])


@router.get("/releases", response_model=List[DatasetReleaseResponse], summary="List Releases")
def list_releases(db: Session = Depends(get_db)):
    """Returns immutable dataset release metadata records."""
    return db.query(DatasetRelease).order_by(DatasetRelease.published_at.desc()).all()


@router.get("/releases/{release_id}", response_model=DatasetReleaseResponse, summary="Get Release Detail")
def get_release(release_id: str, db: Session = Depends(get_db)):
    """Returns metadata for a specific release."""
    rel = db.query(DatasetRelease).filter_by(id=release_id).first()
    if not rel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Release not found")
    return rel
