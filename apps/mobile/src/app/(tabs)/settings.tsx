import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';
import { localDatabase } from '../../services/localDatabase';
import {
  Settings,
  Languages,
  Server,
  Shield,
  FileText,
  RotateCcw,
  Check,
  Sparkles,
  Wifi,
  WifiOff,
  Database,
  RefreshCw,
} from 'lucide-react-native';

export default function SettingsScreen() {
  const queryClient = useQueryClient();
  const {
    dataMode,
    setDataMode,
    connectionStatus,
    apiUrl,
    setApiUrl,
    appLanguage,
    setAppLanguage,
  } = useAppStore();

  const [inputUrl, setInputUrl] = useState(apiUrl);
  const [isTesting, setIsTesting] = useState(false);

  const { data: metadata } = useQuery({
    queryKey: ['metadata'],
    queryFn: () => api.getMetadata(),
  });

  const handleSelectMode = (mode: 'demo' | 'connected') => {
    setDataMode(mode);
    queryClient.invalidateQueries();
    if (mode === 'demo') {
      Alert.alert(
        'Offline Demo Mode Active',
        'App is now operating entirely offline using bundled synthetic demo records. No backend connection is required.'
      );
    }
  };

  const handleSaveAndSync = async () => {
    const trimmed = inputUrl.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      Alert.alert('Invalid Endpoint', 'API URL must begin with http:// or https://');
      return;
    }

    setIsTesting(true);
    setApiUrl(trimmed);
    setDataMode('connected');

    try {
      const res = await fetch(`${trimmed}/api/v1/metadata`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const meta = await res.json();
        Alert.alert(
          'Connected Successfully',
          `Connected to verified host!\nDataset Version: ${meta.dataset_version || 'Production'}`
        );
      } else {
        Alert.alert(
          'Server Error',
          `Server returned HTTP ${res.status}. Falling back safely to local cached records.`
        );
      }
    } catch (err: any) {
      Alert.alert(
        'Offline Fallback Active',
        `Could not reach ${trimmed}.\n\nThe app will continue working seamlessly using local offline records.`
      );
    } finally {
      setIsTesting(false);
      queryClient.invalidateQueries();
    }
  };

  const handleResetToBundled = () => {
    localDatabase.resetToBundledDemo();
    setDataMode('demo');
    setInputUrl('');
    setApiUrl('');
    queryClient.invalidateQueries();
    Alert.alert('Reset Complete', 'All settings and data have been restored to the initial bundled offline demo state.');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Operating Mode Selector */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Database size={16} color="#1e3a8a" />
          <Text style={styles.cardTitle}>Operating Mode</Text>
        </View>
        <Text style={styles.cardSubtitle}>
          Choose how the app receives data. Release builds run in Built-in Offline Demo Mode by default with zero setup required.
        </Text>

        <View style={styles.modeToggleGroup}>
          <TouchableOpacity
            style={[styles.modeButton, dataMode === 'demo' && styles.modeButtonActive]}
            onPress={() => handleSelectMode('demo')}
          >
            <Sparkles size={14} color={dataMode === 'demo' ? '#ffffff' : '#475569'} />
            <Text style={[styles.modeButtonText, dataMode === 'demo' && styles.modeButtonTextActive]}>
              Built-in Offline Demo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeButton, dataMode === 'connected' && styles.modeButtonActive]}
            onPress={() => handleSelectMode('connected')}
          >
            <Wifi size={14} color={dataMode === 'connected' ? '#ffffff' : '#475569'} />
            <Text style={[styles.modeButtonText, dataMode === 'connected' && styles.modeButtonTextActive]}>
              Connected Data Mode
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Mode Status Banner Card */}
      {dataMode === 'demo' ? (
        <View style={[styles.card, styles.demoStatusCard]}>
          <View style={styles.cardHeader}>
            <Sparkles size={16} color="#92400e" />
            <Text style={[styles.cardTitle, { color: '#92400e' }]}>Built-in Offline Demo Active</Text>
          </View>
          <Text style={styles.demoNoticeText}>
            • <Text style={styles.bold}>Zero Setup Required:</Text> Fully functional offline. No server, Docker, API keys, or user login needed.
            {'\n'}• <Text style={styles.bold}>Synthetic Data:</Text> Clearly labelled demonstration fixtures. Not real incident records.
            {'\n'}• <Text style={styles.bold}>Release Build Date:</Text> September 2026 (v1.0.0-demo).
          </Text>
        </View>
      ) : (
        /* Connected Mode Endpoint Configuration */
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Server size={16} color="#0f766e" />
            <Text style={styles.cardTitle}>Production API Endpoint</Text>
          </View>
          <Text style={styles.cardSubtitle}>
            Configure the verified open civic safety backend. Automatically falls back to local SQLite if offline.
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={inputUrl}
              onChangeText={setInputUrl}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="https://api.staysafe-bengal.org"
            />
            <TouchableOpacity
              style={styles.syncBtn}
              onPress={handleSaveAndSync}
              disabled={isTesting}
            >
              {isTesting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.syncBtnText}>Test & Sync</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.presetRow}>
            <TouchableOpacity
              style={styles.presetChip}
              onPress={() => setInputUrl('https://api.staysafe-bengal.org')}
            >
              <Text style={styles.presetText}>Official Production API</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.presetChip}
              onPress={() => setInputUrl('http://10.0.2.2:8000')}
            >
              <Text style={styles.presetText}>Emulator Localhost (10.0.2.2)</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Language Selector */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Languages size={16} color="#1e3a8a" />
          <Text style={styles.cardTitle}>App Language / ভাষা</Text>
        </View>
        <Text style={styles.cardSubtitle}>
          Select interface language. Bengali strings are initialized for civic accessibility.
        </Text>

        <View style={styles.langRow}>
          <TouchableOpacity
            style={[styles.langChip, appLanguage === 'en' && styles.langChipActive]}
            onPress={() => setAppLanguage('en')}
          >
            {appLanguage === 'en' && <Check size={12} color="#ffffff" style={{ marginRight: 4 }} />}
            <Text style={[styles.langText, appLanguage === 'en' && styles.langTextActive]}>
              English (EN)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.langChip, appLanguage === 'bn' && styles.langChipActive]}
            onPress={() => setAppLanguage('bn')}
          >
            {appLanguage === 'bn' && <Check size={12} color="#ffffff" style={{ marginRight: 4 }} />}
            <Text style={[styles.langText, appLanguage === 'bn' && styles.langTextActive]}>
              বাংলা (Bengali - BN)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Dataset & Metadata Info */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <FileText size={16} color="#1e293b" />
          <Text style={styles.cardTitle}>Dataset & Build Metadata</Text>
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>App Release:</Text>
            <Text style={styles.metaValue}>1.0.0 (Expo SDK 52)</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Operating Mode:</Text>
            <Text style={styles.metaValue}>{dataMode === 'demo' ? 'Offline Demo (Bundled)' : 'Connected'}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Dataset Version:</Text>
            <Text style={styles.metaValue}>{metadata?.dataset_version || 'synthetic_demo_v1'}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Night Time Definition:</Text>
            <Text style={styles.metaValue}>20:00 - 05:00 IST</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Privacy Threshold:</Text>
            <Text style={styles.metaValue}>~500m cells | k &gt;= 5 suppression</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.resetBtn} onPress={handleResetToBundled}>
          <RotateCcw size={13} color="#64748b" style={{ marginRight: 4 }} />
          <Text style={styles.resetBtnText}>Restore Initial Bundled Demo State</Text>
        </TouchableOpacity>
      </View>

      {/* Ethics & Data Charter */}
      <View style={[styles.card, styles.charterCard]}>
        <View style={styles.cardHeader}>
          <Shield size={16} color="#0f766e" />
          <Text style={[styles.cardTitle, { color: '#0f766e' }]}>Ethics & Data Charter</Text>
        </View>
        <Text style={styles.charterText}>
          • <Text style={styles.bold}>Non-Stigmatization:</Text> No community, neighborhood, or group is classified as unsafe.
          {'\n'}• <Text style={styles.bold}>No Predictive Policing:</Text> Historical reports are never used to forecast individual crime or rate danger.
          {'\n'}• <Text style={styles.bold}>No Dossiers:</Text> Individual accused or victim identities are strictly excluded.
          {'\n'}• <Text style={styles.bold}>Procedural Honesty:</Text> An allegation or FIR is never conflated with a legal conviction.
        </Text>
      </View>
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
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginLeft: 6,
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 10,
    lineHeight: 16,
  },
  modeToggleGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    gap: 6,
  },
  modeButtonActive: {
    backgroundColor: '#1e3a8a',
    borderColor: '#1e3a8a',
  },
  modeButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  modeButtonTextActive: {
    color: '#ffffff',
  },
  demoStatusCard: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  demoNoticeText: {
    fontSize: 11,
    lineHeight: 18,
    color: '#92400e',
  },
  langRow: {
    flexDirection: 'row',
    gap: 8,
  },
  langChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  langChipActive: {
    backgroundColor: '#1e3a8a',
    borderColor: '#1e3a8a',
  },
  langText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
  langTextActive: {
    color: '#ffffff',
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#0f172a',
  },
  syncBtn: {
    backgroundColor: '#0f766e',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  syncBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  presetChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  presetText: {
    fontSize: 10,
    color: '#475569',
  },
  metaGrid: {
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 6,
    gap: 5,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontSize: 10,
    color: '#64748b',
  },
  metaValue: {
    fontSize: 10,
    color: '#1e293b',
    fontWeight: '600',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingTop: 4,
  },
  resetBtnText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  charterCard: {
    backgroundColor: '#f0fdfa',
    borderColor: '#ccfbf1',
    marginBottom: 24,
  },
  charterText: {
    fontSize: 11,
    lineHeight: 18,
    color: '#134e4a',
  },
  bold: {
    fontWeight: '700',
  },
});
