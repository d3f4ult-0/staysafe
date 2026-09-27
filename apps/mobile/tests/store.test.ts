import { useAppStore } from '../src/store/useAppStore';

describe('Mobile AppStore State Management & Zero-Setup Modes', () => {
  beforeEach(() => {
    // Reset to defaults
    useAppStore.setState({
      timeFilter: 'all',
      categoryFilter: 'all',
      selectedAreaId: 'ward_kmc_central',
      searchQuery: '',
      dataMode: 'demo',
      connectionStatus: 'offline_demo',
      apiUrl: '',
      lastSyncTimestamp: '2026-09-27T10:00:00Z',
      datasetVersion: 'synthetic_demo_v1',
      appLanguage: 'en',
      isOfflineSimulated: false,
    });
  });

  test('default state initialized for zero-setup offline demo', () => {
    const state = useAppStore.getState();
    expect(state.dataMode).toBe('demo');
    expect(state.connectionStatus).toBe('offline_demo');
    expect(state.timeFilter).toBe('all');
    expect(state.categoryFilter).toBe('all');
    expect(state.isOfflineSimulated).toBe(false);
    expect(state.appLanguage).toBe('en');
  });

  test('updates time filter between all, night, and day', () => {
    const { setTimeFilter } = useAppStore.getState();

    setTimeFilter('night');
    expect(useAppStore.getState().timeFilter).toBe('night');

    setTimeFilter('day');
    expect(useAppStore.getState().timeFilter).toBe('day');

    setTimeFilter('all');
    expect(useAppStore.getState().timeFilter).toBe('all');
  });

  test('updates category and area selection', () => {
    const { setCategoryFilter, setSelectedAreaId } = useAppStore.getState();

    setCategoryFilter('property_theft');
    expect(useAppStore.getState().categoryFilter).toBe('property_theft');

    setSelectedAreaId('ward_saltlake_sector5');
    expect(useAppStore.getState().selectedAreaId).toBe('ward_saltlake_sector5');
  });

  test('switches between built-in offline demo mode and connected data mode', () => {
    const { setDataMode, setConnectionStatus, setApiUrl } = useAppStore.getState();

    setDataMode('connected');
    expect(useAppStore.getState().dataMode).toBe('connected');

    setConnectionStatus('connected');
    expect(useAppStore.getState().connectionStatus).toBe('connected');

    setApiUrl('https://api.staysafe-bengal.org');
    expect(useAppStore.getState().apiUrl).toBe('https://api.staysafe-bengal.org');

    // Safe fallback status
    setConnectionStatus('cached_fallback');
    expect(useAppStore.getState().connectionStatus).toBe('cached_fallback');

    // Switch back to demo
    setDataMode('demo');
    expect(useAppStore.getState().dataMode).toBe('demo');
  });

  test('switches language between English and Bengali', () => {
    const { setAppLanguage } = useAppStore.getState();

    setAppLanguage('bn');
    expect(useAppStore.getState().appLanguage).toBe('bn');

    setAppLanguage('en');
    expect(useAppStore.getState().appLanguage).toBe('en');
  });
});
