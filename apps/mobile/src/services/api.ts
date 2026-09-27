import { PublicIncident, AreaSummary, CaseDetail, SourceMetadata, OfflinePackageMeta } from '../types/shared';
import { useAppStore } from '../store/useAppStore';

const getBaseUrl = () => {
  return useAppStore.getState().apiUrl;
};

export const api = {
  async getMetadata() {
    const res = await fetch(`${getBaseUrl()}/api/v1/metadata`);
    if (!res.ok) throw new Error('Failed to fetch metadata');
    return res.json();
  },

  async getIncidents(timeFilter = 'all', category = 'all', page = 1): Promise<{ items: PublicIncident[]; total: number }> {
    let url = `${getBaseUrl()}/api/v1/incidents?page=${page}&page_size=50&time_filter=${timeFilter}`;
    if (category !== 'all') {
      url += `&category=${category}`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch incidents');
    return res.json();
  },

  async getAggregates(timeFilter = 'all', category = 'all') {
    let url = `${getBaseUrl()}/api/v1/map/aggregates?time_filter=${timeFilter}`;
    if (category !== 'all') {
      url += `&category=${category}`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch aggregates');
    return res.json();
  },

  async getAreaSummary(areaId: string): Promise<AreaSummary> {
    const res = await fetch(`${getBaseUrl()}/api/v1/areas/${areaId}/summary`);
    if (!res.ok) throw new Error('Failed to fetch area summary');
    return res.json();
  },

  async getCaseDetail(casePublicId: string): Promise<CaseDetail> {
    const res = await fetch(`${getBaseUrl()}/api/v1/cases/${casePublicId}`);
    if (!res.ok) throw new Error('Failed to fetch case detail');
    return res.json();
  },

  async getSources(): Promise<SourceMetadata[]> {
    const res = await fetch(`${getBaseUrl()}/api/v1/sources`);
    if (!res.ok) throw new Error('Failed to fetch sources');
    return res.json();
  },

  async getOfflinePackages(): Promise<OfflinePackageMeta[]> {
    const res = await fetch(`${getBaseUrl()}/api/v1/offline-packages`);
    if (!res.ok) throw new Error('Failed to fetch offline packages');
    return res.json();
  },

  async downloadOfflinePackage(packageId: string) {
    const res = await fetch(`${getBaseUrl()}/api/v1/offline-packages/${packageId}/download`);
    if (!res.ok) throw new Error('Failed to download offline package');
    return res.json();
  },
};
