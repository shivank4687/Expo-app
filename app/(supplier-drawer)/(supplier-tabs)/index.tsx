import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAppSelector } from '@/store/hooks';
import { supplierTheme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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
    <View style={styles.root}>
      <LinearGradient
        colors={['#00615E', '#1a7470', '#4d9892', '#8bbbb7', '#c4dbd9', '#FCF7EA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.backgroundGradient}
      />
      <ScrollView contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header content */}
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
            <Ionicons name="receipt-outline" size={32} color={supplierTheme.colors.primary[500]} />
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="cube-outline" size={32} color={supplierTheme.colors.primary[500]} />
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="chatbubbles-outline" size={32} color={supplierTheme.colors.primary[500]} />
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Messages</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={24} color={supplierTheme.colors.text.secondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Account Status</Text>
              <Text style={styles.infoValue}>
                {supplier.is_approved ? 'Approved' : 'Pending Approval'}
              </Text>
            </View>
          </View>
          <View style={styles.infoCard}>
            <Ionicons name="checkmark-circle-outline" size={24} color={supplierTheme.colors.text.secondary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Verification</Text>
              <Text style={styles.infoValue}>
                {supplier.is_verified ? 'Verified' : 'Not Verified'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({

  root: {
    flex: 1,
    backgroundColor: supplierTheme.colors.background.default,
  },
  container: {
    flex: 1,
    backgroundColor: supplierTheme.colors.background.default,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 241,
  },

  content: {
    padding: supplierTheme.spacing.lg,
    paddingTop: 80, // content starts inside gradient
  },

  header: {
    marginBottom: supplierTheme.spacing.xl,
  },

  welcomeText: {
    fontSize: supplierTheme.typography.fontSize.base,
    color: '#E6F2F1',
  },

  nameText: {
    fontSize: supplierTheme.typography.fontSize['2xl'],
    fontWeight: supplierTheme.typography.fontWeight.bold,
    color: '#FFFFFF',
  },

  companyText: {
    fontSize: supplierTheme.typography.fontSize.lg,
    color: '#F1F5F4',
  },

  welcomeSection: {
    marginBottom: supplierTheme.spacing.sm,
  },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: supplierTheme.spacing.xl,
    gap: supplierTheme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: supplierTheme.colors.background.paper,
    borderRadius: supplierTheme.borderRadius.md,
    padding: supplierTheme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: supplierTheme.colors.border.light,
  },
  statValue: {
    fontSize: supplierTheme.typography.fontSize['2xl'],
    fontWeight: supplierTheme.typography.fontWeight.bold,
    color: supplierTheme.colors.text.primary,
    marginTop: supplierTheme.spacing.sm,
  },
  statLabel: {
    fontSize: supplierTheme.typography.fontSize.sm,
    color: supplierTheme.colors.text.secondary,
    marginTop: supplierTheme.spacing.xs,
  },
  infoSection: {
    gap: supplierTheme.spacing.md,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: supplierTheme.colors.background.paper,
    borderRadius: supplierTheme.borderRadius.md,
    padding: supplierTheme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: supplierTheme.colors.border.light,
  },
  infoContent: {
    marginLeft: supplierTheme.spacing.md,
    flex: 1,
  },
  infoTitle: {
    fontSize: supplierTheme.typography.fontSize.sm,
    color: supplierTheme.colors.text.secondary,
    marginBottom: supplierTheme.spacing.xs,
  },
  infoValue: {
    fontSize: supplierTheme.typography.fontSize.base,
    fontWeight: supplierTheme.typography.fontWeight.medium,
    color: supplierTheme.colors.text.primary,
  },
  errorText: {
    fontSize: supplierTheme.typography.fontSize.base,
    color: supplierTheme.colors.error.main,
    textAlign: 'center',
    marginTop: supplierTheme.spacing.xl,
  },
});

