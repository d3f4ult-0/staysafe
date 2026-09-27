# Bengal Safety Map — Privacy & Spatial Redaction Protocol

**Document Version:** 1.0.0  
**Effective Date:** September 2026

---

## 1. Zero Direct PII Guarantee

Bengal Safety Map implements Privacy-by-Design. No direct or easily re-identifiable personal data is retained or displayed in public interfaces:

1. **Names:** Complainants, victims, witnesses, and accused persons' names are stripped during Stage 6 of the ETL pipeline.
2. **Exact Addresses:** House numbers, building names, flat numbers, and residential lanes are never ingested into public models.
3. **Identifiers:** Vehicle registration numbers, phone numbers, email addresses, and Aadhaar/PAN references are purged.
4. **Narratives:** Raw police narrative texts are quarantined. Only concise, standardized taxonomic category descriptions are displayed.

---

## 2. Category-Specific Spatial Suppression Rules

Different incident categories carry different re-identification risks. We apply a three-tiered spatial redaction matrix:

| Sensitivity Tier | Categories Covered | Public Spatial Treatment | Coordinate Output |
|---|---|---|---|
| **Tier 1: Critical (Strict Suppression)** | Sexual offences, Minors / POCSO, Domestic Violence, Trafficking, Stalking, Interpersonal Violence | Generalized to Ward or District centroid only. Never displayed as a pin. Small cell threshold strictly enforced. | **NULL / Suppressed** |
| **Tier 2: High (Spatial Generalization)** | Assault, Robbery, Grievous Hurt, Weapon Offenses | Generalized to 500m Hex/Grid Cell centroid or Ward centroid. | Generalized Grid Centroid |
| **Tier 3: Standard (Clustered Civic)** | Property Theft, Traffic Safety Hazards, Public Disturbance | Generalized to 250m-500m grid cell or cluster center. | Bounded Grid Centroid |

---

## 3. Database Separation: Canonical vs. Display Geometry

To eliminate accidental spatial leakage through SQL queries, API serialization, or logs:

1. **Canonical Location:**
   - Table: `incident_locations`
   - Columns: `canonical_geom` (PostGIS `GEOMETRY(Point, 4326)`), `canonical_address_raw`
   - Access: Restricted to internal administrative migration/pipeline roles. **Zero** public API queries touch these columns.
2. **Display Location:**
   - Table: `incident_locations`
   - Columns: `display_geom` (`GEOMETRY(Point, 4326)`), `display_precision` (`ward`, `district`, `hex_cell_500m`), `display_label`
   - Access: Public API queries ONLY select `display_geom` and `display_precision`.

---

## 4. Small-Cell Suppression ($k$-Anonymity)

Aggregations on maps, wards, and time buckets can inadvertently disclose information if a cell count is very small:
- **Threshold Rule:** Any spatial unit (e.g. hex cell or ward polygon) with fewer than $5$ records ($N < 5$) for a selected filter combination is flagged as `suppressed = true`.
- **UI Treatment:** The user interface displays `< 5` and disables clicking down to specific individual records within that cell, preventing reconstruction attacks via filter subtraction.

---

## 5. Reconstruction Attack Prevention

1. **Overlapping Temporal Filters:** Queries returning subsets cannot be subtracted to isolate single records; aggregate endpoints return bounded bucket counts rather than raw differential sets.
2. **Export Sanitization:** Offline packages and CSV/GeoJSON exports apply the exact same small-cell suppression and coordinate jittering rules as live endpoints.
