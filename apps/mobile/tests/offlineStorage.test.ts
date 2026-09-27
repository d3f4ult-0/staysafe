import { offlineStorage, CachedPackage } from '../src/services/offlineStorage';

describe('Offline Storage & Verification', () => {
  const mockPackage: CachedPackage = {
    package_id: 'pkg_kolkata_test',
    area_code: 'kolkata_metro',
    area_name: 'Greater Kolkata Pilot Area',
    release_version: 'v1.0.0',
    record_count: 25,
    sha256_checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    created_at: '2026-09-01T00:00:00Z',
    expires_at: '2026-10-01T00:00:00Z',
    bundle: {
      type: 'FeatureCollection',
      features: [],
    },
  };

  beforeEach(async () => {
    await offlineStorage.clearOfflineData();
  });

  test('saves and retrieves offline regional package', async () => {
    await offlineStorage.savePackage(mockPackage);
    const retrieved = await offlineStorage.getPackage('pkg_kolkata_test');

    expect(retrieved).not.toBeNull();
    expect(retrieved?.package_id).toBe('pkg_kolkata_test');
    expect(retrieved?.record_count).toBe(25);
    expect(retrieved?.sha256_checksum).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  test('correctly identifies non-stale vs stale packages based on expiry date', () => {
    const futurePackage: CachedPackage = {
      ...mockPackage,
      expires_at: new Date(Date.now() + 86400000).toISOString(), // tomorrow
    };
    expect(offlineStorage.isPackageStale(futurePackage)).toBe(false);

    const pastPackage: CachedPackage = {
      ...mockPackage,
      expires_at: new Date(Date.now() - 86400000).toISOString(), // yesterday
    };
    expect(offlineStorage.isPackageStale(pastPackage)).toBe(true);
  });

  test('clears offline storage cache successfully', async () => {
    await offlineStorage.savePackage(mockPackage);
    expect(await offlineStorage.getPackage('pkg_kolkata_test')).not.toBeNull();

    await offlineStorage.clearOfflineData();
    expect(await offlineStorage.getPackage('pkg_kolkata_test')).toBeNull();
  });
});
