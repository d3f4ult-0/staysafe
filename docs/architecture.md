# Bengal Safety Map — System Architecture

**Document Version:** 1.0.0  
**Status:** Approved  
**Target Environment:** West Bengal, India

---

## 1. High-Level Architecture Overview

Bengal Safety Map is designed as a privacy-first, civic-tech decision support platform. It strictly enforces boundaries between raw, unverified data and public-facing aggregates and anonymized records.

```
                           +----------------------------------------+
                           |       Prospective Data Sources         |
                           |  - Public Police Notices (Permitted)   |
                           |  - Sourced Court Dispositions          |
                           |  - Official District Boundaries        |
                           |  - Synthetic Fixture Sets (Demo Mode)  |
                           +-------------------+--------------------+
                                               |
                                     (Idempotent Retrieval)
                                               v
                           +----------------------------------------+
                           |             ETL Pipeline               |
                           |  1. Capture & SHA-256 Raw Artifact    |
                           |  2. Schema Parse & Quality Check       |
                           |  3. PII Detection & Redaction          |
                           |  4. Geo & Temporal Normalization       |
                           |  5. Taxonomy & Sensitivity Mapping     |
                           |  6. Candidate Deduplication            |
                           |  7. Quarantine & Review Gate           |
                           +-------------------+--------------------+
                                               |
                                               v
    +-----------------------------------------------------------------------------------+
    |                         PostgreSQL 16 + PostGIS 3.4                               |
    |                                                                                   |
    |  [Internal Protected Storage]               [Public-Safe Models]                  |
    |  - raw_records & raw_artifacts              - incidents (display geometry only)   |
    |  - incident_locations (canonical coords)    - case_events (append-only history)   |
    |  - deduplication_clusters                   - public_aggregates (k-anonymity >=5) |
    |  - review_queue & audit_log                 - dataset_releases                    |
    |                                             - offline_packages                    |
    +-----------------------------------------------------------------------------------+
                                               ^
                                               | (Read-Only Views, Sanitized DTOs)
                                               v
                           +----------------------------------------+
                           |          FastAPI REST Engine           |
                           |  - /api/v1/areas                       |
                           |  - /api/v1/map/aggregates              |
                           |  - /api/v1/incidents                   |
                           |  - /api/v1/cases/{id}                  |
                           |  - /api/v1/offline-packages            |
                           |  - /api/v1/sources & /methodology      |
                           +-------------------+--------------------+
                                               |
                         +---------------------+---------------------+
                         |                                           |
                         v                                           v
       +-----------------------------------+       +-----------------------------------+
       |    Next.js 15 Progressive Web App |       |  Downloadable Offline Packages    |
       |  - MapLibre GL JS (Vector/Canvas) |       |  - Versioned GeoJSON Bundles      |
       |  - Night-Time Lens (20:00-05:00)  |       |  - Provenance & Methodology       |
       |  - Accessible Tables & Summaries  |       |  - SHA-256 Checksum Manifest      |
       |  - Service Worker Cache / Offline |       |  - 30-Day Freshness Expiry        |
       +-----------------------------------+       +-----------------------------------+
```

---

## 2. Key Architectural Principles

1. **Separation of Concerns:**
   - Raw data is segregated from public presentation data.
   - Internal coordinate representations (`canonical_geometry`) are NEVER queried or returned by public API endpoints.
   - Public maps consume either aggregated spatial grids (`public_aggregates`) or generalized display centroids (`display_geometry`).

2. **Temporal Immutability:**
   - Case outcomes and legal stages are append-only.
   - Historical records are not overwritten when subsequent FIRs, chargesheets, or court judgments emerge. Each milestone forms a discrete `case_event` with independent provenance.

3. **Small-Cell Suppression ($k$-Anonymity):**
   - Public aggregates refuse to render spatial cells or ward breakdowns where incident count is below the privacy threshold ($N < 5$), preventing accidental victim or household identification.

4. **Zero Prediction / Non-Stigmatization:**
   - The platform operates purely descriptively. No "safety scores", "danger indexes", or predictive forecasting algorithms exist anywhere in the code or database schema.

---

## 3. Technology Stack

| Layer | Component | Description |
|---|---|---|
| **Frontend** | Next.js 15, React 19, TypeScript | Mobile-first responsive civic UI |
| **Styling** | Tailwind CSS, Lucide Icons | Calm, non-alarmist civic visual design |
| **Mapping** | MapLibre GL JS | High-performance open-source vector map engine |
| **PWA & Offline** | Service Worker, CacheStorage | Offline map browsing, package verification |
| **Backend API** | FastAPI (Python 3.12+), Pydantic v2 | High-throughput, typed REST API |
| **Spatial Database**| PostgreSQL 16 + PostGIS 3.4 | Authoritative geographic boundaries & indexing |
| **ORM / Migration**| SQLAlchemy 2.0 & Alembic | Typed models, connection pooling, migrations |
| **Data Packaging** | Zstandard / JSON / GeoJSON | Checksummed offline boundary and incident packs |
| **Queue / Worker** | Background Pipeline & Scheduler | Idempotent ingestion runs, snapshot hashing |

---

## 4. Scalability from Pilot Area to West Bengal

The data architecture is partitioned hierarchically by administrative boundary:
- **Level 1:** State (`West Bengal`)
- **Level 2:** District (e.g. `Kolkata`, `North 24 Parganas`, `South 24 Parganas`, `Howrah`, `Darjeeling`, `Murshidabad`, etc.)
- **Level 3:** Police Commissionerate / District (e.g. `Kolkata Police`, `Bidhannagar Police Commissionerate`, `Howrah Police Commissionerate`)
- **Level 4:** Police Station / Thana
- **Level 5:** Ward / Gram Panchayat

The pilot configuration isolates the pilot region (Greater Kolkata Area) through configuration (`PILOT_AREA_CODE=kolkata_metro`) while maintaining foreign-key references ready for state-wide expansion.
