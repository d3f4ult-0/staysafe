# Bengal Safety Map — Source Onboarding Protocol

**Document Version:** 1.0.0  
**Status:** Operational Protocol

---

## 1. Onboarding Lifecycle

No data source may be connected to live ingestion runs without completing the four-stage onboarding lifecycle:

```
[Phase 1: Proposal] ──> [Phase 2: Legal/Terms Review] ──> [Phase 3: Adapter & Sandbox] ──> [Phase 4: Verified Activation]
```

### Phase 1: Proposal & Registration
1. Add an entry to the `sources` registry table with status `unconfigured`.
2. Define source organization, official website, intended access method (API, bulk download, public gazette/notice).
3. Record expected geographic and temporal coverage.

### Phase 2: Legal & Ethics Review
Complete the Source Review Checklist (`docs/source-review-checklist.md`).
- Verify Open Government Data (OGD) license or explicit public reuse authorization.
- Verify that terms of service or robots.txt are not breached.
- Confirm absence of direct PII, or define automated redaction rules for Stage 6 of the ETL pipeline.

### Phase 3: Adapter Development & Fixture Validation
1. Implement the standardized Python adapter inheriting from `BaseSourceAdapter` in `apps/api/src/bengal_safety_map/services/etl/adapters/`.
2. Provide a synthetic or anonymized offline fixture file in `data/fixtures/`.
3. Write automated unit and contract tests asserting schema compliance and quarantine behavior.

### Phase 4: Production Activation
1. Set adapter configuration flag `is_enabled = true` in environment configuration.
2. Update verification state to `verified`.
3. Schedule cadence in background worker configuration.
