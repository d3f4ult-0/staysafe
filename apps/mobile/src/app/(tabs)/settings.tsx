import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';
import {
  Settings,
  Languages,
  Server,
  Shield,
  FileText,
  RotateCcw,
  Check,
  AlertCircle,
} from 'lucide-react-native';

export default function SettingsScreen() {
  const {
    apiUrl,
    setApiUrl,
    appLanguage,
    setAppLanguage,
  } = useAppStore();

  const [inputUrl, setInputUrl] = useState(apiUrl);
  const [isSavedUrl, setIsSavedUrl] = useState(false);

  const { data: metadata } = useQuery({
    queryKey: ['metadata'],
    queryFn: () => api.getMetadata(),
  });

  const handleSaveApiUrl = () => {
    if (!inputUrl.trim().startsWith('http')) {
      Alert.alert('Invalid URL', 'Backend URL must begin with http:// or https://');
      return;
    }
    setApiUrl(inputUrl.trim());
    setIsSavedUrl(true);
    setTimeout(() => setIsSavedUrl(false), 2500);
    Alert.alert('Configuration Saved', `Active API URL set to:\n${inputUrl.trim()}`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Language Selector */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Languages size={16} color="#1e3a8a" />
          <Text style={styles.cardTitle}>App Language / ভাষা</Text>
        </View>
        <Text style={styles.cardSubtitle}>
          Choose your interface language. Bengali strings are initialized for civic accessibility.
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

      {/* Backend API Server Configuration */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Server size={16} color="#0f766e" />
          <Text style={styles.cardTitle}>Backend Server Endpoint</Text>
        </View>
        <Text style={styles.cardSubtitle}>
          Configure the API endpoint. Use 10.0.2.2:8000 on Android Emulator to reach host machine.
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputUrl}
            onChangeText={setInputUrl}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="http://localhost:8000"
          />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveApiUrl}>
            <Text style={styles.saveBtnText}>{isSavedUrl ? 'Saved!' : 'Update'}</Text>
          </TouchableOpacity>
        </View>

        {/* Preset quick buttons */}
        <View style={styles.presetRow}>
          <TouchableOpacity
            style={styles.presetChip}
            onPress={() => setInputUrl('http://10.0.2.2:8000')}
          >
            <Text style={styles.presetText}>Android Emulator (10.0.2.2)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.presetChip}
            onPress={() => setInputUrl('http://localhost:8000')}
          >
            <Text style={styles.presetText}>Localhost (8000)</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* System Metadata & Dataset Version */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <FileText size={16} color="#1e293b" />
          <Text style={styles.cardTitle}>Dataset & Release Metadata</Text>
        </View>

        <View style={styles.metaGrid}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>App Release:</Text>
            <Text style={styles.metaValue}>1.0.0 (Expo SDK 52)</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Pilot Region:</Text>
            <Text style={styles.metaValue}>Greater Kolkata Metro Core</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Night Time Window:</Text>
            <Text style={styles.metaValue}>20:00 - 05:00 IST</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Data Redaction:</Text>
            <Text style={styles.metaValue}>~500m cells | k &gt;= 5 suppression</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Dataset Status:</Text>
            <Text style={styles.metaValue}>{metadata?.dataset_version || 'synthetic_demo_v1'}</Text>
          </View>
        </View>
      </View>

      {/* Ethics & Data Integrity Charter */}
      <View style={[styles.card, styles.charterCard]}>
        <View style={styles.cardHeader}>
          <Shield size={16} color="#0f766e" />
          <Text style={[styles.cardTitle, { color: '#0f766e' }]}>Ethics & Data Charter</Text>
        </View>
        <Text style={styles.charterText}>
          • <Text style={styles.bold}>Non-Stigmatization:</Text> No community, neighborhood, or group is classified as unsafe.
          {'\n'}• <Text style={styles.bold}>No Predictive Policing:</Text> Historical reports are not used to forecast individual crime or rate danger.
          {'\n'}• <Text style={styles.bold}>No Dossiers:</Text> Individual accused or victim identities are strictly excluded from public display.
          {'\n'}• <Text style={styles.bold}>Procedural Honesty:</Text> An allegation is never conflated with a legal conviction.
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
  saveBtn: {
    backgroundColor: '#0f766e',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  saveBtnText: {
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
