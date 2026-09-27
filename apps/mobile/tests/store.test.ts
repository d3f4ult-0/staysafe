import { useAppStore } from '../src/store/useAppStore';

describe('Mobile AppStore State Management', () => {
  beforeEach(() => {
    // Reset to defaults
    useAppStore.setState({
      timeFilter: 'all',
      categoryFilter: 'all',
      selectedAreaId: 'ward_kmc_central',
      searchQuery: '',
      isOfflineMode: false,
      appLanguage: 'en',
      apiUrl: 'http://localhost:8000',
    });
  });

  test('default state initialized correctly', () => {
    const state = useAppStore.getState();
    expect(state.timeFilter).toBe('all');
    expect(state.categoryFilter).toBe('all');
    expect(state.isOfflineMode).toBe(false);
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

  test('toggles offline mode and updates api url', () => {
    const { setIsOfflineMode, setApiUrl } = useAppStore.getState();

    setIsOfflineMode(true);
    expect(useAppStore.getState().isOfflineMode).toBe(true);

    setApiUrl('http://10.0.2.2:8000');
    expect(useAppStore.getState().apiUrl).toBe('http://10.0.2.2:8000');
  });

  test('switches language between English and Bengali', () => {
    const { setAppLanguage } = useAppStore.getState();

    setAppLanguage('bn');
    expect(useAppStore.getState().appLanguage).toBe('bn');

    setAppLanguage('en');
    expect(useAppStore.getState().appLanguage).toBe('en');
  });
});
