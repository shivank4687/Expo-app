import { supplierTheme } from '@/theme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function SupplierOrdersScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Supplier Orders</Text>
      <Text style={styles.subtext}>Coming soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: supplierTheme.colors.background.default,
  },
  text: {
    fontSize: supplierTheme.typography.fontSize.xl,
    fontWeight: supplierTheme.typography.fontWeight.bold,
    color: supplierTheme.colors.text.primary,
  },
  subtext: {
    fontSize: supplierTheme.typography.fontSize.base,
    color: supplierTheme.colors.text.secondary,
    marginTop: supplierTheme.spacing.sm,
  },
});
