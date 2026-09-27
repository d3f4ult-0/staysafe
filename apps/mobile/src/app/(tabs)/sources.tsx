import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { SourceMetadata } from '../../types/shared';
import {
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  BookOpen,
  Lock,
  Scale,
  CheckCircle,
  XCircle,
} from 'lucide-react-native';

export default function SourcesScreen() {
  const { data: sources, isLoading } = useQuery<SourceMetadata[]>({
    queryKey: ['sources'],
    queryFn: () => api.getSources(),
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Editorial Principles & Boundaries Header */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <ShieldCheck size={18} color="#1e3a8a" />
          <Text style={styles.cardTitle}>Data Governance & Methodology</Text>
        </View>
        <Text style={styles.cardBody}>
          Bengal Safety Map operates as a non-profit, public-interest transparency platform. We ingest,
          normalize, and verify public civic safety information under rigorous privacy guidelines.
        </Text>

        <View style={styles.boundaryBox}>
          <View style={styles.boundaryRow}>
            <Scale size={14} color="#0f766e" style={{ marginRight: 6 }} />
            <Text style={styles.boundaryText}>
              <Text style={styles.bold}>Allegation vs. Guilt: </Text>
              An FIR, chargesheet, or incident report is an unproven allegation. Guilt is established
              solely by a final judicial verdict from a competent court of law.
            </Text>
          </View>
          <View style={styles.boundaryRow}>
            <Lock size={14} color="#0f766e" style={{ marginRight: 6 }} />
            <Text style={styles.boundaryText}>
              <Text style={styles.bold}>Privacy Safeguards: </Text>
              No names, phone numbers, exact addresses, or personal dossiers are ever stored or displayed.
              Locations are snapped to ~500m hexagonal cells, and small cells (k &lt; 5) are suppressed.
            </Text>
          </View>
          <View style={styles.boundaryRow}>
            <AlertTriangle size={14} color="#b45309" style={{ marginRight: 6 }} />
            <Text style={styles.boundaryText}>
              <Text style={styles.bold}>No Prediction or Danger Scoring: </Text>
              This app never predicts individual risk, scores people or neighborhoods, or tells users where to travel.
            </Text>
          </View>
        </View>
      </View>

      {/* Sources Registry */}
      <Text style={styles.sectionTitle}>Configured Data Sources</Text>
      <Text style={styles.sectionSubtitle}>
        Only legitimate, verifiable institutional and open civic feeds are integrated into the pipeline.
      </Text>

      {isLoading ? (
        <ActivityIndicator size="small" color="#1e3a8a" style={{ marginVertical: 20 }} />
      ) : (
        <View style={styles.sourcesList}>
          {sources?.map((s) => (
            <View key={s.id} style={styles.sourceCard}>
              <View style={styles.sourceHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sourceName}>{s.name}</Text>
                  <Text style={styles.sourceOrg}>{s.organization}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    s.status === 'active_pilot'
                      ? styles.badgeActive
                      : s.status === 'synthetic_demo'
                      ? styles.badgeDemo
                      : styles.badgeDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      s.status === 'active_pilot'
                        ? styles.textActive
                        : s.status === 'synthetic_demo'
                        ? styles.textDemo
                        : styles.textDisabled,
                    ]}
                  >
                    {s.status.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.metaGrid}>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Verification Tier:</Text>
                  <Text style={styles.metaValue}>{s.verification_status}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Jurisdiction:</Text>
                  <Text style={styles.metaValue}>{s.coverage_jurisdiction}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Coverage Period:</Text>
                  <Text style={styles.metaValue}>{s.coverage_period}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Licensing:</Text>
                  <Text style={styles.metaValue}>{s.license_terms}</Text>
                </View>
              </View>

              {s.canonical_url && (
                <TouchableOpacity
                  style={styles.sourceLink}
                  onPress={() => Linking.openURL(s.canonical_url).catch(() => {})}
                >
                  <Text style={styles.sourceLinkText}>Institutional Reference URL</Text>
                  <ExternalLink size={12} color="#1d4ed8" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              )}
            </View>
          ))}

          {/* Prohibited Sources Explainer Card */}
          <View style={[styles.sourceCard, styles.prohibitedCard]}>
            <View style={styles.sourceHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.prohibitedName}>Social Media Scraping & Rumor Feeds</Text>
                <Text style={styles.sourceOrg}>Unmoderated User Posts & Messaging Groups</Text>
              </View>
              <View style={[styles.statusBadge, styles.badgeProhibited]}>
                <Text style={styles.textProhibited}>PROHIBITED BY POLICY</Text>
              </View>
            </View>
            <Text style={styles.prohibitedDesc}>
              To prevent rumor amplification, vigilante action, and unverified allegations, social media
              channels and crowdsourced chat groups are permanently excluded from this platform.
            </Text>
          </View>
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
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
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
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginLeft: 6,
  },
  cardBody: {
    fontSize: 12,
    lineHeight: 18,
    color: '#475569',
    marginBottom: 12,
  },
  boundaryBox: {
    backgroundColor: '#f0fdfa',
    borderWidth: 1,
    borderColor: '#ccfbf1',
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },
  boundaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  boundaryText: {
    fontSize: 11,
    lineHeight: 16,
    color: '#134e4a',
    flexShrink: 1,
  },
  bold: {
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 12,
  },
  sourcesList: {
    gap: 10,
    marginBottom: 24,
  },
  sourceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  sourceName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  sourceOrg: {
    fontSize: 11,
    color: '#64748b',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeActive: {
    backgroundColor: '#dcfce7',
  },
  badgeDemo: {
    backgroundColor: '#fef3c7',
  },
  badgeDisabled: {
    backgroundColor: '#f1f5f9',
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  textActive: {
    color: '#166534',
  },
  textDemo: {
    color: '#92400e',
  },
  textDisabled: {
    color: '#475569',
  },
  metaGrid: {
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 6,
    gap: 4,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 10,
    color: '#0f172a',
    fontWeight: '600',
  },
  sourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingTop: 2,
  },
  sourceLinkText: {
    fontSize: 11,
    color: '#1d4ed8',
    fontWeight: '600',
  },
  prohibitedCard: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  prohibitedName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991b1b',
  },
  badgeProhibited: {
    backgroundColor: '#fee2e2',
  },
  textProhibited: {
    fontSize: 9,
    fontWeight: '700',
    color: '#b91c1c',
  },
  prohibitedDesc: {
    fontSize: 11,
    lineHeight: 16,
    color: '#991b1b',
  },
});
