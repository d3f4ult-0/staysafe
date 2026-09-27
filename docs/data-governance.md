# Bengal Safety Map — Data Governance & Provenance Policy

**Version:** 1.0.0  
**Status:** Canonical Policy

---

## 1. Governance Principles

All data held and displayed within the Bengal Safety Map ecosystem is governed by strict transparency, attribution, and lineage requirements:

1. **Lineage by Default:** Every normalized record is traceable to an immutable or versioned `raw_record` and `source_run`.
2. **Explicit Verification States:** Every ingested item has an audited state:
   - `unverified`: Ingested but not yet checked against provenance rules.
   - `reviewed`: Machine or human checks passed schema and privacy filters.
   - `verified`: Authenticated through primary official or cross-validated sources.
   - `rejected`: Quarantined due to PII violations, invalid schema, or unverifiable claims.
   - `superseded`: Historical record replaced by a newer verified event update.
3. **No Inferred Guilt:** Legal outcomes are recorded as independent, append-only events. FIRs and allegations are explicitly stamped as accusations, not findings of fact.

---

## 2. Source Classification Framework

Prospective sources are categorized into controlled classes:

| Source Class | Description | Acceptable Public Use |
|---|---|---|
| **Class A: Official Statistical Aggregates** | NCRB, State Crime Records Bureau, Municipal bulletins | District and ward-level aggregate reporting; trend baselines |
| **Class B: Official Public Safety Notices** | Police commissionerate advisories, road safety bulletins | General alerts, aggregate patterns; no individual accused names |
| **Class C: Court-Recorded Dispositions** | E-Courts, High Court of Calcutta public judgments | Case timeline events (`chargesheet`, `conviction`, `acquittal`) with link |
| **Class D: Curated Civic/Civil Datasets** | NGO surveys, street lighting audits, pedestrian transit surveys | Environmental and infrastructure context (e.g. lighting, CCTV) |
| **Class E: Reputable Media Reports** | Credible news publications with documented editorial standards | Incident allegation events ONLY; never proof of guilt; strictly redacted |

---

## 3. Mandatory Provenance Schema

Each record ingested into `sources` and `raw_records` must capture:
- `source_id`: Unique identifier (e.g. `wb_court_records_calcuttahc`, `wb_pilot_synthetic_demo`).
- `source_name`: Official organization name.
- `canonical_url`: Original public link or official archival repository.
- `access_method`: `api`, `official_bulk`, `curated_record`, `permitted_feed`, `synthetic_fixture`.
- `license_terms`: Open Government Data License (India), CC-BY 4.0, or specific terms.
- `retrieval_timestamp`: Exact ISO 8601 UTC timestamp of fetch.
- `publication_timestamp`: Source-declared publication timestamp (if available).
- `content_hash`: SHA-256 digest of original raw artifact.
- `transformation_version`: Code version tag of the ETL redaction rule applied.
- `status`: `unconfigured`, `disabled`, `active_pilot`, `synthetic_demo`.

---

## 4. Takedown & Correction Lifecycle

Requests for data corrections or privacy takedowns follow an auditable pipeline:
1. Operational feedback received via `POST /api/v1/feedback`.
2. Report flagged in `feedback_reports` with status `pending_review`.
3. Operator reviews citation against canonical source.
4. If invalid, erroneous, or containing identifying data, record is updated to `withheld_from_display = true` or `status = rejected`.
5. Audit event logged in `audit_log` with operator ID, reason, and timestamp.
6. Record instantly disappears from public API views and subsequent dataset releases.
