import { localDatabase } from '../src/services/localDatabase';
import { api } from '../src/services/api';
import { useAppStore } from '../src/store/useAppStore';

describe('Zero-Setup Offline Database & Bundled Fixtures', () => {
  beforeAll(async () => {
    await localDatabase.init();
    useAppStore.setState({
      dataMode: 'demo',
      connectionStatus: 'offline_demo',
      apiUrl: '',
      isOfflineSimulated: false,
    });
  });

  test('bundled database initializes with complete demo dataset', async () => {
    const meta = await localDatabase.getMetadata();
    expect(meta).toBeDefined();
    expect(meta.dataset_version).toBe('synthetic_demo_v1');
    expect((meta.pilot_area as any).area_code || meta.pilot_area).toBe('kolkata_metro');
  });

  test('local query returns all 18 synthetic incidents with correct temporal splits', async () => {
    const all = await localDatabase.getIncidents('all', 'all');
    expect(all.total).toBe(18);
    expect(all.items.length).toBe(18);

    const nightOnly = await localDatabase.getIncidents('night', 'all');
    expect(nightOnly.items.every((i) => i.is_night === true)).toBe(true);

    const dayOnly = await localDatabase.getIncidents('day', 'all');
    expect(dayOnly.items.every((i) => i.is_night === false)).toBe(true);
  });

  test('area summary contains population normalization and census caveats', async () => {
    const summary = await localDatabase.getAreaSummary('ward_kmc_central');
    expect(summary).toBeDefined();
    expect(summary.area_name).toContain('Kolkata Central Commercial Core');
    expect(summary.total_records).toBeGreaterThan(0);
    expect(summary.caveats.length).toBeGreaterThan(0);
  });

  test('procedural case detail returns complete append-only history', async () => {
    const caseDetail = await localDatabase.getCaseDetail('CASE-2026-001');
    expect(caseDetail).not.toBeNull();
    expect(caseDetail?.public_id).toBe('CASE-2026-001');
    expect(caseDetail?.timeline.length).toBeGreaterThanOrEqual(2);
    expect(caseDetail?.disclaimer).toContain('presumed innocent');
  });

  test('unified api service transparently serves from local database when offline', async () => {
    // In demo mode with no API URL, api.getIncidents() MUST resolve from local database
    const result = await api.getIncidents('all', 'all');
    expect(result.items.length).toBe(18);

    const sources = await api.getSources();
    expect(sources.length).toBeGreaterThanOrEqual(1);

    const state = useAppStore.getState();
    expect(state.connectionStatus).toBe('offline_demo');
  });
});
