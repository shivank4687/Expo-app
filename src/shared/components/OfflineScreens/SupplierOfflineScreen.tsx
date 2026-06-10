import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSelector } from '@/store/hooks';
import { supplierTheme } from '@/theme';

interface SupplierOfflineScreenProps {
  isChecking: boolean;
  onRetry: () => void;
}

export function SupplierOfflineScreen({ isChecking, onRetry }: SupplierOfflineScreenProps) {
  const insets = useSafeAreaInsets();
  const { supplier } = useAppSelector((state) => state.supplierAuth);

  // Pulse animation for the icon
  const pulseAnim = useRef(new Animated.Value(1)).current;
  // Float animation for icon
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 1500, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    );
    pulse.start();
    float.start();
    return () => {
      pulse.stop();
      float.stop();
    };
  }, [pulseAnim, floatAnim]);

  const supplierName = supplier?.name || supplier?.first_name || 'Supplier';

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <LinearGradient
        colors={['#00615E', '#00615E', '#1a7470', '#4d9892']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.3, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Decorative circles */}
      <View style={styles.decorCircleTopRight} />
      <View style={styles.decorCircleBottomLeft} />

      <View style={styles.content}>
        {/* Icon area */}
        <Animated.View
          style={[
            styles.iconContainer,
            { transform: [{ scale: pulseAnim }, { translateY: floatAnim }] },
          ]}
        >
          <View style={styles.iconRing}>
            <View style={styles.iconInner}>
              <Ionicons name="cloud-offline-outline" size={56} color="#00615E" />
            </View>
          </View>
        </Animated.View>

        {/* Status pill */}
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusPillText}>No Internet Connection</Text>
        </View>

        {/* Greeting */}
        <Text style={styles.greeting}>Hey {supplierName},</Text>
        <Text style={styles.heading}>You're Offline</Text>

        <Text style={styles.subText}>
          Don't worry — your data is safe.{'\n'}
          Once you're back online, everything{'\n'}
          will sync automatically.
        </Text>

        {/* Cached info pills — placeholder for Phase 2 offline features */}
        <View style={styles.pillsRow}>
          <View style={styles.infoPill}>
            <Ionicons name="cube-outline" size={14} color="#FCF7EA" />
            <Text style={styles.infoPillText}>Orders saved</Text>
          </View>
          <View style={styles.infoPill}>
            <Ionicons name="bag-outline" size={14} color="#FCF7EA" />
            <Text style={styles.infoPillText}>Products cached</Text>
          </View>
        </View>

        {/* Retry button */}
        <TouchableOpacity
          style={styles.retryButton}
          onPress={onRetry}
          disabled={isChecking}
          activeOpacity={0.85}
        >
          {isChecking ? (
            <ActivityIndicator size="small" color="#00615E" />
          ) : (
            <>
              <Ionicons name="refresh-outline" size={18} color="#00615E" />
              <Text style={styles.retryText}>Try Again</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.hint}>Check your Wi-Fi or mobile data</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#00615E',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  decorCircleTopRight: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  decorCircleBottomLeft: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FCF7EA',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 24,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#F59E0B',
  },
  statusPillText: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.3,
  },
  greeting: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '400',
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 4,
  },
  heading: {
    fontSize: 32,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  subText: {
    fontSize: 15,
    fontFamily: 'Inter',
    fontWeight: '400',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 36,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  infoPillText: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FCF7EA',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 16,
    minWidth: 160,
    minHeight: 52,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 16,
  },
  retryText: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#00615E',
    letterSpacing: 0.2,
  },
  hint: {
    fontSize: 13,
    fontFamily: 'Inter',
    fontWeight: '400',
    color: 'rgba(255,255,255,0.45)',
  },
});
