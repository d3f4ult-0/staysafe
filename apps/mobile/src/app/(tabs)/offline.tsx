import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { offlineStorage, CachedPackage } from '../../services/offlineStorage';
import { useAppStore } from '../../store/useAppStore';
import { OfflinePackageMeta } from '../../types/shared';
import {
  HardDrive,
  Download,
  CheckCircle,
  AlertTriangle,
  Trash2,
  ShieldCheck,
  Clock,
  FileCheck,
} from 'lucide-react-native';

export default function OfflineScreen() {
  const queryClient = useQueryClient();
  const { dataMode, setDataMode, isOfflineSimulated, setIsOfflineSimulated } = useAppStore();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Fetch available server packages
  const { data: serverPackages, isLoading } = useQuery<OfflinePackageMeta[]>({
    queryKey: ['offlinePackages'],
    queryFn: () => api.getOfflinePackages(),
  });

  // Query locally cached package from offlineStorage
  const { data: localPackage, refetch: refetchLocal } = useQuery<CachedPackage | null>({
    queryKey: ['localCachedPackage'],
    queryFn: () => offlineStorage.getPackage(),
  });

  // Download mutation
  const downloadMutation = useMutation({
    mutationFn: async (pkg: OfflinePackageMeta) => {
      setDownloadingId(pkg.package_id);
      const bundle = await api.downloadOfflinePackage(pkg.package_id);
      const cached: CachedPackage = {
        package_id: pkg.package_id,
        area_code: pkg.area_code,
        area_name: pkg.area_name,
        release_version: pkg.release_version,
        record_count: pkg.record_count,
        sha256_checksum: pkg.sha256_checksum,
        created_at: pkg.created_at,
        expires_at: pkg.expires_at,
        bundle: bundle,
      };
      await offlineStorage.savePackage(cached);
      return cached;
    },
    onSuccess: () => {
      setDownloadingId(null);
      refetchLocal();
      Alert.alert('Download Complete', 'Offline package successfully saved and verified locally.');
    },
    onError: (err) => {
      setDownloadingId(null);
      Alert.alert('Download Failed', err.message || 'Could not download offline package.');
    },
  });

  const handleClearCache = async () => {
    await offlineStorage.clearOfflineData();
    refetchLocal();
    Alert.alert('Cache Cleared', 'All locally stored offline packages have been removed.');
  };

  const isStale = localPackage ? offlineStorage.isPackageStale(localPackage) : false;
  const isOffline = dataMode === 'demo' || isOfflineSimulated;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Offline Status Banner */}
      <View style={[styles.statusCard, isOffline ? styles.statusOffline : styles.statusOnline]}>
        <View style={styles.statusHeader}>
          <HardDrive size={16} color={isOffline ? '#92400e' : '#1e3a8a'} />
          <Text style={[styles.statusTitle, isOffline ? styles.textOffline : styles.textOnline]}>
            {isOffline ? 'Active Mode: Built-in Offline Demo' : 'Active Mode: Connected (Live API)'}
          </Text>
        </View>
        <Text style={styles.statusDesc}>
          {isOffline
            ? 'The app is currently relying solely on locally stored bundles. No network requests are dispatched.'
            : 'The app connects directly to the Bengal Safety Map API for live spatial and incident queries.'}
        </Text>
        <TouchableOpacity
          style={[styles.toggleBtn, isOffline ? styles.toggleBtnActive : styles.toggleBtnInactive]}
          onPress={() => {
            if (dataMode === 'demo') {
              setDataMode('connected');
            } else {
              setIsOfflineSimulated(!isOfflineSimulated);
            }
          }}
        >
          <Text style={[styles.toggleBtnText, isOffline ? styles.toggleBtnTextActive : styles.toggleBtnTextInactive]}>
            {isOffline ? 'Switch to Live API Mode' : 'Simulate Offline Mode'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Local Storage State Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <FileCheck size={16} color="#0f766e" />
          <Text style={styles.cardTitle}>Local SQLite / Storage State</Text>
        </View>

        {localPackage ? (
          <View style={styles.localInfo}>
            <View style={styles.badgeRow}>
              <View style={styles.badgeInstalled}>
                <CheckCircle size={12} color="#166534" />
                <Text style={styles.badgeInstalledText}>Package Installed</Text>
              </View>
              {isStale && (
                <View style={styles.badgeStale}>
                  <AlertTriangle size={12} color="#991b1b" />
                  <Text style={styles.badgeStaleText}>Stale Data (Expired)</Text>
                </View>
              )}
            </View>

            <Text style={styles.pkgName}>{localPackage.area_name}</Text>
            <Text style={styles.pkgVersion}>
              Release: <Text style={styles.mono}>{localPackage.release_version}</Text> ({localPackage.record_count} verified records)
            </Text>

            <View style={styles.hashBox}>
              <Text style={styles.hashLabel}>SHA-256 Checksum:</Text>
              <Text style={styles.hashValue} numberOfLines={1} ellipsizeMode="middle">
                {localPackage.sha256_checksum}
              </Text>
            </View>

            <View style={styles.datesRow}>
              <Text style={styles.dateText}>
                Expires: {new Date(localPackage.expires_at).toLocaleDateString()}
              </Text>
            </View>

            <TouchableOpacity style={styles.deleteBtn} onPress={handleClearCache}>
              <Trash2 size={13} color="#dc2626" />
              <Text style={styles.deleteBtnText}>Remove Cached Package</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyLocal}>
            <Text style={styles.emptyText}>No local offline package currently stored on device.</Text>
            <Text style={styles.emptySubtext}>Download a package below for uninterrupted offline mapping.</Text>
          </View>
        )}
      </View>

      {/* Available Packages Section */}
      <Text style={styles.sectionHeading}>Available Regional Packages</Text>
      <Text style={styles.sectionSub}>
        Cryptographically signed, privacy-safe packages prepared by the ingestion pipeline.
      </Text>

      {isLoading ? (
        <ActivityIndicator size="small" color="#1e3a8a" style={{ marginVertical: 20 }} />
      ) : (
        <View style={styles.pkgList}>
          {serverPackages?.map((pkg) => {
            const isInstalled = localPackage?.package_id === pkg.package_id;
            const isDownloading = downloadingId === pkg.package_id;

            return (
              <View key={pkg.package_id} style={styles.pkgCard}>
                <View style={styles.pkgHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pkgTitle}>{pkg.area_name}</Text>
                    <Text style={styles.pkgId}>ID: {pkg.package_id} | Ver: {pkg.release_version}</Text>
                  </View>
                  <View style={styles.sizeBadge}>
                    <Text style={styles.sizeText}>
                      {(pkg.file_size_bytes / 1024).toFixed(1)} KB
                    </Text>
                  </View>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Data Cutoff:</Text>
                  <Text style={styles.metaVal}>{new Date(pkg.data_cutoff).toLocaleDateString()}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Record Count:</Text>
                  <Text style={styles.metaVal}>{pkg.record_count} incidents</Text>
                </View>

                <TouchableOpacity
                  style={[styles.downloadBtn, isInstalled && styles.downloadBtnInstalled]}
                  onPress={() => downloadMutation.mutate(pkg)}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : isInstalled ? (
                    <>
                      <CheckCircle size={14} color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={styles.downloadBtnText}>Re-download / Update</Text>
                    </>
                  ) : (
                    <>
                      <Download size={14} color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={styles.downloadBtnText}>Download Package</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 14,
  },
  statusCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 14,
  },
  statusOnline: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  statusOffline: {
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  textOnline: {
    color: '#1e3a8a',
  },
  textOffline: {
    color: '#92400e',
  },
  statusDesc: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
    marginBottom: 10,
  },
  toggleBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  toggleBtnInactive: {
    backgroundColor: '#1e3a8a',
  },
  toggleBtnActive: {
    backgroundColor: '#b45309',
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  toggleBtnTextInactive: {
    color: '#ffffff',
  },
  toggleBtnTextActive: {
    color: '#ffffff',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginLeft: 6,
  },
  localInfo: {
    gap: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  badgeInstalled: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  badgeInstalledText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#166534',
  },
  badgeStale: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  badgeStaleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#991b1b',
  },
  pkgName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  pkgVersion: {
    fontSize: 11,
    color: '#475569',
  },
  mono: {
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  hashBox: {
    backgroundColor: '#f1f5f9',
    padding: 6,
    borderRadius: 4,
    marginTop: 2,
  },
  hashLabel: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '600',
  },
  hashValue: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: '#334155',
  },
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  dateText: {
    fontSize: 10,
    color: '#64748b',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 8,
    gap: 4,
  },
  deleteBtnText: {
    fontSize: 11,
    color: '#dc2626',
    fontWeight: '600',
  },
  emptyLocal: {
    paddingVertical: 10,
  },
  emptyText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionSub: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 10,
  },
  pkgList: {
    gap: 10,
    marginBottom: 20,
  },
  pkgCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pkgHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  pkgTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  pkgId: {
    fontSize: 10,
    color: '#64748b',
  },
  sizeBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sizeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  metaLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  metaVal: {
    fontSize: 10,
    color: '#1e293b',
    fontWeight: '600',
  },
  downloadBtn: {
    backgroundColor: '#1e3a8a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 10,
  },
  downloadBtnInstalled: {
    backgroundColor: '#047857',
  },
  downloadBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
});
