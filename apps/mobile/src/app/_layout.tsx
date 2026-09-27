import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import EmergencyBanner from '../components/EmergencyBanner';
import SyntheticBadge from '../components/SyntheticBadge';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes cache
    },
  },
});

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <StatusBar style="light" backgroundColor="#881337" />
          {/* Emergency Helpline Banner */}
          <EmergencyBanner />
          {/* Synthetic Demo Indicator */}
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
  safeArea: {
    flex: 1,
    backgroundColor: '#881337',
  },
  content: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
});
