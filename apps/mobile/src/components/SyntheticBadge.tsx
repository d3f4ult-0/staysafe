import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sparkles } from 'lucide-react-native';

export default function SyntheticBadge() {
  return (
    <View style={styles.container}>
      <Sparkles size={12} color="#78350f" style={styles.icon} />
      <Text style={styles.text}>
        SYNTHETIC DEMO MODE: Fictional demonstration records for pilot evaluation. Not real-world incident data.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fef3c7',
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
    paddingVertical: 4,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 6,
  },
  text: {
    color: '#92400e',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    flexShrink: 1,
  },
});
