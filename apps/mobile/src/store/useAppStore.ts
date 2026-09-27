import { create } from 'zustand';

export type TimeFilter = 'all' | 'night' | 'day';
export type DataMode = 'demo' | 'connected';
export type ConnectionStatus = 'offline_demo' | 'connected' | 'cached_fallback' | 'offline_syncing';

interface AppState {
  // Navigation & Data Filtering
  timeFilter: TimeFilter;
  categoryFilter: string;
  selectedAreaId: string;
  searchQuery: string;

  // Dual Operating Modes
  dataMode: DataMode; // 'demo' (default offline built-in) vs 'connected'
  connectionStatus: ConnectionStatus;
  apiUrl: string;
  lastSyncTimestamp: string;
  datasetVersion: string;

  // Language & UI Preferences
  appLanguage: 'en' | 'bn';
  isOfflineSimulated: boolean;

  // Actions
  setTimeFilter: (filter: TimeFilter) => void;
  setCategoryFilter: (category: string) => void;
  setSelectedAreaId: (areaId: string) => void;
  setSearchQuery: (query: string) => void;
  setDataMode: (mode: DataMode) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setApiUrl: (url: string) => void;
  setLastSyncTimestamp: (ts: string) => void;
  setDatasetVersion: (ver: string) => void;
  setAppLanguage: (lang: 'en' | 'bn') => void;
  setIsOfflineSimulated: (simulated: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  timeFilter: 'all',
  categoryFilter: 'all',
  selectedAreaId: 'ward_kmc_central',
  searchQuery: '',

  // Built-in Offline Demo Mode enabled by default for zero-setup end users
  dataMode: 'demo',
  connectionStatus: 'offline_demo',
  apiUrl: process.env.EXPO_PUBLIC_API_URL || '',
  lastSyncTimestamp: '2026-09-27T10:00:00Z',
  datasetVersion: 'synthetic_demo_v1',

  appLanguage: 'en',
  isOfflineSimulated: false,

  setTimeFilter: (timeFilter) => set({ timeFilter }),
  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
  setSelectedAreaId: (selectedAreaId) => set({ selectedAreaId }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setDataMode: (dataMode) => set({ dataMode }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setApiUrl: (apiUrl) => set({ apiUrl }),
  setLastSyncTimestamp: (lastSyncTimestamp) => set({ lastSyncTimestamp }),
  setDatasetVersion: (datasetVersion) => set({ datasetVersion }),
  setAppLanguage: (appLanguage) => set({ appLanguage }),
  setIsOfflineSimulated: (isOfflineSimulated) => set({ isOfflineSimulated }),
}));
