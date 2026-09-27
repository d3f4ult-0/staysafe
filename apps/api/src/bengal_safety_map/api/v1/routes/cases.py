"""Case History and Append-Only Timeline Endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from bengal_safety_map.core.database import get_db
from bengal_safety_map.models import Case
from bengal_safety_map.schemas import CaseDetailResponse, CaseEventResponse

router = APIRouter(tags=["Case Lifecycle & Timelines"])


@router.get("/cases/{public_id}", response_model=CaseDetailResponse, summary="Case Status & Timeline")
def get_case_detail(public_id: str, db: Session = Depends(get_db)):
    """
    Returns the chronological, append-only procedural lifecycle for a public case.
    Differentiates allegations and FIRs from chargesheets and court verdicts.
    """
    case = db.query(Case).filter_by(public_id=public_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case record not found")

    events = []
    for ev in case.events:
        events.append(
            CaseEventResponse(
                id=ev.id,
                event_order=ev.event_order,
                status=ev.status,
                status_label=ev.status_label,
                effective_date=ev.effective_date,
                effective_date_precision=ev.effective_date_precision,
                recorded_at=ev.recorded_at,
                source_id=ev.source_id,
                source_name=ev.source.name if ev.source else "Public Filing",
                source_url=ev.source.canonical_url if ev.source else "",
                source_excerpt=ev.source_excerpt,
                is_guilt_finding=ev.is_guilt_finding,
                notes=ev.notes,
            )
        )

    # Sort events by order
    events.sort(key=lambda x: x.event_order)

    # Format current status label
    status_label = case.current_status.replace("_", " ").title()

    return CaseDetailResponse(
        id=case.id,
        public_id=case.public_id,
        category_code=case.category_code,
        category_name=case.category_code.replace("_", " ").title(),
        primary_area_name=case.administrative_area_id,
        jurisdiction_name="West Bengal Police / Judicial Subordinate Court",
        current_status=case.current_status,
        current_status_label=status_label,
        is_guilt_proven=case.is_guilt_proven,
        disclaimer=(
            "LEGAL NOTICE: Procedural milestones reflect official registry filings. "
            "An initial allegation, media report, FIR, or police chargesheet does NOT constitute proof of guilt. "
            "Under Indian constitutional jurisprudence, an accused person is presumed innocent until proven guilty beyond reasonable doubt in a competent court of law."
        ),
        timeline=events,
    )
