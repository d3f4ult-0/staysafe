# Bengal Safety Map — Operations & Maintenance Guide

**Version:** 1.0.0  
**Target Environment:** Local Docker Compose & Production Kubernetes / Managed Container Engine

---

## 1. Local Development Bootstrap

To bring up the entire stack locally:

```bash
# 1. Clone & enter repository
git clone <repo-url> && cd staysafe

# 2. Copy environment templates
cp infra/.env.example .env

# 3. Start PostgreSQL with PostGIS, Redis, API, and Frontend
docker compose -f infra/docker-compose.yml up -d

# 4. Run database migrations
docker compose -f infra/docker-compose.yml exec api python -m bengal_safety_map.cli db upgrade

# 5. Ingest synthetic demonstration dataset
docker compose -f infra/docker-compose.yml exec api python -m bengal_safety_map.cli seed demo

# 6. Generate pilot offline package
docker compose -f infra/docker-compose.yml exec api python -m bengal_safety_map.cli package build --area kolkata_metro
```

Web application will be accessible at: `http://localhost:3000`  
API docs (Swagger/OpenAPI) at: `http://localhost:8000/docs`  
Health check at: `http://localhost:8000/health`

---

## 2. CLI Administrative Commands

The backend exposes a command-line interface via `python -m bengal_safety_map.cli`:

- `db init` — Initialize database tables and PostGIS extension.
- `db upgrade` — Run schema migrations.
- `seed demo` — Ingest the synthetic demonstration pilot dataset.
- `pipeline run --source <source_id>` — Execute an ingestion run for a specific source adapter.
- `pipeline status` — View recent source runs, records processed, and quarantine count.
- `package build --area <area_code>` — Generate a signed, checksummed offline GeoJSON package.
- `quarantine list` — Inspect records held for manual privacy or schema review.

---

## 3. Idempotency & Ingestion Safety

1. **Content Hashing:** Every source artifact is hashed using SHA-256 (`content_hash`). If an artifact with identical hash has been processed, the pipeline skips redundant work.
2. **Quarantine Logic:** Any source record failing validation, containing unresolved PII tokens, or violating taxonomy mappings is diverted to `quarantine_records` with an explicit failure reason string, preventing pipeline halts or corrupted public state.
3. **Audit Trail:** Every ingestion run generates a row in `source_runs` tracking started, completed, records ingested, records quarantined, and errors.

---

## 4. Backup & Restore Procedures

### Database Backup
```bash
docker exec -t bengal_safety_map_db pg_dump -U postgres -d bengal_safety_map -Fc > backup_$(date +%Y%m%d_%H%M%S).dump
```

### Database Restore
```bash
docker exec -i bengal_safety_map_db pg_restore -U postgres -d bengal_safety_map --clean < backup_20260927.dump
```
