import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { theme } from '@/theme';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchCartThunk } from '@/store/slices/cartSlice';
import { fetchUnreadCountThunk } from '@/store/slices/notificationSlice';
import { APP_NAME } from '@/config/constants';
interface ShopHeaderProps {
    title?: string;
    showSearch?: boolean;
}

export const ShopHeader: React.FC<ShopHeaderProps> = ({ title, showSearch = true }) => {
    const navigation = useNavigation();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { isAuthenticated } = useAppSelector((state) => state.auth);
    const { cart } = useAppSelector((state) => state.cart);
    const { items: wishlistItems } = useAppSelector((state) => state.wishlist);
    const { totalUnread } = useAppSelector((state) => state.notifications);

    // Fetch cart on mount (works for both authenticated and guest users)
    // useEffect(() => {
    //     dispatch(fetchCartThunk());
    // }, [dispatch]);

    // Refetch when authentication changes
    useEffect(() => {
        // if (isAuthenticated) {
        dispatch(fetchCartThunk());
        // }

        // Fetch notification count for authenticated users
        if (isAuthenticated) {
            dispatch(fetchUnreadCountThunk());
        }
    }, [isAuthenticated, dispatch]);

    const cartItemsCount = cart?.items_count || 0;
    const wishlistItemsCount = wishlistItems?.length || 0;

    const openDrawer = () => {
        navigation.dispatch(DrawerActions.openDrawer());
    };

    const handleProfilePress = () => {
        if (isAuthenticated) {
            // Navigate to profile or open drawer
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

    const handleCartPress = () => {
        router.push('/cart');
    };

    return (
        <View style={styles.container}>
            <View style={styles.topRow}>
                <TouchableOpacity onPress={openDrawer} style={styles.iconButton}>
                    <Ionicons name="menu-outline" size={28} color={theme.colors.text.primary} />
                </TouchableOpacity>

                <Text style={styles.logo}>{APP_NAME}</Text>

                <View style={styles.rightActions}>
                    {showSearch && (
                        <TouchableOpacity style={styles.iconButton} onPress={handleSearchPress}>
                            <Ionicons name="search-outline" size={28} color={theme.colors.text.primary} />
                        </TouchableOpacity>
                    )}

                    {/* Show Wishlist icon if logged in, otherwise show Profile icon */}
                    {isAuthenticated ? (
                        <TouchableOpacity style={styles.iconButton} onPress={handleWishlistPress}>
                            <View>
                                <Ionicons
                                    name="heart-outline"
                                    size={28}
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

                    {/* Notification Bell (only for authenticated users) */}
                    {isAuthenticated && (
                        <TouchableOpacity style={styles.iconButton} onPress={handleNotificationsPress}>
                            <View>
                                <Ionicons name="notifications-outline" size={28} color={theme.colors.text.primary} />
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

                    <TouchableOpacity style={styles.iconButton} onPress={handleCartPress}>
                        <View>
                            <Ionicons name="cart-outline" size={28} color={theme.colors.text.primary} />
                            {cartItemsCount > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>
                                        {cartItemsCount > 99 ? '99+' : cartItemsCount}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.white,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
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
    },
    rightActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        padding: theme.spacing.xs,
        marginLeft: theme.spacing.xs,
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: theme.colors.error.main,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    badgeText: {
        color: theme.colors.white,
        fontSize: 10,
        fontWeight: theme.typography.fontWeight.bold,
    },
});

export default ShopHeader;
