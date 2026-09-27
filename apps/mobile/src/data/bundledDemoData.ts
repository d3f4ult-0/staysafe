import demoJson from './bundledDemoData.json';
import {
  PublicIncident,
  AreaSummary,
  CaseDetail,
  SourceMetadata,
  OfflinePackageMeta,
} from '../types/shared';

export interface BundledDemoData {
  metadata: {
    system: string;
    version: string;
    dataset_version: string;
    pilot_area: string;
    pilot_center: { latitude: number; longitude: number };
    night_window_hours: { start_ist: number; end_ist: number };
    small_cell_threshold: number;
    spatial_precision: string;
    active_release_cutoff: string;
  };
  sources: SourceMetadata[];
  incidents: PublicIncident[];
  total_incidents: number;
  aggregates: {
    type: string;
    features: any[];
  };
  area_summaries: Record<string, AreaSummary>;
  cases: Record<string, CaseDetail>;
  packages: OfflinePackageMeta[];
  download_bundle: any;
}

export const bundledDemoData: BundledDemoData = demoJson as unknown as BundledDemoData;
export default bundledDemoData;
