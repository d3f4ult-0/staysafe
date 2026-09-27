# Bengal Safety Map — API Specification

**API Version:** v1  
**Base URL:** `/api/v1`  
**OpenAPI Specification:** Available interactively at `/docs` (Swagger UI) and `/openapi.json`

---

## 1. Core Public Endpoints

### System & Metadata
- `GET /health`: Liveness probe. Returns `{ "status": "ok", "timestamp": "..." }`.
- `GET /ready`: Readiness probe. Verifies database and cache connectivity.
- `GET /metadata`: Current pilot area config, active dataset release version, night-time policy definition, and legal disclaimer.

### Administrative Geography & Methodology
- `GET /areas`: Hierarchy of supported administrative areas (State -> District -> Municipality -> Ward).
  - Query parameters: `parent_id`, `area_type` (`district`, `municipality`, `ward`).
- `GET /areas/{id}`: Detailed geometry and metadata for a specific area.
- `GET /sources`: Registry of prospective and active data sources, including adapter status (`unconfigured`, `disabled`, `active_pilot`, `synthetic_demo`), license, and coverage.
- `GET /methodology`: Complete statistical methodology, suppression rules, and denominator notes.

### Spatial Aggregates & Public Incidents
- `GET /map/aggregates`: Spatial binned clusters / hex cells / ward aggregates.
  - Query parameters:
    - `bbox`: `min_lon,min_lat,max_lon,max_lat`
    - `category`: Taxonomy code or comma-separated list
    - `time_filter`: `all`, `day` (05:00-20:00), `night` (20:00-05:00)
    - `date_from`, `date_to`: ISO 8601 dates
    - `aggregation_level`: `hex_500m`, `ward`, `district`
  - *Returns:* GeoJSON FeatureCollection of binned counts, with $k$-anonymity suppression (`count: "<5"` if $<5$).
- `GET /incidents`: Privacy-safe individual public records (non-sensitive categories only).
  - *Returns:* Paginated list of incidents with generalized coordinates, category, date, and source provenance.
- `GET /incidents/{public_id}`: Detail view of a single public incident.
- `GET /cases/{public_id}`: Chronological, append-only legal event timeline for a public case (e.g. reported -> FIR -> investigation -> chargesheet -> conviction/acquittal).

### Releases & Offline Packages
- `GET /releases`: List of immutable dataset releases.
- `GET /offline-packages`: Available downloadable offline packages (GeoJSON, metadata, SHA-256 checksum, freshness window).
- `GET /offline-packages/{package_id}/download`: Downloadable bundle archive.

### Feedback
- `POST /feedback`: Operational input for source corrections, broken links, or privacy concerns.
  - Body: `{ "subject_type": "incident|source|general", "reference_id": "...", "report_text": "...", "contact_email": "..." }`
  - Feedback is strictly queued for internal review; never automatically published to map.
