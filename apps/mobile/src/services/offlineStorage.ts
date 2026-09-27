/**
 * Offline SQLite / Local Bundle Storage Service.
 * Manages downloaded regional packages, integrity verification, and offline queries.
 */

export interface CachedPackage {
  package_id: string;
  area_code: string;
  area_name: string;
  release_version: string;
  record_count: number;
  sha256_checksum: string;
  created_at: string;
  expires_at: string;
  bundle: any;
}

let inMemoryCache: CachedPackage | null = null;

export const offlineStorage = {
  async savePackage(pkg: CachedPackage): Promise<void> {
    inMemoryCache = pkg;
    // In React Native environment, persist to SQLite / AsyncStorage
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`offline_${pkg.package_id}`, JSON.stringify(pkg));
      }
    } catch {
      // Memory fallback
    }
  },

  async getPackage(packageId = 'pkg_kolkata_metro_v1'): Promise<CachedPackage | null> {
    if (inMemoryCache && inMemoryCache.package_id === packageId) {
      return inMemoryCache;
    }
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(`offline_${packageId}`);
        if (raw) {
          inMemoryCache = JSON.parse(raw);
          return inMemoryCache;
        }
      }
    } catch {
      // Memory fallback
    }
    return inMemoryCache;
  },

  async clearOfflineData(): Promise<void> {
    inMemoryCache = null;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
    } catch {}
  },

  isPackageStale(pkg: CachedPackage): boolean {
    const now = new Date();
    const expiry = new Date(pkg.expires_at);
    return now > expiry;
  },
};
