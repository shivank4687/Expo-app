import { APP_NAME } from '@/config/constants';
import socketService from '@/services/socket.service';
import { useToast } from '@/shared/components/Toast';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCartThunk } from '@/store/slices/cartSlice';
import { fetchUnreadCountThunk } from '@/store/slices/notificationSlice';
import { theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ShopHeaderProps {
    title?: string;
    showSearch?: boolean;
}

export const ShopHeader: React.FC<ShopHeaderProps> = ({ title, showSearch = true }) => {
    const navigation = useNavigation();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { showToast } = useToast();
    const { isAuthenticated, user } = useAppSelector((state) => state.auth);
    const { cart } = useAppSelector((state) => state.cart);
    const { items: wishlistItems } = useAppSelector((state) => state.wishlist);
    const { totalUnread } = useAppSelector((state) => state.notifications);
    const { categories } = useAppSelector((state) => state.category);

    // Animation state for rotating placeholder
    const [placeholderIndex, setPlaceholderIndex] = React.useState(0);
    const fadeAnim = React.useRef(new Animated.Value(1)).current;
    const translateYAnim = React.useRef(new Animated.Value(0)).current;

    const defaultPlaceholders = ['Electronics', 'Fashion', 'Home', 'Beauty', 'Groceries', 'Accessories'];
    const placeholders = categories && categories.length > 0 
        ? categories.slice(0, 10).map(c => c.name) 
        : defaultPlaceholders;

    useEffect(() => {
        if (!showSearch || placeholders.length <= 1) return;

        const interval = setInterval(() => {
            // Animate out: slide up and fade out
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(translateYAnim, {
                    toValue: -15,
                    duration: 400,
                    useNativeDriver: true,
                })
            ]).start(() => {
                // Change text and reset position (start from below)
                setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
                translateYAnim.setValue(15);
                
                // Animate in: slide to center and fade in
                Animated.parallel([
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                    Animated.timing(translateYAnim, {
                        toValue: 0,
                        duration: 400,
                        useNativeDriver: true,
                    })
                ]).start();
            });
        }, 3500);

        return () => clearInterval(interval);
    }, [placeholders.length, fadeAnim, translateYAnim, showSearch]);

    // Refetch when authentication changes
    useEffect(() => {
        dispatch(fetchCartThunk());

        // Fetch notification count for authenticated users
        if (isAuthenticated) {
            dispatch(fetchUnreadCountThunk());
        }
    }, [isAuthenticated, dispatch]);

    // Listen for real-time notification updates
    useEffect(() => {
        if (isAuthenticated && user?.id) {
            const token = `customer_${user.id}`;
            socketService.connect(token, 'customer');
            socketService.subscribeToNotifications();

            const handleNotification = (data: any) => {
                console.log('[ShopHeader] New notification received, refreshing count', data);
                dispatch(fetchUnreadCountThunk());

                if (data) {
                    showToast({
                        message: data.message || 'New notification received',
                        type: 'info',
                        title: data.title || 'Notification',
                    });
                }
            };

            socketService.onNewNotification(handleNotification);

            return () => {
                socketService.offNewNotification(handleNotification);
            };
        }
    }, [isAuthenticated, user?.id, dispatch]);

    const wishlistItemsCount = wishlistItems?.length || 0;

    const openDrawer = () => {
        navigation.dispatch(DrawerActions.openDrawer());
    };

    const handleProfilePress = () => {
        if (isAuthenticated) {
            navigation.dispatch(DrawerActions.openDrawer());
        } else {
            router.push('/login');
        }
    };

    const handleWishlistPress = () => {
        router.push('/wishlist');
    };

    const handleNotificationsPress = () => {
        router.push('/notifications' as any);
    };

    const handleSearchPress = () => {
        router.push('/search');
    };

    return (
        <View style={styles.container}>
            <View style={styles.topRow}>
                <TouchableOpacity onPress={openDrawer} style={styles.iconButton}>
                    <Ionicons name="menu-outline" size={28} color={theme.colors.text.primary} />
                </TouchableOpacity>

                {showSearch ? (
                    <TouchableOpacity 
                        style={styles.searchBar} 
                        onPress={handleSearchPress}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="search-outline" size={20} color={theme.colors.text.secondary} style={styles.searchIcon} />
                        <View style={styles.placeholderContainer}>
                            <Text style={styles.searchTextFixed}>Search </Text>
                            <Animated.View style={[
                                styles.animatedPlaceholder,
                                {
                                    opacity: fadeAnim,
                                    transform: [{ translateY: translateYAnim }]
                                }
                            ]}>
                                <Text style={styles.placeholderText} numberOfLines={1}>
                                    {placeholders[placeholderIndex]}
                                </Text>
                            </Animated.View>
                        </View>
                    </TouchableOpacity>
                ) : (
                    <Text style={styles.logo}>{title || APP_NAME}</Text>
                )}

                <View style={styles.rightActions}>
                    {/* Wishlist/Profile icon */}
                    {isAuthenticated ? (
                        <TouchableOpacity style={styles.iconButton} onPress={handleWishlistPress}>
                            <View>
                                <Ionicons
                                    name="heart-outline"
                                    size={26}
                                    color={theme.colors.error.main}
                                />
                                {wishlistItemsCount > 0 && (
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>
                                            {wishlistItemsCount > 99 ? '99+' : wishlistItemsCount}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.iconButton} onPress={handleProfilePress}>
                            <Ionicons
                                name="person-circle-outline"
                                size={28}
                                color={theme.colors.text.primary}
                            />
                        </TouchableOpacity>
                    )}

                    {/* Notification Bell */}
                    {isAuthenticated && (
                        <TouchableOpacity style={styles.iconButton} onPress={handleNotificationsPress}>
                            <View>
                                <Ionicons name="notifications-outline" size={26} color={theme.colors.text.primary} />
                                {totalUnread > 0 && (
                                    <View style={styles.badge}>
                                        <Text style={styles.badgeText}>
                                            {totalUnread > 99 ? '99+' : totalUnread}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.background.default,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: theme.spacing.sm,
        paddingHorizontal: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200],
        ...theme.shadows.sm,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logo: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.primary[500],
        flex: 1,
        textAlign: 'center',
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.full,
        paddingHorizontal: theme.spacing.sm,
        height: 42,
        marginHorizontal: theme.spacing.xs,
        ...theme.shadows.sm,
        borderWidth: 1,
        borderColor: theme.colors.gray[100],
    },
    searchIcon: {
        marginRight: theme.spacing.xxs,
    },
    placeholderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
        flex: 1,
    },
    searchTextFixed: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
    },
    animatedPlaceholder: {
        flex: 1,
        justifyContent: 'center',
    },
    placeholderText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.primary[500],
        fontWeight: theme.typography.fontWeight.medium,
    },
    rightActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        padding: theme.spacing.xs,
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: theme.colors.error.main,
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: theme.colors.white,
        fontSize: 9,
        fontWeight: theme.typography.fontWeight.bold,
    },
});

export default ShopHeader;
