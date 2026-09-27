import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import EmergencyBanner from '../components/EmergencyBanner';
import SyntheticBadge from '../components/SyntheticBadge';
import { localDatabase } from '../services/localDatabase';
import { Shield } from 'lucide-react-native';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 10,
    },
  },
});

export default function RootLayout() {
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    async function setupOfflineStorage() {
      try {
        await localDatabase.init();
      } catch (err) {
        console.warn('Initial storage setup warning (using memory fallback):', err);
      } finally {
        setIsDbReady(true);
      }
    }

    setupOfflineStorage();
  }, []);

  if (!isDbReady) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar style="light" backgroundColor="#1e3a8a" />
        <Shield size={48} color="#ffffff" style={{ marginBottom: 16 }} />
        <Text style={styles.splashTitle}>Bengal Safety Map</Text>
        <Text style={styles.splashSubtitle}>West Bengal Public Safety Transparency</Text>
        <ActivityIndicator size="small" color="#ffffff" style={{ marginTop: 24, marginBottom: 8 }} />
        <Text style={styles.splashStatus}>Preparing offline bundled demo dataset...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <StatusBar style="light" backgroundColor="#881337" />
          {/* Emergency Helpline Banner */}
          <EmergencyBanner />
          {/* Operating Mode Indicator */}
          <SyntheticBadge />

          <View style={styles.content}>
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: '#1e3a8a' },
                headerTintColor: '#ffffff',
                headerTitleStyle: { fontWeight: '700', fontSize: 16 },
                headerShadowVisible: false,
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="case/[id]"
                options={{
                  title: 'Procedural Case Lifecycle',
                  presentation: 'modal',
                }}
              />
            </Stack>
          </View>
        </SafeAreaView>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#1e3a8a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  splashTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  splashSubtitle: {
    fontSize: 12,
    color: '#bfdbfe',
    marginTop: 4,
  },
  splashStatus: {
    fontSize: 11,
    color: '#93c5fd',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#881337',
  },
  content: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
});
