"""Offline Map and Data Packages Endpoints."""
from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from bengal_safety_map.core.database import get_db
from bengal_safety_map.models import OfflinePackage
from bengal_safety_map.schemas import OfflinePackageResponse

router = APIRouter(tags=["Offline Packages"])


@router.get("/offline-packages", response_model=List[OfflinePackageResponse], summary="List Offline Packages")
def list_offline_packages(db: Session = Depends(get_db)):
    """Returns available downloadable regional offline packages with checksums and freshness dates."""
    packages = db.query(OfflinePackage).all()
    results = []
    now = datetime.now(timezone.utc)

    for pkg in packages:
        # Check staleness against expiration date
        is_stale = now > pkg.expires_at

        results.append(
            OfflinePackageResponse(
                package_id=pkg.id,
                area_code=pkg.area_code,
                area_name=pkg.area_name,
                release_version=pkg.release_version,
                data_cutoff=pkg.data_cutoff.isoformat(),
                record_count=pkg.record_count,
                file_size_bytes=pkg.file_size_bytes,
                sha256_checksum=pkg.sha256_checksum,
                created_at=pkg.created_at.isoformat(),
                expires_at=pkg.expires_at.isoformat(),
                is_stale=is_stale,
                download_url=f"/api/v1/offline-packages/{pkg.id}/download",
            )
        )
    return results


@router.get("/offline-packages/{package_id}/download", summary="Download Offline Bundle")
def download_offline_package(package_id: str, db: Session = Depends(get_db)):
    """Downloads the full offline package JSON bundle with integrity headers."""
    pkg = db.query(OfflinePackage).filter_by(id=package_id).first()
    if not pkg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offline package not found")

    response = Response(
        content=str(pkg.package_payload_json).replace("'", '"'),  # Ensure JSON format
        media_type="application/json",
    )
    response.headers["X-Checksum-SHA256"] = pkg.sha256_checksum
    response.headers["X-Data-Cutoff"] = pkg.data_cutoff.isoformat()
    response.headers["X-Package-Expires"] = pkg.expires_at.isoformat()
    response.headers["Content-Disposition"] = f'attachment; filename="{pkg.id}.json"'
    return pkg.package_payload_json
