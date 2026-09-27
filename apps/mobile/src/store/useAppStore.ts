import { create } from 'zustand';

export type TimeFilter = 'all' | 'night' | 'day';

interface AppState {
  timeFilter: TimeFilter;
  categoryFilter: string;
  selectedAreaId: string;
  searchQuery: string;
  isOfflineMode: boolean;
  appLanguage: 'en' | 'bn';
  apiUrl: string;

  setTimeFilter: (filter: TimeFilter) => void;
  setCategoryFilter: (category: string) => void;
  setSelectedAreaId: (areaId: string) => void;
  setSearchQuery: (query: string) => void;
  setIsOfflineMode: (offline: boolean) => void;
  setAppLanguage: (lang: 'en' | 'bn') => void;
  setApiUrl: (url: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  timeFilter: 'all',
  categoryFilter: 'all',
  selectedAreaId: 'ward_kmc_central',
  searchQuery: '',
  isOfflineMode: false,
  appLanguage: 'en',
  apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000',

  setTimeFilter: (timeFilter) => set({ timeFilter }),
  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
  setSelectedAreaId: (selectedAreaId) => set({ selectedAreaId }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setIsOfflineMode: (isOfflineMode) => set({ isOfflineMode }),
  setAppLanguage: (appLanguage) => set({ appLanguage }),
  setApiUrl: (apiUrl) => set({ apiUrl }),
}));
