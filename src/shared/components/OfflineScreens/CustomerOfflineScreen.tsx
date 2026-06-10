import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSelector } from '@/store/hooks';
import { theme } from '@/theme';

interface CustomerOfflineScreenProps {
  isChecking: boolean;
  onRetry: () => void;
}

export function CustomerOfflineScreen({ isChecking, onRetry }: CustomerOfflineScreenProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAppSelector((state) => state.auth);

  // Bounce animation for icon
  const bounceAnim = useRef(new Animated.Value(0)).current;
  // Fade-in for content
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in content
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Bounce loop
    const bounce = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -14, duration: 700, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.delay(800),
      ])
    );
    bounce.start();
    return () => bounce.stop();
  }, [bounceAnim, fadeAnim]);

  const firstName = user?.first_name || user?.name?.split(' ')[0] || null;

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Background decoration */}
      <View style={styles.bgCircleTop} />
      <View style={styles.bgCircleBottom} />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Icon */}
        <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
          <View style={styles.iconWrapper}>
            {/* Shopping bag base */}
            <View style={styles.iconBag}>
              <Ionicons name="bag-outline" size={52} color="#00615E" />
            </View>
            {/* WiFi-off overlay badge */}
            <View style={styles.wifiBadge}>
              <Ionicons name="wifi-outline" size={16} color="#FFFFFF" />
              <View style={styles.slashLine} />
            </View>
          </View>
        </Animated.View>

        {/* Text */}
        {firstName && (
          <Text style={styles.greeting}>Hi {firstName}! 👋</Text>
        )}
        <Text style={styles.heading}>You're Offline</Text>
        <Text style={styles.subText}>
          Check your connection and try again.{'\n'}
          Your cart and wishlist are saved.
        </Text>

        {/* Cart saved badge */}
        <View style={styles.savedBadge}>
          <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
          <Text style={styles.savedBadgeText}>Cart is safely saved</Text>
        </View>

        {/* Retry */}
        <TouchableOpacity
          style={styles.retryButton}
          onPress={onRetry}
          disabled={isChecking}
          activeOpacity={0.85}
        >
          {isChecking ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="refresh" size={18} color="#FFFFFF" />
              <Text style={styles.retryText}>Retry Connection</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.hint}>Make sure Wi-Fi or mobile data is enabled</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgCircleTop: {
    position: 'absolute',
    top: -100,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#E0FFFE',
    opacity: 0.6,
  },
  bgCircleBottom: {
    position: 'absolute',
    bottom: -120,
    left: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#FCF7EA',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  iconWrapper: {
    position: 'relative',
    marginBottom: 32,
    width: 110,
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBag: {
    width: 104,
    height: 104,
    borderRadius: 32,
    backgroundColor: '#E0FFFE',
    borderWidth: 1.5,
    borderColor: '#b3d9d6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00615E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
  wifiBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  slashLine: {
    position: 'absolute',
    width: 20,
    height: 2,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '-45deg' }],
  },
  greeting: {
    fontSize: 15,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 6,
  },
  heading: {
    fontSize: 30,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#111827',
    marginBottom: 14,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subText: {
    fontSize: 15,
    fontFamily: 'Inter',
    fontWeight: '400',
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 32,
  },
  savedBadgeText: {
    fontSize: 13,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#16a34a',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#00615E',
    paddingHorizontal: 36,
    paddingVertical: 16,
    borderRadius: 16,
    minWidth: 200,
    minHeight: 52,
    shadowColor: '#00615E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 16,
  },
  retryText: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  hint: {
    fontSize: 13,
    fontFamily: 'Inter',
    fontWeight: '400',
    color: '#9ca3af',
    textAlign: 'center',
  },
});
