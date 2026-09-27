"""Operational Feedback and Corrections Endpoint."""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from bengal_safety_map.core.database import get_db
from bengal_safety_map.models import FeedbackReport
from bengal_safety_map.schemas import FeedbackCreateRequest, FeedbackResponse
from bengal_safety_map.services.privacy.anonymizer import sanitize_narrative

router = APIRouter(tags=["Feedback & Operations"])


@router.post("/feedback", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED, summary="Submit Correction or Privacy Feedback")
def submit_feedback(payload: FeedbackCreateRequest, db: Session = Depends(get_db)):
    """
    Submits an operational feedback or dataset correction report.
    NOTE: Feedback is strictly routed to an internal review queue.
    It is NEVER automatically published to public maps or endpoints.
    """
    clean_text = sanitize_narrative(payload.report_text)

    report = FeedbackReport(
        subject_type=payload.subject_type,
        reference_id=payload.reference_id,
        report_text=clean_text,
        contact_email=payload.contact_email,
        status="pending_review",
    )
    db.add(report)
    db.commit()

    return FeedbackResponse(
        id=report.id,
        status="received",
        message="Thank you. Your operational feedback has been queued for data governance review.",
        created_at=report.created_at,
    )
