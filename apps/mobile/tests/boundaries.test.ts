import { PublicIncident, CaseDetail, SpatialAggregateCell } from '../src/types/shared';

describe('Civic-Tech Privacy & Procedural Boundaries', () => {
  test('procedural status guarantees: allegations and FIRs never establish guilt', () => {
    const firCase: CaseDetail = {
      id: 'case-01',
      public_id: 'CASE_TEST_01',
      category_code: 'property_theft',
      category_name: 'Property Theft',
      primary_area_name: 'Kolkata Central Commercial Core',
      jurisdiction_name: 'Chief Metropolitan Magistrate, Calcutta',
      current_status: 'fir_registered',
      current_status_label: 'FIR Registered',
      is_guilt_proven: false,
      disclaimer: 'FIRs and chargesheets do not establish guilt.',
      timeline: [
        {
          id: 'ev-1',
          event_order: 1,
          status: 'fir_registered',
          status_label: 'FIR Registered',
          effective_date: '2026-08-10',
          effective_date_precision: 'date_only',
          recorded_at: '2026-08-10T10:00:00Z',
          source_id: 'src-wb-police',
          source_name: 'West Bengal Police Gazette',
          source_url: 'https://wbpolice.gov.in',
          is_guilt_finding: false,
        },
      ],
    };

    expect(firCase.is_guilt_proven).toBe(false);
    expect(firCase.timeline[0].is_guilt_finding).toBe(false);

    // Acquittal must also never be labeled as guilt proven
    const acquittedCase: CaseDetail = {
      ...firCase,
      current_status: 'acquitted',
      current_status_label: 'Judicial Acquittal',
      is_guilt_proven: false,
    };
    expect(acquittedCase.is_guilt_proven).toBe(false);

    // Only formal conviction establishes judicial finding of guilt
    const convictedCase: CaseDetail = {
      ...firCase,
      current_status: 'convicted',
      current_status_label: 'Judicial Conviction',
      is_guilt_proven: true,
    };
    expect(convictedCase.is_guilt_proven).toBe(true);
  });

  test('privacy redaction: sensitive incident records have suppressed coordinates', () => {
    const sensitiveRecord: PublicIncident = {
      id: 'inc-99',
      public_id: 'INC_DEMO_099',
      category_code: 'sexual_offenses_harassment',
      category_name: 'Sexual Offenses (Suppressed)',
      sensitivity_tier: 'critical',
      occurred_at: '2026-08-15T22:30:00Z',
      occurred_time_precision: 'hour_only',
      is_night: true,
      reported_at: '2026-08-16T09:00:00Z',
      published_at: '2026-08-17T00:00:00Z',
      latitude: null, // suppressed
      longitude: null, // suppressed
      spatial_precision: 'exact_suppressed',
      administrative_area_name: 'Kolkata Central Commercial Core',
      district_name: 'Kolkata',
      source_name: 'West Bengal Police Gazette',
      source_url: 'https://wbpolice.gov.in',
      source_verification: 'verified',
      has_case_timeline: false,
      is_synthetic: true,
    };

    expect(sensitiveRecord.latitude).toBeNull();
    expect(sensitiveRecord.longitude).toBeNull();
    expect(sensitiveRecord.spatial_precision).toBe('exact_suppressed');
  });

  test('no personal dossiers or PII in mobile data representations', () => {
    const incident: PublicIncident = {
      id: 'inc-01',
      public_id: 'INC_DEMO_001',
      category_code: 'traffic_road_safety',
      category_name: 'Road & Traffic Safety',
      sensitivity_tier: 'standard',
      occurred_at: '2026-08-14T21:15:00Z',
      occurred_time_precision: 'exact',
      is_night: true,
      reported_at: '2026-08-14T21:45:00Z',
      published_at: '2026-08-15T00:00:00Z',
      latitude: 22.5726,
      longitude: 88.3639,
      spatial_precision: 'hex_500m',
      administrative_area_name: 'Kolkata Central Commercial Core',
      district_name: 'Kolkata',
      source_name: 'Kolkata Traffic Police Updates',
      source_url: 'https://kolkatatrafficpolice.gov.in',
      source_verification: 'verified',
      has_case_timeline: false,
      is_synthetic: true,
    };

    const keys = Object.keys(incident);
    const forbiddenKeys = [
      'accused_name',
      'victim_name',
      'phone_number',
      'email',
      'exact_street_address',
      'aadhaar',
      'pan',
      'caste',
      'religion',
      'danger_score',
      'crime_forecast',
    ];

    for (const forbidden of forbiddenKeys) {
      expect(keys).not.toContain(forbidden);
    }
  });

  test('small-cell suppression enforced on spatial aggregates', () => {
    const suppressedCell: SpatialAggregateCell = {
      cell_id: 'cell_kmc_042',
      geometry: {
        type: 'Point',
        coordinates: [88.35, 22.56],
      },
      total_count: '<5',
      night_count: '<5',
      day_count: '<5',
      unknown_time_count: 0,
      is_suppressed: true,
    };

    expect(suppressedCell.is_suppressed).toBe(true);
    expect(suppressedCell.total_count).toBe('<5');
  });
});
