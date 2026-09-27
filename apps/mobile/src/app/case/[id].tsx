import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { CaseDetail, CaseEvent } from '../../types/shared';
import {
  Scale,
  Calendar,
  AlertTriangle,
  ExternalLink,
  ChevronLeft,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
} from 'lucide-react-native';

export default function CaseDetailModal() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: caseDetail, isLoading, error } = useQuery<CaseDetail>({
    queryKey: ['caseDetail', id],
    queryFn: () => api.getCaseDetail(id as string),
    enabled: !!id,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'convicted':
        return { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' };
      case 'acquitted':
        return { bg: '#dcfce7', text: '#166534', border: '#86efac' };
      case 'trial':
        return { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' };
      case 'chargesheet':
        return { bg: '#e0e7ff', text: '#3730a3', border: '#a5b4fc' };
      case 'investigation':
        return { bg: '#eff6ff', text: '#1e40af', border: '#93c5fd' };
      case 'fir_registered':
        return { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' };
      default:
        return { bg: '#f8fafc', text: '#475569', border: '#e2e8f0' };
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Back Button Bar */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <ChevronLeft size={16} color="#1e3a8a" />
        <Text style={styles.backButtonText}>Return to Map</Text>
      </TouchableOpacity>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1e3a8a" />
          <Text style={styles.loadingText}>Retrieving verified legal case timeline...</Text>
        </View>
      ) : error || !caseDetail ? (
        <View style={styles.errorContainer}>
          <AlertTriangle size={24} color="#dc2626" />
          <Text style={styles.errorTitle}>Case Record Not Found</Text>
          <Text style={styles.errorDesc}>
            The requested legal record either does not exist or has not passed privacy verification.
          </Text>
        </View>
      ) : (
        <>
          {/* Header Card */}
          <View style={styles.headerCard}>
            <View style={styles.topRow}>
              <View>
                <Text style={styles.caseId}>{caseDetail.public_id}</Text>
                <Text style={styles.categoryTitle}>{caseDetail.category_name}</Text>
              </View>
              {(() => {
                const sc = getStatusColor(caseDetail.current_status);
                return (
                  <View style={[styles.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                    <Text style={[styles.statusText, { color: sc.text }]}>
                      {caseDetail.current_status_label.toUpperCase()}
                    </Text>
                  </View>
                );
              })()}
            </View>

            <View style={styles.jurisdictionRow}>
              <Scale size={14} color="#64748b" style={{ marginRight: 4 }} />
              <Text style={styles.jurisdictionText}>
                {caseDetail.jurisdiction_name} • {caseDetail.primary_area_name}
              </Text>
            </View>
          </View>

          {/* Hard Statutory Guilt Warning Notice */}
          <View style={styles.statutoryCard}>
            <View style={styles.statutoryHeader}>
              <ShieldCheck size={16} color="#92400e" />
              <Text style={styles.statutoryTitle}>Statutory Legal Notice</Text>
            </View>
            <Text style={styles.statutoryBody}>
              {caseDetail.disclaimer ||
                'FIRs, allegations, and chargesheets do not establish guilt. Under Indian jurisprudence, an accused person is presumed innocent until proven guilty beyond reasonable doubt by a final judgment of a competent court.'}
            </Text>
            <View style={styles.findingRow}>
              <Text style={styles.findingLabel}>Judicial Finding of Guilt: </Text>
              <Text
                style={[
                  styles.findingValue,
                  caseDetail.is_guilt_proven ? styles.findingConvicted : styles.findingNone,
                ]}
              >
                {caseDetail.is_guilt_proven
                  ? 'Guilt Established by Court'
                  : 'No Finding of Guilt / Procedural Only'}
              </Text>
            </View>
          </View>

          {/* Append-Only Chronological Timeline */}
          <Text style={styles.timelineHeading}>Procedural Case History (Append-Only)</Text>
          <Text style={styles.timelineSubheading}>
            Every legal status change is verified from court or gazette records with complete provenance.
          </Text>

          <View style={styles.timelineList}>
            {caseDetail.timeline?.map((evt: CaseEvent, index: number) => {
              const sc = getStatusColor(evt.status);
              const isLast = index === caseDetail.timeline.length - 1;

              return (
                <View key={evt.id || index} style={styles.timelineItem}>
                  {/* Timeline connector dot and line */}
                  <View style={styles.timelineTrack}>
                    <View style={[styles.timelineDot, { backgroundColor: sc.text }]} />
                    {!isLast && <View style={styles.timelineLine} />}
                  </View>

                  {/* Event content box */}
                  <View style={styles.eventBox}>
                    <View style={styles.eventHeader}>
                      <View
                        style={[
                          styles.eventStatusBadge,
                          { backgroundColor: sc.bg, borderColor: sc.border },
                        ]}
                      >
                        <Text style={[styles.eventStatusText, { color: sc.text }]}>
                          {evt.status_label}
                        </Text>
                      </View>
                      <View style={styles.dateBadge}>
                        <Calendar size={11} color="#64748b" style={{ marginRight: 3 }} />
                        <Text style={styles.dateText}>{evt.effective_date}</Text>
                      </View>
                    </View>

                    {evt.notes && <Text style={styles.eventNotes}>{evt.notes}</Text>}

                    {/* Source Citation */}
                    <View style={styles.sourceCitation}>
                      <FileText size={12} color="#0f766e" style={{ marginRight: 4 }} />
                      <Text style={styles.sourceName}>Source: {evt.source_name}</Text>
                      {evt.source_url && (
                        <TouchableOpacity
                          style={styles.sourceExtLink}
                          onPress={() => Linking.openURL(evt.source_url).catch(() => {})}
                        >
                          <ExternalLink size={10} color="#1d4ed8" />
                        </TouchableOpacity>
                      )}
                    </View>

                    {evt.source_excerpt && (
                      <Text style={styles.sourceExcerpt}>"{evt.source_excerpt}"</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </>
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e3a8a',
    marginLeft: 2,
  },
  centerContainer: {
    paddingVertical: 50,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991b1b',
    marginTop: 6,
  },
  errorDesc: {
    fontSize: 11,
    color: '#b91c1c',
    textAlign: 'center',
    marginTop: 4,
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  caseId: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#64748b',
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  jurisdictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jurisdictionText: {
    fontSize: 11,
    color: '#64748b',
  },
  statutoryCard: {
    backgroundColor: '#fefce8',
    borderColor: '#fef08a',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  statutoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statutoryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#854d0e',
    marginLeft: 6,
  },
  statutoryBody: {
    fontSize: 11,
    lineHeight: 16,
    color: '#713f12',
    marginBottom: 8,
  },
  findingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fef08a',
  },
  findingLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
  },
  findingValue: {
    fontSize: 10,
    fontWeight: '700',
  },
  findingConvicted: {
    color: '#b91c1c',
  },
  findingNone: {
    color: '#047857',
  },
  timelineHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  timelineSubheading: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 14,
  },
  timelineList: {
    paddingLeft: 4,
    marginBottom: 24,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  timelineTrack: {
    alignItems: 'center',
    width: 20,
    marginRight: 8,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#cbd5e1',
    marginTop: 4,
  },
  eventBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  eventStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  eventStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 10,
    color: '#64748b',
  },
  eventNotes: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 16,
    marginBottom: 6,
  },
  sourceCitation: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 4,
    borderRadius: 4,
  },
  sourceName: {
    fontSize: 10,
    color: '#0f766e',
    fontWeight: '600',
    flex: 1,
  },
  sourceExtLink: {
    padding: 2,
  },
  sourceExcerpt: {
    fontSize: 10,
    fontStyle: 'italic',
    color: '#64748b',
    marginTop: 4,
  },
});
