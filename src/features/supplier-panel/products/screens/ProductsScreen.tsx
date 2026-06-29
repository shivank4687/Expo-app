import { GridIcon, ListIcon } from '@/assets/icons';
import { ProductCard, ProductListCard } from '@/features/supplier-panel/components';
import { useProductsList } from '@/features/supplier-panel/products/hooks/useProductsList';
import type { Product } from '@/features/supplier-panel/products/types/products.types';
import { COLORS } from '@/features/supplier-panel/styles';
import { productsApi } from '@/services/api/products.api';
import { useToast } from '@/shared/components/Toast';
import { useAppSelector } from '@/store/hooks';
import { theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useRef, useState, useCallback } from 'react';
import { ActivityIndicator, FlatList, Platform, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ViewMode = 'list' | 'grid';

export function ProductsScreen() {
    const { supplier, isAuthenticated } = useAppSelector((state) => state.supplierAuth);
    const [viewMode, setViewMode] = useState<ViewMode>('grid'); // Default to grid
    const [duplicatingProductId, setDuplicatingProductId] = useState<number | null>(null);
    const router = useRouter();
    const isFirstFocus = useRef(true);
    const insets = useSafeAreaInsets();
    const { showToast } = useToast();
    const { products: offlineProducts } = useAppSelector((state) => state.offlineProducts);
    const offlinePendingCount = offlineProducts.filter(
        (p) => p.syncStatus === 'pending' || p.syncStatus === 'error' || p.syncStatus === 'syncing'
    ).length;

    // Fetch products from API with infinite scroll
    const { products, loading, isLoadingMore, isRefreshing, error, hasMore, loadMore, refresh, reloadWithLoading, quickUpdateProduct, refreshKey } = useProductsList();

    // Reload products when screen comes into focus (after adding/editing products)
    // Skip the first focus to avoid double-loading on initial mount
    // Use reloadWithLoading to show full loading state like first time
    useFocusEffect(
        React.useCallback(() => {
            if (isFirstFocus.current) {
                isFirstFocus.current = false;
                return;
            }
            reloadWithLoading();
        }, [reloadWithLoading])
    );

    // Handle product status toggle
    const handleToggleStatus = useCallback(async (productId: number, currentStatus: 'active' | 'inactive') => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        const result = await quickUpdateProduct(productId, { status: newStatus });

        if (result.success) {
            showToast({
                type: 'success',
                message: `Product ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
                duration: 3000,
            });
        } else {
            showToast({
                type: 'error',
                message: 'Failed to update product status',
                duration: 3000,
            });
        }
    }, [quickUpdateProduct, showToast]);

    // Handle product duplication
    const handleDuplicate = useCallback(async (productId: number) => {
        try {
            setDuplicatingProductId(productId);
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

            // Navigate to edit screen with the new product
            router.push(`/(supplier-drawer)/edit-product?id=${result.marketplace_product_id}`);
        } catch (error: any) {
            console.error('Error duplicating product:', error);

            // Extract error message from various possible locations
            let errorMessage = 'Failed to duplicate product';

            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.message) {
                errorMessage = error.message;
            }

            showToast({
                type: 'error',
                message: errorMessage,
                duration: 4000,
            });
        } finally {
            setDuplicatingProductId(null);
        }
    }, [router, showToast]);

    // Handle quick updates (price and stock) from ProductCard
    const handleQuickUpdate = useCallback(async (id: number, price: string, stock: number) => {
        const result = await quickUpdateProduct(id, {
            price: parseFloat(price),
            stock: stock,
        });

        if (result.success) {
            showToast({
                type: 'success',
                message: 'Product updated successfully',
                duration: 3000,
            });
        } else {
            showToast({
                type: 'error',
                message: 'Failed to update product',
                duration: 3000,
            });
        }
    }, [quickUpdateProduct, showToast]);

    const formatPriceDisplay = (value: number | string) => {
        if (value === null || value === undefined || value === '') {
            return '$0';
        }

        const numericValue = typeof value === 'number'
            ? value
            : parseFloat(String(value).replace(/[^0-9.]/g, ''));

        if (Number.isNaN(numericValue)) {
            return '$0';
        }

        const normalized = numericValue.toString();

        return `$${normalized}`;
    };

    const renderProductItem = useCallback(({ item }: { item: Product }) => {
        if (viewMode === 'grid') {
            return (
                <View style={styles.productItem}>
                    <ProductCard
                        key={`${item.id}-${refreshKey}`}
                        id={item.id}
                        name={item.name}
                        price={formatPriceDisplay(item.price)}
                        status={item.status}
                        stock={item.stock}
                        imageUrl={item.image_url}
                        type={item.type}
                        onEdit={() => router.push(`/(supplier-drawer)/edit-product?id=${item.id}`)}
                        onToggleStatus={handleToggleStatus}
                        onSave={handleQuickUpdate}
                        onDuplicate={handleDuplicate}
                    />
                </View>
            );
        } else {
            return (
                <ProductListCard
                    id={item.id}
                    name={item.name}
                    price={formatPriceDisplay(item.price)}
                    status={item.status}
                    stock={item.stock}
                    imageUrl={item.image_url}
                    type={item.type}
                    onEdit={() => router.push(`/(supplier-drawer)/edit-product?id=${item.id}`)}
                    onToggleStatus={handleToggleStatus}
                    onDuplicate={handleDuplicate}
                />
            );
        }
    }, [viewMode, refreshKey, router, handleToggleStatus, handleQuickUpdate, handleDuplicate]);

    if (!isAuthenticated || !supplier) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Not authenticated</Text>
            </View>
        );
    }

    const renderFooter = () => {
        if (!isLoadingMore) return null;

        return (
            <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading more products...</Text>
            </View>
        );
    };

    const renderEmpty = () => {
        if (loading) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.stateText}>Loading products...</Text>
                </View>
            );
        }

        if (error) {
            return (
                <View style={styles.stateContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={refresh}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <View style={styles.stateContainer}>
                <Ionicons name="cube-outline" size={64} color={COLORS.textSecondary} />
                <Text style={styles.emptyText}>No products found</Text>
                <Text style={styles.emptySubtext}>Add your first product to get started</Text>
            </View>
        );
    };

    return (
        <View style={styles.root}>
            {/* Fixed Header with Title and View Toggle */}
            <View style={[styles.fixedHeader, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 0) }]}>
                <View style={styles.header}>
                    <Text style={styles.title}>My Products</Text>

                    <View style={styles.viewToggle}>
                        {/* Sync Icon Button */}
                        <TouchableOpacity
                            style={styles.syncButton}
                            onPress={() => router.push('/offline-products' as any)}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name="cloud-upload-outline"
                                size={18}
                                color={COLORS.black}
                            />
                            {offlinePendingCount > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{offlinePendingCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Grid View Button */}
                        <TouchableOpacity
                            style={[
                                styles.toggleButton,
                                viewMode === 'grid' && styles.toggleButtonActive
                            ]}
                            onPress={() => setViewMode('grid')}
                        >
                            <GridIcon
                                width={14}
                                height={14}
                                color={COLORS.black}
                            />
                        </TouchableOpacity>

                        {/* List View Button */}
                        <TouchableOpacity
                            style={[
                                styles.toggleButton,
                                viewMode === 'list' && styles.toggleButtonActive
                            ]}
                            onPress={() => setViewMode('list')}
                        >
                            <ListIcon
                                width={14}
                                height={10}
                                color={COLORS.black}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Add Product Button */}
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => router.push('/(supplier-drawer)/add-product')}
                >
                    <Ionicons name="add" size={16} color={COLORS.black} />
                    <Text style={styles.addButtonText}>Add Product</Text>
                </TouchableOpacity>
            </View>

            {/* Products List */}
            {loading ? (
                // Show loading screen when reloading (feels like fresh load)
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.stateText}>Loading products...</Text>
                </View>
            ) : (
                <FlatList
                    key={viewMode} // Force re-render when view mode changes
                    data={products}
                    keyExtractor={(item) => item.id.toString()}
                    numColumns={viewMode === 'grid' ? 2 : 1}
                    columnWrapperStyle={viewMode === 'grid' && products.length > 0 ? styles.productsRow : undefined}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListFooterComponent={renderFooter}
                    ListEmptyComponent={renderEmpty}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={refresh}
                            colors={[COLORS.primary]}
                            tintColor={COLORS.primary}
                        />
                    }
                    renderItem={renderProductItem}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Fixed Header Container
    fixedHeader: {
        backgroundColor: COLORS.background,
        paddingHorizontal: 16,
        paddingBottom: theme.spacing.xs,
    },

    // List Content
    listContent: {
        padding: 16,
        paddingTop: 8,
    },

    // Header Styles
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 0,
        gap: 16,
        width: '100%',
        height: 32,
        marginBottom: 24,
    },
    title: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '700',
        fontSize: 24,
        lineHeight: 24,
        color: COLORS.black,
        flex: 0,
    },

    // View Toggle Styles
    viewToggle: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 0,
        gap: 8,
        height: 32,
    },
    toggleButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        paddingHorizontal: 16,
        width: 32,
        height: 32,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 8,
    },
    toggleButtonActive: {
        backgroundColor: COLORS.primaryLight,
    },
    syncButton: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 32,
        height: 32,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 8,
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#DC2626',
        borderRadius: 9,
        width: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
        fontFamily: 'Inter',
    },

    // Add Product Button
    addButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 0,
        paddingHorizontal: 12,
        gap: 8,
        width: '100%',
        minHeight: 40,
        backgroundColor: COLORS.primaryLight,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 8,
        marginBottom: 8,
    },
    addButtonText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 18,
        color: COLORS.black,
    },

    // Products Grid
    productsRow: {
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    productItem: {
        width: '48%',
    },

    // Loading More
    loadingMore: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
    loadingText: {
        marginLeft: 8,
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    loadingContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 100,
        gap: 16,
    },

    // State Containers
    stateContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 60,
        gap: 16,
    },
    stateText: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 16,
        color: COLORS.textPrimary,
    },
    emptyText: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 20,
        color: COLORS.textPrimary,
    },
    emptySubtext: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    retryButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: COLORS.primaryLight,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 8,
        marginTop: 8,
    },
    retryButtonText: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 16,
        color: COLORS.primary,
    },

    errorText: {
        fontSize: 16,
        color: COLORS.error,
    },
});
