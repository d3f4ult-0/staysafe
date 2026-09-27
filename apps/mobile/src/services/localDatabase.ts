/**
 * Local SQLite & Offline Database Service
 *
 * Provides immediate zero-setup offline storage.
 * Seeds with bundled synthetic demo data on first launch so the mobile app
 * is 100% functional without requiring any backend, server, docker, or network connection.
 */

import { bundledDemoData, BundledDemoData } from '../data/bundledDemoData';
import {
  PublicIncident,
  AreaSummary,
  CaseDetail,
  SourceMetadata,
  OfflinePackageMeta,
} from '../types/shared';

import * as SQLite from 'expo-sqlite';

export interface LocalSyncInfo {
  dataMode: 'demo' | 'connected';
  datasetVersion: string;
  lastUpdated: string;
  sourceType: string;
  isStale: boolean;
  totalRecords: number;
}

class LocalDatabase {
  private isInitialized = false;
  private db: any = null;
  private memoryStore: BundledDemoData = JSON.parse(JSON.stringify(bundledDemoData));
  private syncInfo: LocalSyncInfo = {
    dataMode: 'demo',
    datasetVersion: bundledDemoData.metadata.dataset_version,
    lastUpdated: '2026-09-27T10:00:00Z',
    sourceType: 'Bundled Synthetic Demo Data',
    isStale: false,
    totalRecords: bundledDemoData.incidents.length,
  };

  /**
   * Initializes local database. Runs on app launch.
   * Ensures instant readiness with zero configuration.
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      if (SQLite && typeof (SQLite as any).openDatabaseAsync === 'function') {
        this.db = await (SQLite as any).openDatabaseAsync('bengal_safety_map.db');
        await this.createTables();
        await this.seedIfEmpty();
      }
    } catch {
      // Fallback to high-performance in-memory structured store (for web, Jest, or simulated environments)
      this.memoryStore = JSON.parse(JSON.stringify(bundledDemoData));
    }

    this.isInitialized = true;
  }

  private async createTables(): Promise<void> {
    if (!this.db) return;
    try {
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS metadata (
          key TEXT PRIMARY KEY,
          value TEXT
        );
        CREATE TABLE IF NOT EXISTS incidents (
          id TEXT PRIMARY KEY,
          public_id TEXT,
          category_code TEXT,
          category_name TEXT,
          is_night INTEGER,
          occurred_at TEXT,
          latitude REAL,
          longitude REAL,
          payload TEXT
        );
        CREATE TABLE IF NOT EXISTS sync_meta (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          data_mode TEXT,
          dataset_version TEXT,
          last_updated TEXT,
          source_type TEXT
        );
      `);
    } catch (err) {
      console.warn('SQLite table creation failed, using memory store fallback:', err);
      this.db = null;
    }
  }

  private async seedIfEmpty(): Promise<void> {
    if (!this.db) return;
    try {
      const existing = await this.db.getFirstAsync('SELECT count(*) as count FROM incidents');
      if (!existing || existing.count === 0) {
        for (const inc of bundledDemoData.incidents) {
          await this.db.runAsync(
            `INSERT OR REPLACE INTO incidents (id, public_id, category_code, category_name, is_night, occurred_at, latitude, longitude, payload)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              inc.id,
              inc.public_id,
              inc.category_code,
              inc.category_name,
              inc.is_night === null ? null : inc.is_night ? 1 : 0,
              inc.occurred_at,
              inc.latitude,
              inc.longitude,
              JSON.stringify(inc),
            ]
          );
        }

        await this.db.runAsync(
          `INSERT OR REPLACE INTO sync_meta (id, data_mode, dataset_version, last_updated, source_type)
           VALUES (1, 'demo', ?, ?, 'Bundled Synthetic Demo Data')`,
          [bundledDemoData.metadata.dataset_version, new Date().toISOString()]
        );
      }
    } catch (err) {
      console.warn('SQLite seed failed, using memory store fallback:', err);
      this.db = null;
    }
  }

  async getSyncInfo(): Promise<LocalSyncInfo> {
    return this.syncInfo;
  }

  async getMetadata() {
    return {
      ...this.memoryStore.metadata,
      dataset_version: (this.memoryStore.metadata as any).active_release_version || this.memoryStore.metadata.dataset_version,
    };
  }

  async getSources(): Promise<SourceMetadata[]> {
    return this.memoryStore.sources;
  }

  async getIncidents(
    timeFilter = 'all',
    category = 'all',
    page = 1,
    pageSize = 50
  ): Promise<{ items: PublicIncident[]; total: number }> {
    let items = [...this.memoryStore.incidents];

    if (timeFilter === 'night') {
      items = items.filter((i) => i.is_night === true);
    } else if (timeFilter === 'day') {
      items = items.filter((i) => i.is_night === false);
    }

    if (category !== 'all') {
      items = items.filter((i) => i.category_code === category);
    }

    const total = items.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedItems = items.slice(startIndex, startIndex + pageSize);

    return {
      items: paginatedItems,
      total,
    };
  }

  async getAggregates(timeFilter = 'all', category = 'all') {
    const rawFeatures = this.memoryStore.aggregates.features || [];
    let filtered = rawFeatures;

    if (category !== 'all') {
      filtered = rawFeatures.filter(
        (f) => !f.properties?.dominant_category || f.properties.dominant_category === category
      );
    }

    return {
      type: 'FeatureCollection',
      features: filtered,
    };
  }

  async getAreaSummary(areaId: string): Promise<AreaSummary> {
    const summary = this.memoryStore.area_summaries[areaId];
    if (summary) return summary;

    // Default fallback summary if uncataloged zone selected
    return {
      area_id: areaId,
      area_name: areaId.replace('ward_', '').replace(/_/g, ' ').toUpperCase(),
      area_type: 'ward',
      district_name: 'Kolkata',
      total_records: 0,
      night_records: 0,
      day_records: 0,
      unknown_time_records: 0,
      night_time_share_pct: null,
      unknown_time_pct: 0,
      available_court_outcomes_count: 0,
      sources_count: 1,
      freshness_latest_record: '2026-09-26T20:00:00Z',
      data_cutoff_date: '2026-09-26T23:59:59Z',
      denominator_used: 'Census 2011 Population Estimate',
      rate_per_capita: null,
      uncertainty_notes: ['Record density insufficient for stable per-capita rate.'],
      caveats: [
        'Data compiled under synthetic demonstration policy.',
        'Zero real-world crime prediction or danger assessment.',
      ],
    };
  }

  async getCaseDetail(casePublicId: string): Promise<CaseDetail | null> {
    const found = this.memoryStore.cases[casePublicId];
    if (found) return found;

    // Fuzzy check (e.g. CASE-2026-001 vs CASE_DEMO_001)
    for (const key of Object.keys(this.memoryStore.cases)) {
      if (
        key.toLowerCase() === casePublicId.toLowerCase() ||
        key.replace(/[-_]/g, '') === casePublicId.replace(/[-_]/g, '')
      ) {
        return this.memoryStore.cases[key];
      }
    }
    return null;
  }

  async getOfflinePackages(): Promise<OfflinePackageMeta[]> {
    return this.memoryStore.packages;
  }

  async getOfflineBundle(packageId: string) {
    return this.memoryStore.download_bundle;
  }

  /**
   * Updates local database with fresh verified data downloaded from production API.
   * Switches state from 'demo' to 'connected'.
   */
  async updateWithRemoteData(
    releaseVersion: string,
    incidents: PublicIncident[],
    aggregates: any,
    areaSummaries: Record<string, AreaSummary>,
    sources: SourceMetadata[]
  ): Promise<void> {
    this.memoryStore.metadata.dataset_version = releaseVersion;
    this.memoryStore.incidents = incidents;
    this.memoryStore.aggregates = aggregates;
    this.memoryStore.area_summaries = areaSummaries;
    this.memoryStore.sources = sources;

    this.syncInfo = {
      dataMode: 'connected',
      datasetVersion: releaseVersion,
      lastUpdated: new Date().toISOString(),
      sourceType: 'Verified Production Open API',
      isStale: false,
      totalRecords: incidents.length,
    };
  }

  /**
   * Resets local data back to initial built-in synthetic demo fixtures.
   */
  resetToBundledDemo(): void {
    this.memoryStore = JSON.parse(JSON.stringify(bundledDemoData));
    this.syncInfo = {
      dataMode: 'demo',
      datasetVersion: bundledDemoData.metadata.dataset_version,
      lastUpdated: '2026-09-27T10:00:00Z',
      sourceType: 'Bundled Synthetic Demo Data',
      isStale: false,
      totalRecords: bundledDemoData.incidents.length,
    };
  }
}

export const localDatabase = new LocalDatabase();
export default localDatabase;
