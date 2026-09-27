# Bengal Safety Map

A production-oriented, privacy-preserving civic-tech platform and installable Progressive Web App (PWA) designed to provide transparent, source-backed public safety incident visualization, night-time pattern analysis, and institutional case-status tracking across **West Bengal, India**, with a configurable pilot area centered on the **Greater Kolkata Metropolitan Area**.

---

## 🚨 Emergency Notice

> **IN IMMEDIATE DANGER:** This civic transparency tool is **not** an emergency dispatch service. If you are in immediate danger or witnessing a crime in progress, contact local official emergency services immediately via the **National Emergency Helpline: `112`** (toll-free, 24/7 across West Bengal).

---

## 🎯 Product Mission & Core Boundaries

### Mission
- Make public safety data and historical incident reporting transparent and verifiable.
- Provide a rigorous **Night-Time Lens** (20:00 to 05:00 IST) based strictly on documented event occurrence times, exposing reporting latency and missingness.
- Preserve the critical institutional distinction between:
  - An initial allegation or media report;
  - A formal police First Information Report (FIR);
  - An investigative update or chargesheet;
  - A judicial court disposition (conviction or acquittal).
- Enforce **Privacy-by-Design**: strict coordinate suppression for high-risk categories (sexual offenses, POCSO, domestic violence) and $k$-anonymity small-cell suppression ($N < 5$).
- Support offline usage with verifiable, downloadable regional packages.

### Non-Goals & Absolute Boundaries
- **No Danger Predictions or Safety Scores:** The platform does not predict individual risk, label neighborhoods "safe" or "unsafe," or advise on travel routes.
- **No Accused/Victim Dossiers:** Zero personally identifiable information (PII) is stored or displayed. No individual names, phone numbers, or residential addresses exist in public schemas.
- **No Inferred Guilt:** An allegation, FIR, or charge is never presented as proof of guilt. Under Indian law, the accused is presumed innocent until proven guilty in a competent court.
- **No Fabricated Records:** The platform operates in a transparent **Synthetic Demo Mode** (`synthetic_demo_v1`) using fictional demonstration fixtures until prospective official sources are legally reviewed and authenticated.

---

## 🗺️ Pilot Area & Scalability

- **Configurable Pilot Region:** Greater Kolkata Metropolitan Area (Kolkata Municipal Corporation Wards, Bidhannagar / Salt Lake, Howrah, and New Town).
- **Expansion Architecture:** Hierarchical administrative geography model ready to scale across all 23 districts of West Bengal (Police Commissionerates, Districts, Police Stations / Thanas, Wards, and Gram Panchayats).

---

## 🏗️ Architecture & Technology Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS, Lucide Icons.
- **PWA & Offline:** Service Worker (`sw.js`), Web App Manifest (`manifest.json`), CacheStorage, and downloadable SHA-256-checksummed GeoJSON packages.
- **Mapping:** MapLibre GL JS with accessible table/list alternatives for keyboard and screen-reader accessibility.
- **Backend API:** FastAPI (Python 3.12+), Pydantic v2, SQLAlchemy 2.0, GeoAlchemy2 / PostGIS.
- **Database:** PostgreSQL 16 + PostGIS 3.4.
- **ETL Engine:** 14-stage idempotent pipeline with SHA-256 artifact hashing, PII redaction, spatial generalization, temporal normalization, conservative deduplication, and quarantine routing.

---

## 🚀 Quickstart & Local Bootstrap

### Prerequisites
- Docker & Docker Compose **OR** Python 3.12+ and Node.js 20+

### Option A: One-Command Local Bootstrap (Recommended)

```bash
# 1. Clone repository
git clone <repo-url> && cd staysafe

# 2. Run bootstrap script
./scripts/bootstrap.sh
```

### Option B: Docker Compose

```bash
# 1. Copy environment template
cp infra/.env.example .env

# 2. Start all services (PostGIS, Redis, API, Frontend)
docker compose -f infra/docker-compose.yml up -d

# 3. Initialize schema & seed synthetic demo data
docker compose -f infra/docker-compose.yml exec api python -m bengal_safety_map.cli db init
docker compose -f infra/docker-compose.yml exec api python -m bengal_safety_map.cli seed demo
docker compose -f infra/docker-compose.yml exec api python -m bengal_safety_map.cli package build
```

Once running:
- **Web PWA:** [http://localhost:3000](http://localhost:3000)
- **API Documentation (Swagger UI):** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check:** [http://localhost:8000/health](http://localhost:8000/health)

---

## 🛠️ CLI Administrative Commands

The backend provides a management CLI:

```bash
source .venv/bin/activate
export PYTHONPATH=apps/api/src

# Initialize database schema tables
python -m bengal_safety_map.cli db init

# Seed synthetic demonstration dataset
python -m bengal_safety_map.cli seed demo

# Generate signed offline package for an area
python -m bengal_safety_map.cli package build --area kolkata_metro

# Inspect quarantined records
python -m bengal_safety_map.cli quarantine list
```

---

## 🧪 Testing & Verification

Run the comprehensive automated test suite covering privacy safeguards, spatial suppression, append-only history, API data leakage prevention, and deduplication:

```bash
source .venv/bin/activate
PYTHONPATH=apps/api/src pytest tests/test_api_and_pipeline.py -v
```

Run the frontend production build and type checking:

```bash
npm --prefix apps/web run build
```

---

## 📚 Documentation Index

Complete design, governance, and operational documents are available in `docs/`:

1. [`docs/assumptions.md`](docs/assumptions.md) — Documented boundaries, pilot assumptions, and ethical non-goals.
2. [`docs/architecture.md`](docs/architecture.md) — High-level architecture, component diagrams, and data flows.
3. [`docs/data-governance.md`](docs/data-governance.md) — Lineage rules, source classification, and takedown procedures.
4. [`docs/privacy-and-redaction.md`](docs/privacy-and-redaction.md) — Spatial suppression, $k$-anonymity, and geometry separation.
5. [`docs/methodology.md`](docs/methodology.md) — Descriptive statistics, night-time calculation rules, and denominators.
6. [`docs/source-onboarding.md`](docs/source-onboarding.md) — Protocol for vetting and adding prospective official feeds.
7. [`docs/source-review-checklist.md`](docs/source-review-checklist.md) — Legal, privacy, and technical quality audit form.
8. [`docs/operations.md`](docs/operations.md) — Maintenance guide, idempotency, backup, and restore.
9. [`docs/threat-model.md`](docs/threat-model.md) — Re-identification, poisoning, and data leakage mitigations.
10. [`docs/api.md`](docs/api.md) — REST API endpoint specifications.
11. [`docs/pilot-configuration.md`](docs/pilot-configuration.md) — Pilot parameters and instructions for West Bengal expansion.
