import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PhoneCall } from 'lucide-react-native';

export default function EmergencyBanner() {
  return (
    <View style={styles.container}>
      <PhoneCall size={14} color="#fecdd3" style={styles.icon} />
      <Text style={styles.text}>
        <Text style={styles.bold}>EMERGENCY NOTICE: </Text>
        If in immediate danger, dial <Text style={styles.helpline}>112</Text> immediately. This app does not dispatch emergency services.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#881337', // deep calm crimson
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 6,
  },
  text: {
    color: '#ffe4e6',
    fontSize: 11,
    lineHeight: 15,
    flexShrink: 1,
    textAlign: 'center',
  },
  bold: {
    fontWeight: '700',
    color: '#ffffff',
  },
  helpline: {
    fontWeight: '800',
    color: '#ffffff',
    textDecorationLine: 'underline',
  },
});
