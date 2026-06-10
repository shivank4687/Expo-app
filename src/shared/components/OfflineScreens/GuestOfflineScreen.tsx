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
import { useRouter } from 'expo-router';

interface GuestOfflineScreenProps {
  isChecking: boolean;
  onRetry: () => void;
}

export function GuestOfflineScreen({ isChecking, onRetry }: GuestOfflineScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Subtle fade-in + scale animation
  const animVal = useRef(new Animated.Value(0)).current;
  // Signal wave animations
  const wave1 = useRef(new Animated.Value(1)).current;
  const wave2 = useRef(new Animated.Value(1)).current;
  const wave3 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Content fade in
    Animated.timing(animVal, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Staggered wave fade animations
    const makeWave = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 0.2, duration: 600, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );

    const w1 = makeWave(wave1, 0);
    const w2 = makeWave(wave2, 200);
    const w3 = makeWave(wave3, 400);
    w1.start(); w2.start(); w3.start();

    return () => { w1.stop(); w2.stop(); w3.stop(); };
  }, [animVal, wave1, wave2, wave3]);

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Subtle background gradient blobs */}
      <View style={styles.blobTop} />
      <View style={styles.blobBottom} />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: animVal,
            transform: [{ scale: animVal.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }],
          },
        ]}
      >
        {/* Icon with animated signal rings */}
        <View style={styles.iconArea}>
          {/* Animated rings */}
          <Animated.View style={[styles.ring, styles.ringLarge, { opacity: wave3 }]} />
          <Animated.View style={[styles.ring, styles.ringMedium, { opacity: wave2 }]} />
          <Animated.View style={[styles.ring, styles.ringSmall, { opacity: wave1 }]} />
          {/* Icon */}
          <View style={styles.iconBox}>
            <Ionicons name="wifi-outline" size={38} color="#9ca3af" />
            <View style={styles.slashOverlay}>
              <View style={styles.slash} />
            </View>
          </View>
        </View>

        <Text style={styles.heading}>No Connection</Text>
        <Text style={styles.subText}>
          You need internet to browse products{'\n'}and explore deals.
        </Text>

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
              <Text style={styles.retryText}>Retry</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Sign in nudge */}
        <TouchableOpacity
          style={styles.signInButton}
          onPress={() => router.push('/login')}
          activeOpacity={0.7}
        >
          <Ionicons name="person-outline" size={16} color="#00615E" />
          <Text style={styles.signInText}>Sign in to your account</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>Check your Wi-Fi or mobile data settings</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blobTop: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#E0FFFE',
    opacity: 0.4,
  },
  blobBottom: {
    position: 'absolute',
    bottom: -80,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#FCF7EA',
    opacity: 0.7,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconArea: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  ringLarge: {
    width: 140,
    height: 140,
  },
  ringMedium: {
    width: 110,
    height: 110,
  },
  ringSmall: {
    width: 84,
    height: 84,
  },
  iconBox: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  slashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slash: {
    width: 52,
    height: 2.5,
    backgroundColor: '#ef4444',
    borderRadius: 2,
    transform: [{ rotate: '-45deg' }],
  },
  heading: {
    fontSize: 26,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subText: {
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '400',
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#00615E',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 14,
    minWidth: 160,
    minHeight: 50,
    shadowColor: '#00615E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 12,
    width: '100%',
  },
  retryText: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#FFFFFF',
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#b3d9d6',
    width: '100%',
    marginBottom: 28,
  },
  signInText: {
    fontSize: 15,
    fontFamily: 'Inter',
    fontWeight: '600',
    color: '#00615E',
  },
  hint: {
    fontSize: 12,
    fontFamily: 'Inter',
    fontWeight: '400',
    color: '#9ca3af',
    textAlign: 'center',
  },
});
