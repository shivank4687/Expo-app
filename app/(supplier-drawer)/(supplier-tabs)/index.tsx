import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAppSelector } from '@/store/hooks';
import { theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

export default function SupplierDashboardScreen() {
  const { supplier, isAuthenticated } = useAppSelector((state) => state.supplierAuth);

  if (!isAuthenticated || !supplier) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Not authenticated</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.nameText}>{supplier.name}</Text>
        </View>
        {supplier.company_name && (
          <Text style={styles.companyText}>{supplier.company_name}</Text>
        )}
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="receipt-outline" size={32} color={theme.colors.primary[500]} />
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="cube-outline" size={32} color={theme.colors.primary[500]} />
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Products</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="chatbubbles-outline" size={32} color={theme.colors.primary[500]} />
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Messages</Text>
        </View>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color={theme.colors.text.secondary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Account Status</Text>
            <Text style={styles.infoValue}>
              {supplier.is_approved ? 'Approved' : 'Pending Approval'}
            </Text>
          </View>
        </View>
        <View style={styles.infoCard}>
          <Ionicons name="checkmark-circle-outline" size={24} color={theme.colors.text.secondary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Verification</Text>
            <Text style={styles.infoValue}>
              {supplier.is_verified ? 'Verified' : 'Not Verified'}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  content: {
    padding: theme.spacing.lg,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  welcomeSection: {
    marginBottom: theme.spacing.sm,
  },
  welcomeText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  nameText: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  companyText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.secondary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  statValue: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.sm,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  infoSection: {
    gap: theme.spacing.md,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  infoContent: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  infoTitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  infoValue: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
  },
  errorText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.error.main,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
  },
});
