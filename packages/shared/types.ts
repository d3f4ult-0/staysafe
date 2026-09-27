/**
 * Bengal Safety Map - Shared Type Definitions
 */

export type CaseEventStatus =
  | 'reported'
  | 'fir_registered'
  | 'investigation'
  | 'chargesheet'
  | 'trial'
  | 'convicted'
  | 'acquitted'
  | 'case_closed_untraced'
  | 'unknown';

export type TimeFilter = 'all' | 'night' | 'day';

export type TimePrecision = 'exact' | 'hour_only' | 'date_only' | 'month_only' | 'unknown';

export type SensitivityTier = 'standard' | 'high' | 'critical';

export type SpatialPrecision = 'exact_suppressed' | 'hex_500m' | 'ward_centroid' | 'district_centroid';

export interface SourceMetadata {
  id: string;
  name: string;
  organization: string;
  source_type: string; // official, court, civic, media_evidence, synthetic_demo
  status: 'unconfigured' | 'disabled' | 'active_pilot' | 'synthetic_demo';
  canonical_url: string;
  license_terms: string;
  coverage_jurisdiction: string;
  coverage_period: string;
  verification_status: 'unverified' | 'reviewed' | 'verified' | 'rejected' | 'superseded';
}

export interface CaseEvent {
  id: string;
  event_order: number;
  status: CaseEventStatus;
  status_label: string;
  effective_date: string;
  effective_date_precision: TimePrecision;
  recorded_at: string;
  source_id: string;
  source_name: string;
  source_url: string;
  source_excerpt?: string;
  is_guilt_finding: boolean;
  notes?: string;
}

export interface CaseDetail {
  id: string;
  public_id: string;
  category_code: string;
  category_name: string;
  primary_area_name: string;
  jurisdiction_name: string;
  current_status: CaseEventStatus;
  current_status_label: string;
  is_guilt_proven: boolean;
  disclaimer: string;
  timeline: CaseEvent[];
}

export interface PublicIncident {
  id: string;
  public_id: string;
  category_code: string;
  category_name: string;
  sensitivity_tier: SensitivityTier;
  occurred_at: string | null;
  occurred_time_precision: TimePrecision;
  is_night: boolean | null;
  reported_at: string | null;
  published_at: string | null;
  latitude: number | null; // null if strictly suppressed
  longitude: number | null; // null if strictly suppressed
  spatial_precision: SpatialPrecision;
  administrative_area_name: string;
  district_name: string;
  source_name: string;
  source_url: string;
  source_verification: string;
  has_case_timeline: boolean;
  case_public_id?: string;
  is_synthetic: boolean;
}

export interface AreaSummary {
  area_id: string;
  area_name: string;
  area_type: string;
  district_name: string;
  total_records: number;
  night_records: number;
  day_records: number;
  unknown_time_records: number;
  night_time_share_pct: number | null;
  unknown_time_pct: number;
  available_court_outcomes_count: number;
  sources_count: number;
  freshness_latest_record: string;
  data_cutoff_date: string;
  denominator_used: string | null;
  rate_per_capita: number | null;
  uncertainty_notes: string[];
  caveats: string[];
}

export interface SpatialAggregateCell {
  cell_id: string;
  geometry: {
    type: 'Polygon' | 'Point';
    coordinates: any;
  };
  total_count: number | string; // "<5" if suppressed
  night_count: number | string;
  day_count: number | string;
  unknown_time_count: number;
  is_suppressed: boolean;
  dominant_category?: string;
}

export interface OfflinePackageMeta {
  package_id: string;
  area_code: string;
  area_name: string;
  release_version: string;
  data_cutoff: string;
  record_count: number;
  file_size_bytes: number;
  sha256_checksum: string;
  created_at: string;
  expires_at: string;
  is_stale: boolean;
  download_url: string;
}
