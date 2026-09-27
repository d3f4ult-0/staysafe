# Bengal Safety Map — Statistical & Spatial Methodology

**Document Version:** 1.0.0  
**Status:** Methodological Standard

---

## 1. Descriptive Civic Statistics vs. Predictive Modeling

Bengal Safety Map strictly limits its analytical calculations to **descriptive statistics of publicly documented records**. 

### Explicit Non-Permitted Analytical Outputs
- **Danger Scores & Crime Indices:** No synthetic risk scores or numerical rankings (e.g. "danger score 7.4/10") are calculated or displayed.
- **Predictive Heatmaps:** No algorithmic interpolation (e.g. Kernel Density Estimation over empty spaces) implying predictive risk.
- **Route Guidance:** No navigational "safe route" suggestions.

---

## 2. Night-Time Lens Methodology

### Temporal Window Definition
The Night-Time Lens calculates statistical distributions for incidents occurring between:
- **Night Window:** `20:00:00` to `04:59:59` IST (8:00 PM – 5:00 AM).
- **Day Window:** `05:00:00` to `19:59:59` IST (5:00 AM – 8:00 PM).

### Handling Imprecise or Missing Time
Many public reports, FIRs, and court records record an incident date without specifying an hour or minute:
1. **Never Infer Time:** The system strictly prohibits using source publication time or police filing time as an incident occurrence time proxy.
2. **Missingness Indicator:** The proportion of records with unknown occurrence time is computed as:
   $$\text{Missingness Rate} = \frac{\text{Count of records with precision } \in \{\text{'date_only'}, \text{'unknown'}\}}{\text{Total Incident Count}} \times 100\%$$
3. **Night-Time Share Calculation:**
   $$\text{Night-Time Share} = \frac{\text{Night Incidents (known time)}}{\text{Total Incidents with known time}} \times 100\%$$
   A conspicuous caveat is attached whenever the missingness rate exceeds 20%.

---

## 3. Spatial Aggregation & Hexagonal Binning

To avoid visual bias caused by arbitrary administrative boundary shapes, the system supports:
- **Hexagonal H3/Grid Cells (500m diameter):** Incidents with generalized coordinates are aggregated into uniform cells.
- **Administrative Summaries:** Aggregated totals for Kolkata Wards, Municipalities, and Police Station jurisdictions.
- **Small-Cell Suppression ($N < 5$):** Any spatial cell with fewer than 5 records is masked to protect privacy.

---

## 4. Denominators and Normalization

When comparing administrative units:
1. **Raw Counts Default:** Visualizations default to raw counts with explicit notation of geographical area and reporting boundaries.
2. **Per-Capita Rates (Optional Sourced Layer):**
   - Denominator: Sourced exclusively from official municipal census figures or verified statistical bulletins.
   - Requirement: The denominator source, year, and methodology must be visibly cited alongside the rate (e.g., *Per 100,000 residents based on 2011 Census / Municipal Projection*).
   - If reliable population or footfall data is unavailable for an administrative subdivision (such as transit corridors or industrial wards), normalization is explicitly omitted with the note: *"Denominator data unavailable for this area; raw counts shown."*
