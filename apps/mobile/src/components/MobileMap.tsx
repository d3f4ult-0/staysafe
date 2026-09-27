import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Layers, List, Scale, EyeOff, Info } from 'lucide-react-native';
import { PublicIncident } from '../types/shared';
import { useRouter } from 'expo-router';

interface MobileMapProps {
  incidents: PublicIncident[];
  aggregates: any[];
  isNightMode?: boolean;
}

const { width } = Dimensions.get('window');
const MAP_HEIGHT = 380;

export default function MobileMap({ incidents, aggregates, isNightMode = false }: MobileMapProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedIncident, setSelectedIncident] = useState<PublicIncident | null>(null);

  const plottableIncidents = incidents.filter(
    (i) => i.latitude !== null && i.longitude !== null
  );
  const suppressedCount = incidents.length - plottableIncidents.length;

  return (
    <View style={styles.cardContainer}>
      {/* Map Header Toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.viewBadge}>
          <Text style={styles.viewBadgeText}>
            {isNightMode ? 'Night Lens (20:00-05:00 IST)' : 'Greater Kolkata Pilot (500m Grid)'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
          accessibilityLabel="Toggle between Map and Accessible List view"
        >
          {viewMode === 'map' ? (
            <>
              <List size={14} color="#334155" />
              <Text style={styles.toggleText}>List View</Text>
            </>
          ) : (
            <>
              <Layers size={14} color="#334155" />
              <Text style={styles.toggleText}>Map View</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {viewMode === 'map' ? (
        <View style={[styles.canvas, isNightMode ? styles.nightCanvas : styles.dayCanvas]}>
          {/* Geographic River Axis (Hooghly River) */}
          <View style={styles.riverContainer}>
            <View style={[styles.riverLine, isNightMode ? styles.riverLineNight : styles.riverLineDay]} />
            <Text style={[styles.riverLabel, isNightMode ? styles.textNight : styles.textDay]}>
              Hooghly River
            </Text>
          </View>

          {/* Aggregate Wards */}
          {aggregates.map((agg, idx) => {
            const [lon, lat] = agg.geometry?.coordinates || [88.36, 22.57];
            const x = Math.min(Math.max(((lon - 88.25) / (88.52 - 88.25)) * (width - 48), 20), width - 68);
            const y = Math.min(Math.max((1 - (lat - 22.45) / (22.68 - 22.45)) * (MAP_HEIGHT - 60), 20), MAP_HEIGHT - 60);

            const isSupp = agg.properties?.is_suppressed;
            const countVal = agg.properties?.total_count;

            return (
              <View
                key={agg.id || idx}
                style={[
                  styles.clusterPin,
                  { left: x, top: y },
                  isSupp ? styles.clusterSuppressed : isNightMode ? styles.clusterNight : styles.clusterDay,
                ]}
              >
                <Text style={styles.clusterText}>{countVal}</Text>
              </View>
            );
          })}

          {/* Generalized Incident Points */}
          {plottableIncidents.map((inc) => {
            const x = Math.min(Math.max(((inc.longitude! - 88.25) / (88.52 - 88.25)) * (width - 48), 24), width - 64);
            const y = Math.min(Math.max((1 - (inc.latitude! - 22.45) / (22.68 - 22.45)) * (MAP_HEIGHT - 60), 24), MAP_HEIGHT - 60);

            return (
              <TouchableOpacity
                key={inc.public_id}
                onPress={() => setSelectedIncident(inc)}
                style={[
                  styles.incidentDot,
                  { left: x, top: y },
                  inc.is_night ? styles.dotNight : styles.dotDay,
                ]}
                accessibilityLabel={`Incident ${inc.public_id}: ${inc.category_name}`}
              />
            );
          })}

          {/* Selected Incident Drawer */}
          {selectedIncident && (
            <View style={styles.drawer}>
              <View style={styles.drawerHeader}>
                <View>
                  <Text style={styles.drawerId}>{selectedIncident.public_id}</Text>
                  <Text style={styles.drawerTitle}>{selectedIncident.category_name}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedIncident(null)}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.drawerArea}>
                {selectedIncident.administrative_area_name}, {selectedIncident.district_name}
              </Text>
              <Text style={styles.drawerTime}>
                Time: {selectedIncident.is_night ? 'Night (20:00-05:00 IST)' : selectedIncident.is_night === false ? 'Day (05:00-20:00 IST)' : 'Unknown'}
              </Text>

              {selectedIncident.has_case_timeline && selectedIncident.case_public_id && (
                <TouchableOpacity
                  style={styles.timelineButton}
                  onPress={() => {
                    const cid = selectedIncident.case_public_id!;
                    setSelectedIncident(null);
                    router.push(`/case/${cid}` as any);
                  }}
                >
                  <Scale size={14} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.timelineButtonText}>View Legal Case Timeline</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      ) : (
        /* Accessible List View */
        <ScrollView style={styles.listContainer}>
          <Text style={styles.listHeading}>Accessible Incident Records</Text>
          {incidents.map((inc) => (
            <View key={inc.public_id} style={styles.listItem}>
              <View style={styles.listItemHeader}>
                <Text style={styles.listItemId}>{inc.public_id}</Text>
                <Text style={inc.is_night ? styles.badgeNight : styles.badgeDay}>
                  {inc.is_night ? 'Night' : inc.is_night === false ? 'Day' : 'Unknown Time'}
                </Text>
              </View>
              <Text style={styles.listItemCategory}>{inc.category_name}</Text>
              <Text style={styles.listItemArea}>{inc.administrative_area_name}</Text>

              {inc.has_case_timeline && inc.case_public_id && (
                <TouchableOpacity
                  style={styles.inlineTimelineBtn}
                  onPress={() => router.push(`/case/${inc.case_public_id}` as any)}
                >
                  <Scale size={12} color="#1e3a8a" style={{ marginRight: 4 }} />
                  <Text style={styles.inlineTimelineText}>Procedural Case Timeline</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {/* Footer Caveats */}
      <View style={styles.footerNotice}>
        <View style={styles.noticeRow}>
          <Info size={12} color="#64748b" style={{ marginRight: 4 }} />
          <Text style={styles.footerText}>
            Reported public records generalized to ~500m cells. Does not predict individual danger.
          </Text>
        </View>
        {suppressedCount > 0 && (
          <View style={styles.suppressedBadge}>
            <EyeOff size={11} color="#92400e" style={{ marginRight: 4 }} />
            <Text style={styles.suppressedText}>{suppressedCount} sensitive records coordinate-suppressed</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  viewBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  viewBadgeText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  toggleText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
    marginLeft: 4,
  },
  canvas: {
    width: '100%',
    height: MAP_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
  },
  dayCanvas: {
    backgroundColor: '#f8fafc',
  },
  nightCanvas: {
    backgroundColor: '#0f172a',
  },
  riverContainer: {
    position: 'absolute',
    left: 45,
    top: 0,
    bottom: 0,
    width: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  riverLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 24,
    borderRadius: 12,
  },
  riverLineDay: {
    backgroundColor: '#bfdbfe',
    opacity: 0.6,
  },
  riverLineNight: {
    backgroundColor: '#1e293b',
    opacity: 0.8,
  },
  riverLabel: {
    transform: [{ rotate: '-90deg' }],
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  textDay: {
    color: '#3b82f6',
  },
  textNight: {
    color: '#64748b',
  },
  clusterPin: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  clusterDay: {
    backgroundColor: '#1e3a8a',
  },
  clusterNight: {
    backgroundColor: '#6366f1',
  },
  clusterSuppressed: {
    backgroundColor: '#94a3b8',
  },
  clusterText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  incidentDot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#ffffff',
    elevation: 2,
  },
  dotDay: {
    backgroundColor: '#2563eb',
  },
  dotNight: {
    backgroundColor: '#f59e0b',
  },
  drawer: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 5,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  drawerId: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#64748b',
  },
  drawerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  closeButton: {
    fontSize: 14,
    color: '#94a3b8',
    padding: 4,
  },
  drawerArea: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  drawerTime: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  timelineButton: {
    backgroundColor: '#1e3a8a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 6,
    marginTop: 8,
  },
  timelineButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  listContainer: {
    height: MAP_HEIGHT,
    padding: 12,
  },
  listHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  listItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  listItemId: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#64748b',
  },
  listItemCategory: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 2,
  },
  listItemArea: {
    fontSize: 11,
    color: '#64748b',
  },
  badgeDay: {
    fontSize: 10,
    color: '#1d4ed8',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgeNight: {
    fontSize: 10,
    color: '#b45309',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  inlineTimelineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  inlineTimelineText: {
    fontSize: 11,
    color: '#1e3a8a',
    fontWeight: '600',
  },
  footerNotice: {
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    color: '#64748b',
    flexShrink: 1,
  },
  suppressedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  suppressedText: {
    fontSize: 10,
    color: '#92400e',
    fontWeight: '600',
  },
});
