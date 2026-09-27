# Bengal Safety Map — Documented Assumptions and Boundaries

**Version:** 1.0.0  
**Effective Date:** September 2026  
**Jurisdiction:** West Bengal, India  
**Timezone:** `Asia/Kolkata` (IST, UTC+05:30)

---

## 1. Product Mission & Ethical Boundaries

### Core Mission
Bengal Safety Map is a transparent, public-interest civic-tech platform designed to help citizens, researchers, community advocates, and policymakers understand publicly reported safety incidents, temporal patterns (specifically night-time dynamics), and institutional case outcomes across West Bengal, starting with a configurable pilot area.

### Absolute Non-Goals (Hard Boundaries)
1. **No Danger Prediction or Scoring:** The application strictly does **not** predict individual risk, generate "crime scores", "danger ratings", or tell individuals whether a neighborhood or transit route is "safe" or "unsafe."
2. **No Accused/Suspect Dossiers:** The platform does not track, index, search, or profile individuals (accused persons, suspects, victims, complainants, or witnesses). No personally identifiable information (PII) is displayed or made searchable.
3. **No Surveillance or Biometrics:** No facial recognition, social media scraping of personal accounts, license plate lookups, or user location tracking is supported or permitted.
4. **No Proof of Guilt from Allegations:** An allegation, media report, First Information Report (FIR), or chargesheet is an initial legal or investigative step, not proof of guilt. Case statuses are explicitly differentiated from final court judgments (convictions/acquittals).
5. **No Emergency Dispatch:** The tool is not an emergency response service. Clear notices inform users that in immediate danger they must contact verified official emergency services (National Emergency Number `112` in West Bengal).

---

## 2. Geographic Scope & Pilot Area Configuration

### Pilot Area
- **Primary Pilot Geography:** Greater Kolkata Metropolitan Area, encompassing:
  - Kolkata Municipal Corporation (KMC) Wards (Central, North, South, East, Port divisions);
  - Bidhannagar Municipal Corporation (Salt Lake & Rajarhat);
  - Howrah Municipal Corporation;
  - New Town Kolkata Development Authority (NKDA).
- **Default Map Center:** `[22.5726, 88.3639]` (Kolkata).
- **Default Bounding Box:** `[88.20, 22.40, 88.55, 22.70]`.

### West Bengal Scalability
- The underlying geographic hierarchy and PostGIS schema are designed to represent all 23 administrative districts of West Bengal, subdivided into Subdivisions, Police Commissionerates/Districts, Police Stations (Thanas), Municipal Corporations/Municipalities, and Gram Panchayats.
- The system configuration supports switching or expanding active regions via environment variables and database administrative boundaries (`administrative_areas`).

---

## 3. Temporal Modeling & Night-Time Lens Assumptions

### Local Time Handling
- All internal timestamps are stored in UTC with timezone awareness. All public API displays and user interfaces format timestamps in `Asia/Kolkata` (IST).

### Night-Time Definition
- **Default Policy Window:** `20:00:00` to `04:59:59` IST (8:00 PM to 5:00 AM).
- **Configuration:** Configurable via system policy (`NIGHT_START_HOUR=20`, `NIGHT_END_HOUR=5`).
- **Occurrence vs. Publication Time:**
  - Night-time statistics are calculated **strictly on verified incident occurrence time (`occurred_at`)**.
  - Incident time is **never** inferred or guessed from source publication or retrieval time.
  - Records where incident time is missing or imprecise (e.g. date-only) are explicitly grouped and displayed as `unknown_occurrence_time` rather than forced into daytime or nighttime buckets.
- **Contextual Disclaimer:** The UI prominently notes that observed night-time variations may reflect disparities in reporting rates, public transit availability, commercial activity, or police presence, rather than an intrinsic environmental hazard.

---

## 4. Privacy, Redaction & Spatial Generalization

### PII Policy
- Under no circumstance does the public API or map export:
  - Personal names of victims, complainants, witnesses, or accused;
  - Precise residential street addresses, house numbers, apartment names;
  - Contact information (phone numbers, email addresses);
  - Identifying demographic combinations that allow re-identification.

### Category-Specific Spatial Suppression
- High-risk incident categories (including Sexual Offenses, Offenses Against Minors/POCSO, Domestic Violence, Intimate Partner Violence, Stalking, and Human Trafficking):
  - **Never** render as exact coordinate points.
  - Display geometry is automatically generalized to the ward or district centroid, or a randomized offset within the administrative boundary.
  - Are excluded from public coordinate-level queries.

### Small-Cell Suppression Threshold (`k-anonymity`)
- When displaying hex-grid cells or localized ward clusters, any cell with fewer than `MIN_AGGREGATE_COUNT` records (default: **5**) is suppressed from public count rendering (displayed as `<5` or merged into the parent district aggregate) to prevent re-identification through sparsity or cross-referencing.

---

## 5. Case History & Append-Only Legal Lifecycle

### Status Vocabulary
Case timelines follow a strict, append-only lifecycle using controlled state enums:
1. `reported` (Public report or media-documented incident);
2. `fir_registered` (First Information Report recorded under Code of Criminal Procedure / Bharatiya Nagarik Suraksha Sanhita);
3. `investigation_ongoing` (Investigative agency enquiry);
4. `chargesheet_filed` (Final report submitted to court);
5. `trial_ongoing` (Judicial proceedings commenced);
6. `conviction` (Formal court-recorded verdict of guilt);
7. `acquittal` (Formal court-recorded acquittal or discharge);
8. `case_closed_untraced` (Final report closed as untraced or lack of evidence);
9. `unknown_status` (Status unknown or not publicly updated).

### Append-Only Immutability
- Later developments (e.g. an acquittal 2 years after an FIR) do not overwrite or delete previous events. Each milestone is stored as an immutable `case_event` with its own publication date, source citation, and verification level.

---

## 6. Provenance & Source Management

### Source Registry
- Every incident record links back to an entry in the `sources` table.
- Source records capture: source organization, canonical reference URL, retrieval timestamp, license/reuse permissions, verification status (`unverified`, `reviewed`, `verified`, `rejected`, `superseded`), and adapter state.

### External Source Boundaries
- External scrapers and live crawlers are disabled by default.
- Placeholders and adapters exist for prospective sources (e.g., official statistical releases, public safety notices, judicial judgments), but are explicitly flagged `unconfigured` / `disabled` in source listings.
- No unauthorized or scraping-restricted government feeds are accessed without explicit lawful permission.

---

## 7. Synthetic Demo Mode

### Demo Data Constraints
- All test/demonstration records are explicitly flagged `is_synthetic = true` and `dataset_release_id = 'synthetic_demo_v1'`.
- All locations in the demo dataset represent synthetic, generalized municipal centroids across Kolkata, Salt Lake, and Howrah.
- No actual living persons, real victim details, or real FIR numbers are fabricated.
- A prominent banner is displayed throughout the web application whenever synthetic demo data is loaded.

---

## 8. Offline Packages & PWA Assumptions

- Offline packages are distributed as compressed, versioned bundles containing:
  - Vector/GeoJSON boundaries of the chosen area;
  - Pre-aggregated, privacy-safe incident counts by category and night/day split;
  - Source provenance manifest and SHA-256 checksums;
  - Metadata containing data cutoff date and expiration interval (default 30 days).
- Service workers cache only the application shell and verified public data packages. Local browser storage never retains raw incident files or protected canonical coordinates.
