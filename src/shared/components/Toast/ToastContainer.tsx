import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    TouchableOpacity,
    PanResponder,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useToast, ToastType } from './ToastContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = -50;

/**
 * ToastContainer — Premium floating toast notification
 *
 * Design:
 *  • Floating rounded card with horizontal margins (not full-width banner)
 *  • Colored left-border accent strip per toast type
 *  • Soft alpha-tinted icon container
 *  • Spring entrance (translateY + scale + opacity) for buttery smoothness
 *  • Timing exit (fade + slide up)
 *  • Animated bottom progress bar (non-native driver, separate animation)
 *  • Swipe-up-to-dismiss gesture with rubber-band resistance
 */
export const ToastContainer: React.FC = () => {
    const { toast, hideToast } = useToast();
    const insets = useSafeAreaInsets();

    // --- Native-driver animations (transform + opacity) ---
    const translateY = useRef(new Animated.Value(-200)).current;
    const opacity    = useRef(new Animated.Value(0)).current;
    const scale      = useRef(new Animated.Value(0.88)).current;

    // --- JS-driver animation (width % — cannot use native driver) ---
    const progressAnim = useRef(new Animated.Value(1)).current; // 1 → 0

    const timeoutRef      = useRef<NodeJS.Timeout | null>(null);
    const progressAnimRef = useRef<Animated.CompositeAnimation | null>(null);

    const targetY = insets.top + 10;

    useEffect(() => {
        if (toast.visible && toast.message) {
            enter();
        } else {
            exit();
        }
        return () => clearTimer();
    }, [toast.id, toast.visible]);

    /* ---------- animations ---------- */

    const enter = () => {
        clearTimer();

        // Reset progress to full
        progressAnim.setValue(1);

        // Entrance: spring for transform/scale, timing for opacity
        Animated.parallel([
            Animated.spring(translateY, {
                toValue: targetY,
                useNativeDriver: true,
                mass: 0.7,
                stiffness: 180,
                damping: 18,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 180,
                useNativeDriver: true,
            }),
            Animated.spring(scale, {
                toValue: 1,
                useNativeDriver: true,
                mass: 0.7,
                stiffness: 200,
                damping: 18,
            }),
        ]).start();

        // Progress bar drains over duration (JS driver required for width %)
        progressAnimRef.current = Animated.timing(progressAnim, {
            toValue: 0,
            duration: toast.duration || 3000,
            useNativeDriver: false,
        });
        progressAnimRef.current.start();

        // Auto dismiss
        timeoutRef.current = setTimeout(() => exit(), toast.duration || 3000);
    };

    const exit = () => {
        clearTimer();
        progressAnimRef.current?.stop();

        Animated.parallel([
            Animated.timing(translateY, {
                toValue: targetY - 60,
                duration: 220,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 180,
                useNativeDriver: true,
            }),
            Animated.timing(scale, {
                toValue: 0.9,
                duration: 220,
                useNativeDriver: true,
            }),
        ]).start(() => hideToast());
    };

    const clearTimer = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    /* ---------- swipe gesture ---------- */

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6,
            onPanResponderMove: (_, g) => {
                if (g.dy < 0) {
                    // Rubber-band resistance: slow movement the further you drag
                    translateY.setValue(targetY + g.dy * 0.55);
                }
            },
            onPanResponderRelease: (_, g) => {
                if (g.dy < SWIPE_THRESHOLD || g.vy < -1.2) {
                    exit();
                } else {
                    // Snap back
                    Animated.spring(translateY, {
                        toValue: targetY,
                        useNativeDriver: true,
                        mass: 0.6,
                        stiffness: 200,
                        damping: 20,
                    }).start();
                }
            },
        })
    ).current;

    if (!toast.visible || !toast.message) return null;

    const config = getToastConfig(toast.type ?? 'info');
    const progressBarWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    return (
        <Animated.View
            style={[
                styles.wrapper,
                {
                    transform: [{ translateY }, { scale }],
                    opacity,
                },
            ]}
            {...panResponder.panHandlers}
        >
            <View style={[styles.card, { borderLeftColor: config.accentColor }]}>

                {/* ── Icon ── */}
                <View style={[styles.iconWrap, { backgroundColor: config.iconBg }]}>
                    <Ionicons name={config.icon} size={20} color={config.accentColor} />
                </View>

                {/* ── Text ── */}
                <View style={styles.textWrap}>
                    {toast.title ? (
                        <>
                            <Text style={styles.titleText} numberOfLines={1}>
                                {toast.title}
                            </Text>
                            <Text style={styles.messageText} numberOfLines={2}>
                                {toast.message}
                            </Text>
                        </>
                    ) : (
                        <Text style={styles.messageSolo} numberOfLines={2}>
                            {toast.message}
                        </Text>
                    )}
                </View>

                {/* ── Close ── */}
                <TouchableOpacity
                    onPress={exit}
                    style={styles.closeBtn}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    activeOpacity={0.6}
                >
                    <Ionicons name="close" size={15} color={theme.colors.neutral[400]} />
                </TouchableOpacity>

                {/* ── Progress bar ── */}
                <Animated.View
                    style={[
                        styles.progressBar,
                        {
                            width: progressBarWidth,
                            backgroundColor: config.accentColor,
                        },
                    ]}
                />
            </View>
        </Animated.View>
    );
};

/* ─────────────── helpers ─────────────── */

interface ToastConfig {
    accentColor: string;
    iconBg: string;
    icon: keyof typeof Ionicons.glyphMap;
}

function getToastConfig(type: ToastType): ToastConfig {
    switch (type) {
        case 'success':
            return {
                accentColor: '#16a34a',   // rich green
                iconBg: 'rgba(22,163,74,0.10)',
                icon: 'checkmark-circle',
            };
        case 'error':
            return {
                accentColor: '#dc2626',   // strong red
                iconBg: 'rgba(220,38,38,0.10)',
                icon: 'close-circle',
            };
        case 'warning':
            return {
                accentColor: '#d97706',   // amber
                iconBg: 'rgba(217,119,6,0.10)',
                icon: 'alert-circle',
            };
        case 'info':
        default:
            return {
                accentColor: '#0284c7',   // sky blue
                iconBg: 'rgba(2,132,199,0.10)',
                icon: 'information-circle',
            };
    }
}

/* ─────────────── styles ─────────────── */

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        elevation: 999,
        paddingHorizontal: 14,
    },

    card: {
        backgroundColor: '#ffffff',
        borderRadius: 14,
        borderLeftWidth: 4,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingRight: 12,
        paddingLeft: 14,
        overflow: 'hidden',

        // iOS shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.10,
        shadowRadius: 14,

        // Android shadow
        elevation: 10,
    },

    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        flexShrink: 0,
    },

    textWrap: {
        flex: 1,
    },

    titleText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 2,
        letterSpacing: 0.1,
    },

    messageText: {
        fontSize: 12,
        fontWeight: '400',
        color: '#6b7280',
        lineHeight: 16,
    },

    messageSolo: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1f2937',
        lineHeight: 18,
    },

    closeBtn: {
        width: 26,
        height: 26,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 6,
        flexShrink: 0,
    },

    progressBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: 3,
        borderBottomLeftRadius: 14,
        opacity: 0.7,
    },
});
