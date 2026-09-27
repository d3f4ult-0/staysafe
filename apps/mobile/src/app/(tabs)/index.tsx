import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useAppStore } from '../../store/useAppStore';
import MobileMap from '../../components/MobileMap';
import { Filter, Moon, Sun, Clock } from 'lucide-react-native';

const CATEGORIES = [
  { code: 'all', label: 'All Categories' },
  { code: 'property_theft', label: 'Property Theft' },
  { code: 'traffic_road_safety', label: 'Road & Traffic' },
  { code: 'assault_physical_violence', label: 'Physical Assault' },
  { code: 'sexual_offenses_harassment', label: 'Sexual Offenses (Suppressed)' },
  { code: 'domestic_violence_family', label: 'Domestic Violence (Suppressed)' },
];

export default function ExploreMapScreen() {
  const { timeFilter, setTimeFilter, categoryFilter, setCategoryFilter } = useAppStore();

  const { data: incidentsData, isLoading: loadingIncidents } = useQuery({
    queryKey: ['incidents', timeFilter, categoryFilter],
    queryFn: () => api.getIncidents(timeFilter, categoryFilter),
  });

  const { data: aggregatesData } = useQuery({
    queryKey: ['aggregates', timeFilter, categoryFilter],
    queryFn: () => api.getAggregates(timeFilter, categoryFilter),
  });

  const incidents = incidentsData?.items || [];
  const aggregates = aggregatesData?.features || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Time Filter Pills */}
      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>Time Filter:</Text>
        <View style={styles.pillRow}>
          <TouchableOpacity
            style={[styles.pill, timeFilter === 'all' && styles.pillActive]}
            onPress={() => setTimeFilter('all')}
          >
            <Clock size={12} color={timeFilter === 'all' ? '#ffffff' : '#334155'} />
            <Text style={[styles.pillText, timeFilter === 'all' && styles.pillTextActive]}>All Times</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pill, timeFilter === 'night' && styles.pillActiveNight]}
            onPress={() => setTimeFilter('night')}
          >
            <Moon size={12} color={timeFilter === 'night' ? '#fef08a' : '#334155'} />
            <Text style={[styles.pillText, timeFilter === 'night' && styles.pillTextActiveNight]}>Night (20-05)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pill, timeFilter === 'day' && styles.pillActive]}
            onPress={() => setTimeFilter('day')}
          >
            <Sun size={12} color={timeFilter === 'day' ? '#ffffff' : '#334155'} />
            <Text style={[styles.pillText, timeFilter === 'day' && styles.pillTextActive]}>Day (05-20)</Text>
          </TouchableOpacity>
        </View>

        {/* Category Filter Horizontal Scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.code}
              style={[styles.catBadge, categoryFilter === c.code && styles.catBadgeActive]}
              onPress={() => setCategoryFilter(c.code)}
            >
              <Text style={[styles.catText, categoryFilter === c.code && styles.catTextActive]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Interactive Map & Spatial Clusters */}
      {loadingIncidents ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#1e3a8a" />
          <Text style={styles.loaderText}>Loading Greater Kolkata spatial data...</Text>
        </View>
      ) : (
        <MobileMap incidents={incidents} aggregates={aggregates} isNightMode={timeFilter === 'night'} />
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
    padding: 12,
  },
  filterSection: {
    marginBottom: 12,
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    gap: 4,
  },
  pillActive: {
    backgroundColor: '#1e3a8a',
  },
  pillActiveNight: {
    backgroundColor: '#0f172a',
  },
  pillText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#ffffff',
  },
  pillTextActiveNight: {
    color: '#fef08a',
  },
  catScroll: {
    flexDirection: 'row',
  },
  catBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginRight: 6,
    backgroundColor: '#ffffff',
  },
  catBadgeActive: {
    borderColor: '#1e3a8a',
    backgroundColor: '#eff6ff',
  },
  catText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '500',
  },
  catTextActive: {
    color: '#1e3a8a',
    fontWeight: '700',
  },
  loaderContainer: {
    height: 380,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  loaderText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
  },
});
