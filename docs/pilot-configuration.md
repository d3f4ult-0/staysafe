# Bengal Safety Map — Pilot Area Configuration Guide

**Version:** 1.0.0  
**Pilot Target:** Greater Kolkata Metropolitan Area, West Bengal

---

## 1. Pilot Area Scope

The default pilot area is centered on the Greater Kolkata Metropolitan Area:

| Attribute | Value |
|---|---|
| **Area Code** | `kolkata_metro` |
| **Friendly Name** | Greater Kolkata Pilot (KMC, Bidhannagar, Howrah, New Town) |
| **Center Latitude** | `22.5726` |
| **Center Longitude** | `88.3639` |
| **Default Zoom Level** | `12` |
| **Bounding Box** | `[88.2000, 22.4000, 88.5500, 22.7000]` (MinLon, MinLat, MaxLon, MaxLat) |
| **Constituent Jurisdictions** | Kolkata Police, Bidhannagar Police Commissionerate, Howrah Police Commissionerate |

---

## 2. Configuration Parameters

The pilot area is controlled via environment variables or database configuration:

```env
PILOT_AREA_CODE=kolkata_metro
PILOT_AREA_NAME="Greater Kolkata Metropolitan Area"
PILOT_CENTER_LAT=22.5726
PILOT_CENTER_LON=88.3639
PILOT_DEFAULT_ZOOM=12
PILOT_BBOX_MIN_LON=88.2000
PILOT_BBOX_MIN_LAT=22.4000
PILOT_BBOX_MAX_LON=88.5500
PILOT_BBOX_MAX_LAT=22.7000

# Night-Time Policy (Local Time Asia/Kolkata)
NIGHT_START_HOUR=20
NIGHT_END_HOUR=5

# Privacy Aggregation Thresholds
MIN_AGGREGATE_COUNT=5
DEFAULT_SPATIAL_PRECISION=hex_500m
```

---

## 3. Expanding to Additional West Bengal Districts

To expand to other regions across West Bengal (e.g., Siliguri / Darjeeling, Asansol-Durgapur, Malda, Murshidabad):

1. **Add Geographic Boundaries:** Ingest GeoJSON polygons of the target district/municipality into `administrative_areas`:
   ```bash
   python -m bengal_safety_map.cli areas import-geojson --file data/boundaries/darjeeling.geojson --parent-id wb_state
   ```
2. **Update Environment Pilot or Enable Multi-District Mode:**
   Change `PILOT_AREA_CODE=west_bengal_state` or create region presets in the web interface.
3. **Register Local Sources:** Add local police notices or district statistical releases to `sources` with status `reviewed` or `verified`.
