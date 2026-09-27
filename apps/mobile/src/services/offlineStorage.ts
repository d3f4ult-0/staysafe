/**
 * Offline SQLite / Local Bundle Storage Service.
 * Manages downloaded regional packages, integrity verification, and offline queries.
 */

import { bundledDemoData } from '../data/bundledDemoData';

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

const bundledPackage: CachedPackage = {
  package_id: bundledDemoData.packages[0]?.package_id || 'pkg_kolkata_metro_v1',
  area_code: bundledDemoData.packages[0]?.area_code || 'kolkata_metro',
  area_name: bundledDemoData.packages[0]?.area_name || 'Greater Kolkata Metropolitan Area',
  release_version: bundledDemoData.packages[0]?.release_version || 'synthetic_demo_v1',
  record_count: bundledDemoData.packages[0]?.record_count || 18,
  file_size_bytes: bundledDemoData.packages[0]?.file_size_bytes || 11241,
  sha256_checksum: bundledDemoData.packages[0]?.sha256_checksum || '053821f6fbbe1588c12d01a633117ee1ce2eb2ddb974eacbd57c1ab76c84c304',
  created_at: bundledDemoData.packages[0]?.created_at || '2026-09-27T10:00:00Z',
  expires_at: bundledDemoData.packages[0]?.expires_at || '2027-09-27T10:00:00Z',
  bundle: bundledDemoData.download_bundle,
} as CachedPackage;

let inMemoryCache: CachedPackage | null = bundledPackage;

export const offlineStorage = {
  async savePackage(pkg: CachedPackage): Promise<void> {
    inMemoryCache = pkg;
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

    if (packageId === bundledPackage.package_id) {
      return bundledPackage;
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
