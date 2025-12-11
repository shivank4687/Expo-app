import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@/theme';

export default function SupplierMessagesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Supplier Messages</Text>
      <Text style={styles.subtext}>Coming soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.default,
  },
  text: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  subtext: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
  },
});
