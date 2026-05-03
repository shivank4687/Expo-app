import { MessageIcon, NotificationIcon } from '@/assets/icons';
import { DashboardReviewsSection } from '@/features/supplier-panel/dashboard/components/DashboardReviewsSection';
import { LowStockProductsList } from '@/features/supplier-panel/dashboard/components/LowStockProductsList';
import { MyOrdersSection } from '@/features/supplier-panel/dashboard/components/MyOrdersSection';
import { PaymentsCard } from '@/features/supplier-panel/dashboard/components/PaymentsCard';
import { PendingOrdersCard } from '@/features/supplier-panel/dashboard/components/PendingOrdersCard';
import { QuotesCard } from '@/features/supplier-panel/dashboard/components/QuotesCard';
import { SalesStatsCard } from '@/features/supplier-panel/dashboard/components/SalesStatsCard';
import { useLowStockProducts } from '@/features/supplier-panel/dashboard/hooks/useLowStockProducts';
import { notificationsApi } from '@/features/supplier-panel/notifications/api/notifications.api';
import { productsApi } from '@/services/api/products.api';
import { useToast } from '@/shared/components/Toast';
import { useSupplierSocket } from '@/features/supplier-panel/notifications/hooks/useSupplierSocket';
import { useAppSelector } from '@/store/hooks';
import { supplierTheme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect, useSegments } from 'expo-router';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function DashboardScreen() {
    const { supplier, isAuthenticated } = useAppSelector((state) => state.supplierAuth);
    const lowStockProducts = useLowStockProducts();
    const { showToast } = useToast();
    const insets = useSafeAreaInsets();
    const router = useRouter();

    // Setup real-time notifications
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoadingCount, setIsLoadingCount] = useState(false);
    // Track whether the user navigated to the Notifications screen so we can
    // reset the badge locally on return (without a network call).
    const wasOnNotificationsRef = useRef(false);

    useSupplierSocket({
        onNewNotification: () => {
            // Increment badge in real-time — no API call needed
            setUnreadCount(prev => prev + 1);
        },
    });

    // Fetch the true unread count ONCE on mount
    useEffect(() => {
        if (!isAuthenticated) return;
        setIsLoadingCount(true);
        notificationsApi.getNotifications(1)
            .then(res => setUnreadCount(res.unread_counts.total))
            .catch(err => console.error('Failed to fetch notification count', err))
            .finally(() => setIsLoadingCount(false));
    }, [isAuthenticated]);

    // Track when the user leaves for / returns from Notifications
    const segments = useSegments();
    useEffect(() => {
        const onNotificationsScreen = segments.some(s => s === 'notifications');
        if (onNotificationsScreen) {
            wasOnNotificationsRef.current = true;
        }
    }, [segments]);

    // On focus: if coming back from Notifications, just zero the badge — no API hit.
    useFocusEffect(
        useCallback(() => {
            if (wasOnNotificationsRef.current) {
                setUnreadCount(0);
                wasOnNotificationsRef.current = false;
            }
        }, [])
    );

    // Handle product save
    const handleProductSave = async (productId: number, price: number, stock: number) => {
        try {
            const result = await lowStockProducts.quickUpdateProduct(productId, { price, stock });
            if (result.success) {
                showToast({ message: 'Product updated successfully!', type: 'success' });
                return true;
            } else {
                throw result.error;
            }
        } catch (error) {
            console.error('Error updating product:', error);
            showToast({ message: 'Failed to update product. Please try again.', type: 'error' });
            return false;
        }
    };

    const handleToggleProductStatus = async (productId: number, currentStatus: 'active' | 'inactive') => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        try {
            const result = await lowStockProducts.quickUpdateProduct(productId, { status: newStatus });
            if (result.success) {
                showToast({
                    type: 'success',
                    message: `Product ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
                    duration: 3000,
                });
                return true;
            } else {
                throw result.error;
            }
        } catch (error) {
            console.error('Error updating product status:', error);
            showToast({
                type: 'error',
                message: 'Failed to update product status',
                duration: 3000,
            });
            return false;
        }
    };

    // Handle product edit
    const handleProductEdit = (productId: number) => {
        router.push({
            pathname: '/(supplier-drawer)/edit-product',
            params: { id: productId.toString(), source: 'dashboard' },
        });
    };

    const handleDuplicateProduct = async (productId: number) => {
        try {
            showToast({
                type: 'info',
                message: 'Duplicating product...',
                duration: 2000,
            });

            const result = await productsApi.duplicateSupplierProduct(productId);

            showToast({
                type: 'success',
                message: 'Product duplicated successfully',
                duration: 3000,
            });

            router.push({
                pathname: '/(supplier-drawer)/edit-product',
                params: {
                    id: String(result.marketplace_product_id),
                    source: 'dashboard',
                },
            });
        } catch (error: any) {
            console.error('Error duplicating product:', error);

            const errorMessage =
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                'Failed to duplicate product';

            showToast({
                type: 'error',
                message: errorMessage,
                duration: 4000,
            });
        }
    };

    // Handle edit variants
    const handleEditVariants = (productId: number) => {
        console.log('Edit variants:', productId);
        // Navigate to variants edit screen
    };

    // Handle see all products
    const handleSeeAllProducts = () => {
        router.push('/(supplier-drawer)/(supplier-tabs)/products');
    };

    const handleSeeAllReviews = () => {
        router.push('/(supplier-drawer)/(supplier-tabs)/reviews');
    };

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
            <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + (Platform.OS === 'android' ? 16 : 0) }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.profileContent}>
                        {/* Avatar */}
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {supplier.name.charAt(0).toUpperCase()}
                            </Text>
                        </View>

                        {/* Profile Info */}
                        <View style={styles.profileInfo}>
                            <Text style={styles.greetingText}>Hey {supplier.name}!</Text>
                            <Text style={styles.descriptionText}>
                                Your dashboard. Sales. Orders. Payments
                            </Text>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                        <View style={styles.notificationWrapper}>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => router.push('/(supplier-drawer)/notifications' as any)}
                            >
                                <NotificationIcon width={16} height={16} color={isLoadingCount ? '#AAAAAA' : '#000000'} />
                                {isLoadingCount && (
                                    <ActivityIndicator
                                        size={12}
                                        color="#00615E"
                                        style={styles.iconOverlayLoader}
                                    />
                                )}
                            </TouchableOpacity>
                            {!isLoadingCount && unreadCount > 0 && (
                                <View style={styles.notificationBadge}>
                                    <Text style={styles.notificationBadgeText}>
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => router.push('/(supplier-drawer)/messages' as any)}
                        >
                            <MessageIcon width={16} height={16} color="#000000" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Info Card */}
                <View style={styles.infoCardContainer}>
                    <View style={styles.infoImagePlaceholder}>
                        <Ionicons name="image-outline" size={40} color="#999999" />
                    </View>
                    <View style={styles.infoTextContent}>
                        <Text style={styles.infoTitle}>
                            Today: The important stuff in 10 seconds
                        </Text>
                        <Text style={styles.infoDescription}>
                            Prioritize: pending orders and upload tracking on time to avoid penalties. Your payments are released automatically after delivery.
                        </Text>
                    </View>
                </View>

                {/* Metrics Grid */}
                <View style={styles.metricsGrid}>
                    <SalesStatsCard />
                    <PendingOrdersCard />
                    <PaymentsCard />
                    <QuotesCard />
                </View>

                {/* My Orders Section */}
                <MyOrdersSection />

                {/* My Products Section - Low Stock Products */}
                <LowStockProductsList
                    onProductSave={handleProductSave}
                    onProductEdit={handleProductEdit}
                    onEditVariants={handleEditVariants}
                    onToggleStatus={handleToggleProductStatus}
                    onDuplicate={handleDuplicateProduct}
                    onSeeAll={handleSeeAllProducts}
                    productsData={lowStockProducts}
                />

                <DashboardReviewsSection onSeeAll={handleSeeAllReviews} />
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
        paddingVertical: supplierTheme.spacing.lg,
        paddingHorizontal: 12,
        paddingTop: 80,
    },
    profileCard: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'flex-start',
        padding: 8,
        gap: 12,
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: supplierTheme.spacing.md,
    },
    profileContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 0,
        gap: 8,
        flex: 1,
    },
    avatar: {
        width: 48,
        height: 48,
        backgroundColor: supplierTheme.colors.primary[500],
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 20,
        color: '#F5F5F5',
        includeFontPadding: false,
    },
    profileInfo: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        gap: 4,
        flex: 1,
    },
    greetingText: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 16,
        color: '#000000',
        includeFontPadding: false,
    },
    descriptionText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 14,
        color: '#666666',
        includeFontPadding: false,
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 0,
        gap: 4,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        backgroundColor: '#E0FFFE',
        borderWidth: 1,
        borderColor: '#00615E',
        borderRadius: 8,
    },
    notificationWrapper: {
        position: 'relative',
    },
    notificationBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        minWidth: 16,
        height: 16,
        backgroundColor: '#E53935',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 3,
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
    },
    iconOverlayLoader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    notificationBadgeText: {
        fontFamily: 'Inter',
        fontWeight: '700',
        fontSize: 9,
        color: '#FFFFFF',
        includeFontPadding: false,
    },
    infoCardContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 16,
        width: '100%',
        backgroundColor: '#FCF7EA',
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 16,
        marginBottom: supplierTheme.spacing.md,
        shadowColor: '#000000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 6,
    },
    infoImagePlaceholder: {
        width: 104,
        backgroundColor: '#F3F0E7',
        borderRadius: 8,
        alignSelf: 'stretch',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoTextContent: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        gap: 8,
        width: 209,
    },
    infoTitle: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 16,
        color: '#000000',
        includeFontPadding: false,
    },
    infoDescription: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 14,
        color: '#666666',
        includeFontPadding: false,
    },
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        alignContent: 'flex-start',
        padding: 0,
        gap: 9,
        width: '100%',
        marginBottom: supplierTheme.spacing.md,
    },
    errorText: {
        fontSize: supplierTheme.typography.fontSize.base,
        color: supplierTheme.colors.error.main,
    },
});
