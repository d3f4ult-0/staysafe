import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sparkles, Wifi, WifiOff, Database } from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';

export default function SyntheticBadge() {
  const { dataMode, connectionStatus } = useAppStore();

  if (dataMode === 'demo' || connectionStatus === 'offline_demo') {
    return (
      <View style={[styles.container, styles.demoContainer]}>
        <Sparkles size={11} color="#78350f" style={styles.icon} />
        <Text style={styles.demoText}>
          <Text style={styles.bold}>Demo data — </Text>
          synthetic, not real incident data. Built-in offline dataset (v1.0.0 • Sep 2026).
        </Text>
      </View>
    );
  }

  if (connectionStatus === 'cached_fallback') {
    return (
      <View style={[styles.container, styles.cachedContainer]}>
        <WifiOff size={11} color="#1e3a8a" style={styles.icon} />
        <Text style={styles.cachedText}>
          <Text style={styles.bold}>Offline Mode: </Text>
          Displaying locally cached verified records. Network unavailable.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.connectedContainer]}>
      <Wifi size={11} color="#065f46" style={styles.icon} />
      <Text style={styles.connectedText}>
        <Text style={styles.bold}>Connected Mode: </Text>
        Verified public safety data feed active.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
  },
  icon: {
    marginRight: 6,
  },
  bold: {
    fontWeight: '700',
  },
  demoContainer: {
    backgroundColor: '#fef3c7',
    borderBottomColor: '#fde68a',
  },
  demoText: {
    color: '#92400e',
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    flexShrink: 1,
  },
  cachedContainer: {
    backgroundColor: '#eff6ff',
    borderBottomColor: '#bfdbfe',
  },
  cachedText: {
    color: '#1e3a8a',
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    flexShrink: 1,
  },
  connectedContainer: {
    backgroundColor: '#ecfdf5',
    borderBottomColor: '#a7f3d0',
  },
  connectedText: {
    color: '#065f46',
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    flexShrink: 1,
  },
});
