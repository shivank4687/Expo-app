import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    TouchableOpacity,
    PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useToast, ToastType } from './ToastContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOAST_HEIGHT = 80;
const SWIPE_THRESHOLD = -50;

/**
 * ToastContainer Component
 * Displays animated toast notifications that slide from top
 * Supports swipe-up to dismiss gesture
 */
export const ToastContainer: React.FC = () => {
    const { toast, hideToast } = useToast();
    const insets = useSafeAreaInsets();
    const translateY = useRef(new Animated.Value(-TOAST_HEIGHT - 100)).current;
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (toast.visible && toast.message) {
            showToastAnimation();
            
            // Auto hide after duration
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => {
                hideToastAnimation();
            }, toast.duration || 3000);
        } else {
            hideToastAnimation();
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [toast.id, toast.visible]);

    const showToastAnimation = () => {
        Animated.spring(translateY, {
            toValue: insets.top,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
        }).start();
    };

    const hideToastAnimation = () => {
        Animated.timing(translateY, {
            toValue: -TOAST_HEIGHT - 100,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            hideToast();
        });
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dy) > 5;
            },
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy < 0) {
                    translateY.setValue(insets.top + gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy < SWIPE_THRESHOLD) {
                    hideToastAnimation();
                } else {
                    showToastAnimation();
                }
            },
        })
    ).current;

    if (!toast.visible || !toast.message) return null;

    const { bgColor, iconColor, icon } = getToastStyle(toast.type || 'info');

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ translateY }],
                    backgroundColor: bgColor,
                },
            ]}
            {...panResponder.panHandlers}
        >
            <View style={styles.content}>
                <View style={[styles.iconContainer, { backgroundColor: iconColor }]}>
                    <Ionicons name={icon} size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.message} numberOfLines={2}>
                    {toast.message}
                </Text>
                <TouchableOpacity
                    onPress={hideToastAnimation}
                    style={styles.closeButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="close" size={20} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

function getToastStyle(type: ToastType): {
    bgColor: string;
    iconColor: string;
    icon: keyof typeof Ionicons.glyphMap;
} {
    switch (type) {
        case 'success':
            return {
                bgColor: '#10B981',
                iconColor: '#059669',
                icon: 'checkmark-circle',
            };
        case 'error':
            return {
                bgColor: '#EF4444',
                iconColor: '#DC2626',
                icon: 'close-circle',
            };
        case 'warning':
            return {
                bgColor: '#F59E0B',
                iconColor: '#D97706',
                icon: 'warning',
            };
        case 'info':
        default:
            return {
                bgColor: '#3B82F6',
                iconColor: '#2563EB',
                icon: 'information-circle',
            };
    }
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        minHeight: TOAST_HEIGHT,
        width: SCREEN_WIDTH,
        zIndex: 9999,
        elevation: 999,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        paddingTop: 20,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    message: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
        lineHeight: 20,
    },
    closeButton: {
        padding: 4,
        marginLeft: 8,
    },
});

