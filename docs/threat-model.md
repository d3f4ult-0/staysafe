# Bengal Safety Map — Threat Model & Security Posture

**Version:** 1.0.0  
**Framework:** STRIDE-based Civic Data Risk Assessment

---

## 1. Threat Identification & Mitigation Matrix

### T1: Victim / Vulnerable Person Re-identification (Information Disclosure)
- **Threat Vector:** An attacker correlates spatial points, specific timestamps, and offense categories with local neighborhood gossip or school/residence locations to identify victims of sexual offenses, domestic violence, or minor abuse.
- **Controls & Defenses:**
  - Absolute suppression of exact coordinates for Tier 1 sensitive categories.
  - Spatial generalization to Ward or District level centroid.
  - Small-cell suppression ($k \ge 5$) on all aggregate cells.
  - Temporal bucketing: Exact minute timestamps for sensitive events are stripped down to date or month.
  - No personal names or narrative texts in database public schemas.

### T2: Stigmatization of Communities & Redlining (Elevation of Harm)
- **Threat Vector:** Commercial entities, housing platforms, or biased actors scrape raw incident counts to label specific municipal wards or communities as "high crime" or "dangerous".
- **Controls & Defenses:**
  - No algorithmic risk scores or danger rankings are provided.
  - Denominator and reporting disparity caveats are prominently displayed.
  - Terms of use explicitly forbid redlining or individual risk assessment uses.

### T3: Data Poisoning & Fraudulent Allegation Injection (Tampering)
- **Threat Vector:** Malicious actors attempt to submit false police cases or fabricated incidents via API or feedback channels to defame rivals or distort patterns.
- **Controls & Defenses:**
  - Zero live user-submitted incident publication.
  - Feedback channel (`/api/v1/feedback`) is an internal operational inbox requiring manual reviewer sign-off; feedback never mutates map tables directly.
  - Ingestion adapters only read from verified, authenticated official or vetted public datasets.

### T4: Accidental Database Leakage of Canonical Geometries (Information Disclosure)
- **Threat Vector:** An API developer accidentally writes `SELECT * FROM incidents` and exposes exact canonical home coordinates.
- **Controls & Defenses:**
  - Architectural separation: `canonical_geom` resides in `incident_locations` table with restricted DB role permissions.
  - Public API models (Pydantic DTOs) enforce strict response filtering, only accepting `display_latitude`, `display_longitude`, and `display_precision`.
  - Automated CI tests fail if any endpoint response schema contains raw coordinate fields.

### T5: Scraping & Denial of Service (Denial of Service)
- **Threat Vector:** Botnets flood spatial bounding box endpoints, exhausting PostGIS CPU resources.
- **Controls & Defenses:**
  - Enforced bounding box area caps on `GET /api/v1/incidents` and `/api/v1/map/aggregates`.
  - Rate limiting (e.g. 60 requests/minute per IP) via middleware.
  - Pre-computed spatial aggregation materialized views for pilot ward levels.
