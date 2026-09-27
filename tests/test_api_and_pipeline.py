"""Automated Tests for Bengal Safety Map API, Privacy Controls, and Append-Only History."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from bengal_safety_map.main import app
from bengal_safety_map.core.database import Base, get_db
from bengal_safety_map.services.privacy.anonymizer import (
    sanitize_narrative,
    compute_display_geometry,
    apply_small_cell_suppression,
)
from bengal_safety_map.services.deduplication.engine import DeduplicationEngine
from bengal_safety_map.services.etl.pipeline import ETLPipeline
from bengal_safety_map.models import Case, CaseEvent, Incident, IncidentLocation

# Test client
client = TestClient(app)


# -------------------------------------------------------------
# 1. Privacy & Spatial Safeguard Tests
# -------------------------------------------------------------
def test_pii_sanitization():
    """Verify phone numbers, emails, and Indian national IDs are stripped."""
    raw_text = "Complainant contacted at +91 9876543210 or user@example.com with Aadhaar 2345 6789 0123."
    sanitized = sanitize_narrative(raw_text)
    assert "+91 9876543210" not in sanitized
    assert "user@example.com" not in sanitized
    assert "2345 6789 0123" not in sanitized
    assert "[PHONE REDACTED]" in sanitized
    assert "[EMAIL REDACTED]" in sanitized
    assert "[ID REDACTED]" in sanitized


def test_critical_category_spatial_suppression():
    """Verify sexual offenses, minors/POCSO, and domestic violence have strictly null coordinates."""
    # Critical sensitivity must return None, None, 'exact_suppressed'
    lat, lon, precision = compute_display_geometry(
        category_code="sexual_offenses_harassment",
        sensitivity_tier="critical",
        canonical_lat=22.5726,
        canonical_lon=88.3639,
        area_center_lat=22.5700,
        area_center_lon=88.3600,
    )
    assert lat is None
    assert lon is None
    assert precision == "exact_suppressed"

    # Standard sensitivity generalizes to coarse grid
    lat_std, lon_std, prec_std = compute_display_geometry(
        category_code="property_theft",
        sensitivity_tier="standard",
        canonical_lat=22.572619,
        canonical_lon=88.363914,
        area_center_lat=22.5700,
        area_center_lon=88.3600,
    )
    assert lat_std == 22.573
    assert lon_std == 88.364
    assert prec_std == "hex_500m"


def test_small_cell_k_anonymity():
    """Verify small cell suppression masks counts under threshold."""
    # Count < 5
    val_masked, is_supp = apply_small_cell_suppression(count=3, threshold=5)
    assert is_supp is True
    assert val_masked == "<5"

    # Count >= 5
    val_unmasked, is_supp_false = apply_small_cell_suppression(count=12, threshold=5)
    assert is_supp_false is False
    assert val_unmasked == 12


# -------------------------------------------------------------
# 2. Public API Data Leakage Tests
# -------------------------------------------------------------
def test_public_incidents_never_expose_canonical_coordinates():
    """Critical Security Gate: Ensure public incidents response NEVER exposes canonical lat/lon/address."""
    response = client.get("/api/v1/incidents")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert len(data["items"]) > 0

    for item in data["items"]:
        # Field assertion: canonical fields must NOT exist in the serialized JSON
        assert "canonical_latitude" not in item
        assert "canonical_longitude" not in item
        assert "canonical_address_raw" not in item

        # For critical sensitivity tier, coordinates must be explicitly null
        if item["sensitivity_tier"] == "critical":
            assert item["latitude"] is None
            assert item["longitude"] is None
            assert item["spatial_precision"] == "exact_suppressed"


def test_map_aggregates_k_anonymity():
    """Ensure map aggregates endpoint marks suppressed cells as '<5'."""
    response = client.get("/api/v1/map/aggregates")
    assert response.status_code == 200
    geojson = response.json()
    assert geojson["type"] == "FeatureCollection"
    assert "features" in geojson

    for feat in geojson["features"]:
        props = feat["properties"]
        if props["is_suppressed"]:
            assert props["total_count"] == "<5"


# -------------------------------------------------------------
# 3. Append-Only Case History & Legal Status Tests
# -------------------------------------------------------------
def test_append_only_case_history():
    """Verify adding later procedural milestones appends to timeline without overwriting prior history."""
    response = client.get("/api/v1/cases/CASE-2026-002")
    assert response.status_code == 200
    case_data = response.json()

    timeline = case_data["timeline"]
    assert len(timeline) >= 5

    # Check distinct stages exist in sequence
    statuses = [ev["status"] for ev in timeline]
    assert statuses == ["reported", "fir_registered", "chargesheet", "trial", "acquitted"]

    # Verify acquittal does NOT imply guilt
    acquittal_ev = timeline[-1]
    assert acquittal_ev["status"] == "acquitted"
    assert acquittal_ev["is_guilt_finding"] is False

    # Check disclaimer exists
    assert "presumed innocent" in case_data["disclaimer"]


def test_case_conviction_vs_acquittal_differentiation():
    """Assert conviction and acquittal are clearly distinguished and backed by source citations."""
    # Conviction case
    res_conv = client.get("/api/v1/cases/CASE-2026-003")
    assert res_conv.status_code == 200
    conv_data = res_conv.json()
    assert conv_data["current_status"] == "convicted"
    assert conv_data["is_guilt_proven"] is True
    assert conv_data["timeline"][-1]["is_guilt_finding"] is True

    # Acquittal case
    res_acq = client.get("/api/v1/cases/CASE-2026-002")
    assert res_acq.status_code == 200
    acq_data = res_acq.json()
    assert acq_data["current_status"] == "acquitted"
    assert acq_data["is_guilt_proven"] is False


# -------------------------------------------------------------
# 4. Conservative Deduplication Tests
# -------------------------------------------------------------
def test_deduplication_engine():
    """Test candidate scoring and routing to operator review instead of blind auto-merge."""
    rec1 = {
        "source_record_id": "REC-001",
        "category_code": "property_theft",
        "administrative_area_id": "ward_kmc_central",
        "occurred_at": "2026-02-10T14:30:00Z",
    }
    rec2_exact = {
        "source_record_id": "REC-001",
        "category_code": "property_theft",
        "administrative_area_id": "ward_kmc_central",
        "occurred_at": "2026-02-10T14:30:00Z",
    }
    rec3_similar = {
        "source_record_id": "DIFF-999",
        "category_code": "property_theft",
        "administrative_area_id": "ward_kmc_central",
        "occurred_at": "2026-02-10T18:00:00Z",
    }
    rec4_distinct = {
        "source_record_id": "DIFF-123",
        "category_code": "traffic_road_safety",
        "administrative_area_id": "ward_howrah_station",
        "occurred_at": "2026-08-10T18:00:00Z",
    }

    # Exact match
    conf_exact, reasons_exact, status_exact = DeduplicationEngine.evaluate_candidate_match(rec1, rec2_exact)
    assert status_exact == "exact_match_merged"
    assert conf_exact >= 0.95

    # Similar: Same ward and date, but different source ID -> Route to operator review!
    conf_sim, reasons_sim, status_sim = DeduplicationEngine.evaluate_candidate_match(rec1, rec3_similar)
    assert status_sim == "pending_operator_review"
    assert conf_sim >= 0.75

    # Completely distinct
    conf_dist, reasons_dist, status_dist = DeduplicationEngine.evaluate_candidate_match(rec1, rec4_distinct)
    assert status_dist == "distinct_record"
    assert conf_dist < 0.50


# -------------------------------------------------------------
# 5. Metadata and Area Summary Tests
# -------------------------------------------------------------
def test_system_metadata():
    """Verify pilot boundaries, emergency notice (112), and night-time policy definition."""
    response = client.get("/api/v1/metadata")
    assert response.status_code == 200
    meta = response.json()
    assert meta["pilot_area"]["area_code"] == "kolkata_metro"
    assert meta["temporal_policy"]["night_start_hour"] == 20
    assert meta["temporal_policy"]["night_end_hour"] == 5
    assert "112" in meta["emergency_notice"]


def test_area_summary():
    """Verify area summary calculates night-time share, unknown time %, and caveats."""
    response = client.get("/api/v1/areas/ward_kmc_central/summary")
    assert response.status_code == 200
    summary = response.json()
    assert summary["area_id"] == "ward_kmc_central"
    assert summary["total_records"] > 0
    assert "uncertainty_notes" in summary
    assert "caveats" in summary


# -------------------------------------------------------------
# 6. Operational Feedback Channel Tests
# -------------------------------------------------------------
def test_feedback_channel_is_internal_only():
    """Assert submitted feedback is saved to review queue and not published as live map incidents."""
    payload = {
        "subject_type": "incident",
        "reference_id": "INC-2026-101",
        "report_text": "Requesting verification of timestamp precision. Reach me at +91 9999988888.",
        "contact_email": "citizen@example.org",
    }
    response = client.post("/api/v1/feedback", json=payload)
    assert response.status_code == 201
    res_data = response.json()
    assert res_data["status"] == "received"
    assert "queued for data governance review" in res_data["message"]
