import { AttachIcon, MessageIcon } from '@/assets/icons';
import { createShipment } from '@/features/supplier-panel/dashboard/api/shipments.api';
import { DashboardReviewsSection } from '@/features/supplier-panel/dashboard/components/DashboardReviewsSection';
import { LowStockProductsList } from '@/features/supplier-panel/dashboard/components/LowStockProductsList';
import { PaymentsCard } from '@/features/supplier-panel/dashboard/components/PaymentsCard';
import { PendingOrdersCard } from '@/features/supplier-panel/dashboard/components/PendingOrdersCard';
import { QuotesCard } from '@/features/supplier-panel/dashboard/components/QuotesCard';
import { SalesStatsCard } from '@/features/supplier-panel/dashboard/components/SalesStatsCard';
import { useLowStockProducts } from '@/features/supplier-panel/dashboard/hooks/useLowStockProducts';
import { usePendingOrdersList } from '@/features/supplier-panel/dashboard/hooks/usePendingOrdersList';
import { useOrdersList } from '@/features/supplier-panel/orders/hooks/useOrdersList';
import { productsApi } from '@/services/api/products.api';
import { useToast } from '@/shared/components/Toast';
import { useAppSelector } from '@/store/hooks';
import { supplierTheme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function DashboardScreen() {
    const { supplier, isAuthenticated } = useAppSelector((state) => state.supplierAuth);
    const [activeTab, setActiveTab] = useState<'pending' | 'shipped' | 'issues'>('pending');
    const { data: ordersData, loading: ordersLoading, error: ordersError, refetch } = usePendingOrdersList();
    const { orders: shippedOrders, loading: shippedLoading, error: shippedError, refetch: refetchShipped } = useOrdersList('shipped');
    const lowStockProducts = useLowStockProducts();
    const { showToast } = useToast();
    const insets = useSafeAreaInsets();
    const router = useRouter();

    // State for tracking numbers and photos per order
    const [trackingNumbers, setTrackingNumbers] = useState<Record<number, string>>({});
    const [trackingPhotos, setTrackingPhotos] = useState<Record<number, ImagePicker.ImagePickerAsset>>({});
    const [creatingShipment, setCreatingShipment] = useState<Record<number, boolean>>({});

    // Handle photo picker
    const handlePickPhoto = async (orderId: number) => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                showToast({ message: 'Please grant camera roll permissions to upload photos.', type: 'warning' });
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
                base64: false,
            });

            if (!result.canceled && result.assets[0]) {
                setTrackingPhotos(prev => ({
                    ...prev,
                    [orderId]: result.assets[0]
                }));
                showToast({ message: 'Photo selected successfully', type: 'success' });
            }
        } catch (error) {
            console.error('Error picking photo:', error);
            showToast({ message: 'Failed to pick photo. Please try again.', type: 'error' });
        }
    };

    // Handle shipment creation
    const handleCreateShipment = async (orderId: number) => {
        const trackingNumber = trackingNumbers[orderId];
        const trackingPhoto = trackingPhotos[orderId];

        if (!trackingNumber && !trackingPhoto) {
            showToast({ message: 'Please enter a tracking number or upload a photo.', type: 'warning' });
            return;
        }

        try {
            setCreatingShipment(prev => ({ ...prev, [orderId]: true }));

            const shipmentData: any = {};

            if (trackingNumber) {
                shipmentData.track_number = trackingNumber;
            }

            if (trackingPhoto) {
                shipmentData.tracking_photo = {
                    uri: trackingPhoto.uri,
                    type: (trackingPhoto as any).mimeType || 'image/jpeg',
                    name: trackingPhoto.fileName || `tracking_${orderId}.jpg`,
                };
            }

            const response = await createShipment(orderId, shipmentData);

            if (response.success) {
                showToast({ message: 'Shipment created successfully!', type: 'success' });

                // Clear the inputs for this order
                setTrackingNumbers(prev => {
                    const newState = { ...prev };
                    delete newState[orderId];
                    return newState;
                });
                setTrackingPhotos(prev => {
                    const newState = { ...prev };
                    delete newState[orderId];
                    return newState;
                });

                // Refresh the orders list
                refetch();
                refetchShipped();
            } else {
                showToast({ message: response.message || 'Failed to create shipment', type: 'error' });
            }
        } catch (error: any) {
            console.error('Error creating shipment:', error);
            const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create shipment. Please try again.';
            showToast({ message: errorMessage, type: 'error' });
        } finally {
            setCreatingShipment(prev => ({ ...prev, [orderId]: false }));
        }
    };

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
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => router.push('/(supplier-drawer)/messages')}
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
                <View style={styles.ordersSection}>
                    <Text style={styles.ordersSectionTitle}>My Orders</Text>

                    {/* Tabs */}
                    <View style={styles.orderTabs}>
                        <TouchableOpacity
                            style={[styles.orderTab, activeTab === 'pending' && styles.orderTabActive]}
                            onPress={() => setActiveTab('pending')}
                        >
                            <Text style={[styles.orderTabText, activeTab === 'pending' && styles.orderTabTextActive]}>Pending</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.orderTab, activeTab === 'shipped' && styles.orderTabActive]}
                            onPress={() => setActiveTab('shipped')}
                        >
                            <Text style={[styles.orderTabText, activeTab === 'shipped' && styles.orderTabTextActive]}>Shipped</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.orderTab, activeTab === 'issues' && styles.orderTabActive]}
                            onPress={() => setActiveTab('issues')}
                        >
                            <Text style={[styles.orderTabText, activeTab === 'issues' && styles.orderTabTextActive]}>Issues</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Warning Text - Only show for pending tab */}
                    {activeTab === 'pending' && (
                        <Text style={styles.ordersWarning}>
                            If you don't upload the tracking within the deadline, there may be a penalty (less visibility/extra commission/temporary block).
                        </Text>
                    )}

                    {/* Tab Content */}
                    {activeTab === 'pending' ? (
                        ordersLoading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#00615E" />
                                <Text style={styles.loadingText}>Loading orders...</Text>
                            </View>
                        ) : ordersError ? (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
                                <Text style={styles.errorText}>{ordersError}</Text>
                            </View>
                        ) : ordersData && ordersData.orders.length > 0 ? (
                            <>
                                {/* Orders Scroll Container */}
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    style={styles.ordersScroll}
                                    contentContainerStyle={styles.ordersScrollContent}
                                >
                                    {ordersData.orders.map((order) => (
                                        <View key={order.id} style={styles.orderCard}>
                                            <View style={styles.orderHeader}>
                                                <View style={styles.orderHeaderTop}>
                                                    <Text style={styles.orderNumber}>{order.order_increment_id}</Text>
                                                    <View style={styles.orderTimeBadge}>
                                                        <Ionicons name="time-outline" size={16} color="#FFFFFF" />
                                                        <Text style={styles.orderTimeText}>18h</Text>
                                                    </View>
                                                </View>
                                                <View style={styles.orderMeta}>
                                                    <Text style={styles.orderMetaText}>{order.customer_name}</Text>
                                                    <Text style={styles.orderMetaSeparator}>•</Text>
                                                    <Text style={styles.orderMetaText}>{order.total_items} items</Text>
                                                    <Text style={styles.orderMetaSeparator}>•</Text>
                                                    <Text style={styles.orderMetaText}>{order.formatted_amount}</Text>
                                                </View>
                                            </View>

                                            <View style={styles.orderContent}>
                                                <Text style={styles.orderContentTitle}>Shipping Code / Tracking</Text>
                                                <View style={styles.trackingInputRow}>
                                                    <TextInput
                                                        style={styles.trackingInput}
                                                        placeholder="Paste the code"
                                                        placeholderTextColor="#0A292D"
                                                        value={trackingNumbers[order.id] || ''}
                                                        onChangeText={(text) => setTrackingNumbers(prev => ({ ...prev, [order.id]: text }))}
                                                    />
                                                    <TouchableOpacity
                                                        style={styles.photoButton}
                                                        onPress={() => handlePickPhoto(order.id)}
                                                    >
                                                        <AttachIcon width={16} height={16} color="#0A292D" />
                                                        <Text style={styles.photoButtonText}>Photo</Text>
                                                    </TouchableOpacity>
                                                </View>
                                                {trackingPhotos[order.id] && (
                                                    <Text style={styles.photoSelectedText}>
                                                        ✓ Photo selected
                                                    </Text>
                                                )}
                                                <Text style={styles.orderHelpText}>
                                                    You can also upload a photo of the number if you have it on paper.
                                                </Text>
                                                <View style={styles.orderActions}>
                                                    <TouchableOpacity
                                                        style={[styles.orderActionPrimary, creatingShipment[order.id] && styles.orderActionDisabled]}
                                                        onPress={() => handleCreateShipment(order.id)}
                                                        disabled={creatingShipment[order.id]}
                                                    >
                                                        {creatingShipment[order.id] ? (
                                                            <ActivityIndicator size="small" color="#FFFFFF" />
                                                        ) : (
                                                            <Text style={styles.orderActionPrimaryText}>Save</Text>
                                                        )}
                                                    </TouchableOpacity>
                                                    <TouchableOpacity style={styles.orderActionSecondary}>
                                                        <Ionicons name="print-outline" size={16} color="#0A292D" />
                                                        <Text style={styles.orderActionSecondaryText}>Print</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={styles.orderActionOutline}
                                                        onPress={() => router.push(`/(supplier-drawer)/order-details?orderId=${order.id}&source=dashboard`)}
                                                    >
                                                        <Text style={styles.orderActionOutlineText}>Details</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </View>
                                    ))}
                                </ScrollView>
                            </>
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="checkmark-circle-outline" size={48} color="#00615E" />
                                <Text style={styles.emptyText}>No pending orders</Text>
                            </View>
                        )
                    ) : activeTab === 'shipped' ? (
                        shippedLoading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#00615E" />
                                <Text style={styles.loadingText}>Loading shipped orders...</Text>
                            </View>
                        ) : shippedError ? (
                            <View style={styles.errorContainer}>
                                <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
                                <Text style={styles.errorText}>{shippedError}</Text>
                            </View>
                        ) : shippedOrders && shippedOrders.length > 0 ? (
                            <>
                                {/* Shipped Orders Scroll Container */}
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    style={styles.ordersScroll}
                                    contentContainerStyle={styles.ordersScrollContent}
                                >
                                    {shippedOrders.slice(0, 5).map((order) => (
                                        <View key={order.id} style={styles.shippedOrderCard}>
                                            <View style={styles.orderHeader}>
                                                <View style={styles.orderHeaderTop}>
                                                    <Text style={styles.orderNumber}>{order.increment_id || order.order_id}</Text>
                                                    <View style={styles.shippedBadge}>
                                                        <Ionicons name="checkmark-circle" size={16} color="#00AA00" />
                                                        <Text style={styles.shippedBadgeText}>{order.status_label}</Text>
                                                    </View>
                                                </View>
                                                <View style={styles.orderMeta}>
                                                    <Text style={styles.orderMetaText}>
                                                        {order.customer_first_name && order.customer_last_name
                                                            ? `${order.customer_first_name} ${order.customer_last_name}`
                                                            : order.customer_email || 'Unknown'}
                                                    </Text>
                                                    <Text style={styles.orderMetaSeparator}>•</Text>
                                                    <Text style={styles.orderMetaText}>{order.total_items} items</Text>
                                                    <Text style={styles.orderMetaSeparator}>•</Text>
                                                    <Text style={styles.orderMetaText}>
                                                        ${order.grand_total.toFixed(2)}
                                                    </Text>
                                                </View>
                                            </View>

                                            <View style={styles.shippedOrderContent}>
                                                {order.shipments_count > 0 && (
                                                    <View style={styles.shipmentInfo}>
                                                        <Ionicons name="cube-outline" size={16} color="#00615E" />
                                                        <Text style={styles.shipmentInfoText}>
                                                            {order.shipments_count} {order.shipments_count === 1 ? 'shipment' : 'shipments'}
                                                        </Text>
                                                    </View>
                                                )}
                                                <TouchableOpacity
                                                    style={styles.shippedOrderDetailsButton}
                                                    onPress={() => router.push(`/(supplier-drawer)/order-details?orderId=${order.id}&source=dashboard`)}
                                                >
                                                    <Text style={styles.shippedOrderDetailsText}>Details</Text>
                                                    <Ionicons name="chevron-forward" size={16} color="#0A292D" />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))}
                                </ScrollView>
                            </>
                        ) : (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="checkmark-circle-outline" size={48} color="#00615E" />
                                <Text style={styles.emptyText}>No shipped orders</Text>
                            </View>
                        )
                    ) : (
                        <View style={styles.comingSoonContainer}>
                            <Ionicons name="time-outline" size={48} color="#666666" />
                            <Text style={styles.comingSoonText}>Coming Soon</Text>
                            <Text style={styles.comingSoonSubtext}>
                                Orders with issues will be available soon
                            </Text>
                        </View>
                    )}
                </View>

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
        lineHeight: 16,
        color: '#000000',
    },
    descriptionText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 14,
        lineHeight: 17,
        color: '#666666',
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
        lineHeight: 19,
        color: '#000000',
    },
    infoDescription: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 14,
        lineHeight: 20,
        color: '#666666',
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
    ordersSection: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingVertical: 16,
        paddingHorizontal: 8,
        gap: 16,
        width: '100%',
        backgroundColor: '#FCF7EA',
        borderRadius: 16,
        marginBottom: supplierTheme.spacing.md,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
    },
    ordersSectionTitle: {
        fontFamily: 'Inter',
        fontWeight: '700',
        fontSize: 24,
        lineHeight: 24,
        color: '#000000',
        alignSelf: 'stretch',
    },
    orderTabs: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 4,
        alignSelf: 'stretch',
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
    },
    orderTab: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 0,
        flex: 1,
        height: 34,
        borderRadius: 4,
    },
    orderTabActive: {
        backgroundColor: '#00615E',
        borderWidth: 1,
        borderColor: '#00615E',
    },
    orderTabText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 14,
        lineHeight: 18,
        color: '#000000',
    },
    orderTabTextActive: {
        color: '#FFFFFF',
    },
    ordersWarning: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 14,
        lineHeight: 20,
        color: '#0A292D',
        alignSelf: 'stretch',
    },
    ordersScroll: {
        alignSelf: 'stretch',
    },
    ordersScrollContent: {
        gap: 8,
    },
    orderCard: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        paddingVertical: 16,
        paddingHorizontal: 8,
        gap: 16,
        width: 310,
        backgroundColor: '#FCF7EA',
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 16,
    },
    orderHeader: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        gap: 8,
        alignSelf: 'stretch',
    },
    orderHeaderTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 0,
        gap: 8,
        alignSelf: 'stretch',
    },
    orderNumber: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 20,
        lineHeight: 24,
        color: '#000000',
    },
    orderTimeBadge: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 4,
        paddingHorizontal: 8,
        gap: 4,
        backgroundColor: '#BD5626',
        borderRadius: 40,
    },
    orderTimeText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 12,
        lineHeight: 17,
        color: '#FFFFFF',
    },
    orderMeta: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 0,
        gap: 8,
    },
    orderMetaText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 13,
        lineHeight: 18,
        color: '#0A292D',
    },
    orderMetaSeparator: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 13,
        lineHeight: 18,
        color: '#0A292D',
    },
    orderContent: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        gap: 16,
        alignSelf: 'stretch',
    },
    orderContentTitle: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
        alignSelf: 'stretch',
    },
    trackingInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 0,
        gap: 8,
        alignSelf: 'stretch',
    },
    trackingInput: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 0,
        gap: 8,
        flex: 1,
        height: 40,
        backgroundColor: '#F3F0E7',
        borderWidth: 1,
        borderColor: '#F3F0E7',
        borderRadius: 8,
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 14,
        lineHeight: 18,
        color: '#0A292D',
    },
    photoSelectedText: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 12,
        lineHeight: 17,
        color: '#00615E',
        marginTop: 4,
    },
    photoButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8,
        paddingHorizontal: 8,
        gap: 4,
        height: 40,
        backgroundColor: '#F3F0E7',
        borderWidth: 1,
        borderColor: '#F3F0E7',
        borderRadius: 8,
    },
    photoButtonText: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 14,
        lineHeight: 17,
        color: '#0A292D',
    },
    orderHelpText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 12,
        lineHeight: 17,
        color: '#0A292D',
        alignSelf: 'stretch',
    },
    orderActions: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 0,
        gap: 8,
        alignSelf: 'stretch',
    },
    orderActionPrimary: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        gap: 8,
        flex: 1,
        height: 40,
        backgroundColor: '#00615E',
        borderRadius: 8,
    },
    orderActionDisabled: {
        opacity: 0.6,
    },
    orderActionPrimaryText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 16,
        color: '#F5F5F5',
    },
    orderActionSecondary: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        gap: 8,
        flex: 1,
        height: 40,
        backgroundColor: '#EAECE1',
        borderWidth: 1,
        borderColor: '#EAECE1',
        borderRadius: 8,
    },
    orderActionSecondaryText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 16,
        color: '#0A292D',
    },
    orderActionOutline: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        gap: 8,
        flex: 1,
        height: 40,
        backgroundColor: '#EAECE1',
        borderWidth: 1,
        borderColor: '#EAECE1',
        borderRadius: 8,
    },
    orderActionOutlineText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 16,
        color: '#0A292D',
    },
    loadingContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'stretch',
        minHeight: 160,
        padding: 40,
        gap: 12,
    },
    loadingText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 14,
        color: '#666666',
    },
    errorContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'stretch',
        minHeight: 200,
        padding: 40,
        gap: 12,
    },
    emptyContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'stretch',
        width: '100%',
        minHeight: 200,
        padding: 40,
        gap: 12,
    },
    emptyText: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 16,
        color: '#00615E',
        textAlign: 'center',
        alignSelf: 'center',
    },
    comingSoonContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'stretch',
        width: '100%',
        minHeight: 200,
        padding: 40,
        gap: 12,
    },
    comingSoonText: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 18,
        color: '#000000',
        textAlign: 'center',
        alignSelf: 'center',
    },
    comingSoonSubtext: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 14,
        color: '#666666',
        textAlign: 'center',
        alignSelf: 'center',
    },
    errorText: {
        fontSize: supplierTheme.typography.fontSize.base,
        color: supplierTheme.colors.error.main,
    },
    // Shipped Order Card Styles
    shippedOrderCard: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 16,
        gap: 12,
        width: 280,
        minHeight: 200,
        backgroundColor: '#FCF7EA',
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 12,
        marginRight: 12,
    },
    shippedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#E0FFE0',
        borderRadius: 4,
    },
    shippedBadgeText: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 12,
        color: '#00AA00',
    },
    shippedOrderContent: {
        flexDirection: 'column',
        gap: 12,
        alignSelf: 'stretch',
        flex: 1,
        justifyContent: 'flex-end',
    },
    shipmentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#E0FFFE',
        borderRadius: 6,
    },
    shipmentInfoText: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 13,
        color: '#00615E',
    },
    shippedOrderDetailsButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#EAECE1',
        borderWidth: 1,
        borderColor: '#EAECE1',
        borderRadius: 8,
    },
    shippedOrderDetailsText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 16,
        color: '#0A292D',
    },
});
