/**
 * Bengal Safety Map - Resilient Unified Data Service
 *
 * Implements Zero-Setup End-User Guarantee:
 * - Operates out of the box in "Built-in Offline Demo Mode" using bundled local SQLite data.
 * - When configured with a production API URL, dispatches live queries and syncs data to SQLite.
 * - Automatically falls back to local SQLite on network disconnect or server unavailability.
 * - Never shows blank error screens to end users.
 */

import {
  PublicIncident,
  AreaSummary,
  CaseDetail,
  SourceMetadata,
  OfflinePackageMeta,
} from '../types/shared';
import { useAppStore } from '../store/useAppStore';
import { localDatabase } from './localDatabase';

const FETCH_TIMEOUT_MS = 3500;

async function fetchWithTimeout(url: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

export const api = {
  async getMetadata() {
    const { dataMode, apiUrl, isOfflineSimulated, setConnectionStatus } = useAppStore.getState();

    // Mode 1: Built-in Offline Demo or Offline Simulation
    if (dataMode === 'demo' || !apiUrl || isOfflineSimulated) {
      setConnectionStatus('offline_demo');
      return localDatabase.getMetadata();
    }

    // Mode 2: Connected Mode with Clean Fallback
    try {
      const res = await fetchWithTimeout(`${apiUrl}/api/v1/metadata`);
      if (res.ok) {
        setConnectionStatus('connected');
        return await res.json();
      }
      throw new Error(`HTTP ${res.status}`);
    } catch {
      setConnectionStatus('cached_fallback');
      return localDatabase.getMetadata();
    }
  },

  async getIncidents(
    timeFilter = 'all',
    category = 'all',
    page = 1
  ): Promise<{ items: PublicIncident[]; total: number }> {
    const { dataMode, apiUrl, isOfflineSimulated, setConnectionStatus } = useAppStore.getState();

    if (dataMode === 'demo' || !apiUrl || isOfflineSimulated) {
      setConnectionStatus('offline_demo');
      return localDatabase.getIncidents(timeFilter, category, page);
    }

    try {
      let url = `${apiUrl}/api/v1/incidents?page=${page}&page_size=50&time_filter=${timeFilter}`;
      if (category !== 'all') {
        url += `&category=${category}`;
      }
      const res = await fetchWithTimeout(url);
      if (res.ok) {
        setConnectionStatus('connected');
        return await res.json();
      }
      throw new Error(`HTTP ${res.status}`);
    } catch {
      setConnectionStatus('cached_fallback');
      return localDatabase.getIncidents(timeFilter, category, page);
    }
  },

  async getAggregates(timeFilter = 'all', category = 'all') {
    const { dataMode, apiUrl, isOfflineSimulated, setConnectionStatus } = useAppStore.getState();

    if (dataMode === 'demo' || !apiUrl || isOfflineSimulated) {
      setConnectionStatus('offline_demo');
      return localDatabase.getAggregates(timeFilter, category);
    }

    try {
      let url = `${apiUrl}/api/v1/map/aggregates?time_filter=${timeFilter}`;
      if (category !== 'all') {
        url += `&category=${category}`;
      }
      const res = await fetchWithTimeout(url);
      if (res.ok) {
        setConnectionStatus('connected');
        return await res.json();
      }
      throw new Error(`HTTP ${res.status}`);
    } catch {
      setConnectionStatus('cached_fallback');
      return localDatabase.getAggregates(timeFilter, category);
    }
  },

  async getAreaSummary(areaId: string): Promise<AreaSummary> {
    const { dataMode, apiUrl, isOfflineSimulated, setConnectionStatus } = useAppStore.getState();

    if (dataMode === 'demo' || !apiUrl || isOfflineSimulated) {
      setConnectionStatus('offline_demo');
      return localDatabase.getAreaSummary(areaId);
    }

    try {
      const res = await fetchWithTimeout(`${apiUrl}/api/v1/areas/${areaId}/summary`);
      if (res.ok) {
        setConnectionStatus('connected');
        return await res.json();
      }
      throw new Error(`HTTP ${res.status}`);
    } catch {
      setConnectionStatus('cached_fallback');
      return localDatabase.getAreaSummary(areaId);
    }
  },

  async getCaseDetail(casePublicId: string): Promise<CaseDetail> {
    const { dataMode, apiUrl, isOfflineSimulated, setConnectionStatus } = useAppStore.getState();

    if (dataMode === 'demo' || !apiUrl || isOfflineSimulated) {
      setConnectionStatus('offline_demo');
      const localCase = await localDatabase.getCaseDetail(casePublicId);
      if (localCase) return localCase;
    }

    try {
      const res = await fetchWithTimeout(`${apiUrl}/api/v1/cases/${casePublicId}`);
      if (res.ok) {
        setConnectionStatus('connected');
        return await res.json();
      }
      throw new Error(`HTTP ${res.status}`);
    } catch {
      setConnectionStatus('cached_fallback');
      const fallback = await localDatabase.getCaseDetail(casePublicId);
      if (fallback) return fallback;
      throw new Error('Case record not found in offline bundle.');
    }
  },

  async getSources(): Promise<SourceMetadata[]> {
    const { dataMode, apiUrl, isOfflineSimulated, setConnectionStatus } = useAppStore.getState();

    if (dataMode === 'demo' || !apiUrl || isOfflineSimulated) {
      setConnectionStatus('offline_demo');
      return localDatabase.getSources();
    }

    try {
      const res = await fetchWithTimeout(`${apiUrl}/api/v1/sources`);
      if (res.ok) {
        setConnectionStatus('connected');
        return await res.json();
      }
      throw new Error(`HTTP ${res.status}`);
    } catch {
      setConnectionStatus('cached_fallback');
      return localDatabase.getSources();
    }
  },

  async getOfflinePackages(): Promise<OfflinePackageMeta[]> {
    const { dataMode, apiUrl, isOfflineSimulated } = useAppStore.getState();

    if (dataMode === 'demo' || !apiUrl || isOfflineSimulated) {
      return localDatabase.getOfflinePackages();
    }

    try {
      const res = await fetchWithTimeout(`${apiUrl}/api/v1/offline-packages`);
      if (res.ok) {
        return await res.json();
      }
      throw new Error(`HTTP ${res.status}`);
    } catch {
      return localDatabase.getOfflinePackages();
    }
  },

  async downloadOfflinePackage(packageId: string) {
    const { dataMode, apiUrl, isOfflineSimulated } = useAppStore.getState();

    if (dataMode === 'demo' || !apiUrl || isOfflineSimulated) {
      return localDatabase.getOfflineBundle(packageId);
    }

    try {
      const res = await fetchWithTimeout(`${apiUrl}/api/v1/offline-packages/${packageId}/download`);
      if (res.ok) {
        return await res.json();
      }
      throw new Error(`HTTP ${res.status}`);
    } catch {
      return localDatabase.getOfflineBundle(packageId);
    }
  },
};
