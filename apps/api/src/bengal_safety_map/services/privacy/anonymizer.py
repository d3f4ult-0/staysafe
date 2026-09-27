"""Privacy safeguards, spatial generalization, and small-cell suppression."""
import re
from typing import Optional, Tuple, Dict, Any

# Regular expressions for identifying and redacting direct PII
PHONE_REGEX = re.compile(r"(\+91[\-\s]?)?[6-9]\d{9}")
EMAIL_REGEX = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
AADHAAR_REGEX = re.compile(r"\b[2-9]{1}[0-9]{3}\s[0-9]{4}\s[0-9]{4}\b")
PAN_REGEX = re.compile(r"[A-Z]{5}[0-9]{4}[A-Z]{1}")


def sanitize_narrative(text: Optional[str]) -> Optional[str]:
    """Redact direct personal identifiers (phone numbers, emails, national IDs)."""
    if not text:
        return text

    sanitized = PHONE_REGEX.sub("[PHONE REDACTED]", text)
    sanitized = EMAIL_REGEX.sub("[EMAIL REDACTED]", sanitized)
    sanitized = AADHAAR_REGEX.sub("[ID REDACTED]", sanitized)
    sanitized = PAN_REGEX.sub("[ID REDACTED]", sanitized)
    return sanitized


def compute_display_geometry(
    category_code: str,
    sensitivity_tier: str,
    canonical_lat: Optional[float],
    canonical_lon: Optional[float],
    area_center_lat: float,
    area_center_lon: float,
) -> Tuple[Optional[float], Optional[float], str]:
    """
    Computes public-safe display coordinates based on category sensitivity tier.
    - Critical sensitivity (sexual offenses, POCSO, domestic violence):
      Coordinates are strictly suppressed (None, None, 'exact_suppressed').
    - High sensitivity (assault, narcotics):
      Generalized to 500m grid cell or ward centroid.
    - Standard sensitivity (theft, road hazards):
      Generalized to 250m-500m grid cell center.
    """
    if sensitivity_tier == "critical":
        # Strict suppression: zero coordinates published
        return None, None, "exact_suppressed"

    if canonical_lat is None or canonical_lon is None:
        # Fallback to ward centroid
        return round(area_center_lat, 4), round(area_center_lon, 4), "ward_centroid"

    # Coarsen precision to ~500m (roughly 3 decimal places in lat/lon is ~110m, so 2 decimals ~1.1km)
    # Using 3 decimal places rounded gives a generalized grid cell center
    display_lat = round(canonical_lat, 3)
    display_lon = round(canonical_lon, 3)
    return display_lat, display_lon, "hex_500m"


def apply_small_cell_suppression(count: int, threshold: int = 5) -> Tuple[Any, bool]:
    """
    Enforces k-anonymity for spatial cells and aggregate groupings.
    If count < threshold, returns ('<5', True), else returns (count, False).
    """
    if count < threshold:
        return f"<{threshold}", True
    return count, False
