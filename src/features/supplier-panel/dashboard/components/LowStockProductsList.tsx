import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLowStockProducts } from '../hooks/useLowStockProducts';
import { LowStockProductCard } from './LowStockProductCard';

interface LowStockProductsListProps {
    onProductSave?: (productId: number, price: number, stock: number) => Promise<boolean | void> | boolean | void;
    onProductEdit?: (productId: number) => void;
    onEditVariants?: (productId: number) => void;
    onToggleStatus?: (productId: number, currentStatus: 'active' | 'inactive') => Promise<boolean | void> | boolean | void;
    onDuplicate?: (productId: number) => Promise<boolean | void> | boolean | void;
    onSeeAll?: () => void;
    productsData?: any;
}

export const LowStockProductsList: React.FC<LowStockProductsListProps> = ({
    onProductSave,
    onProductEdit,
    onEditVariants,
    onToggleStatus,
    onDuplicate,
    onSeeAll,
    productsData,
}) => {
    const hookData = useLowStockProducts();
    const { data: products, loading, error, refetch } = productsData || hookData;

    const handleSave = async (productId: number, price: number, stock: number) => {
        if (!onProductSave) return;
        try {
            await onProductSave(productId, price, stock);
        } catch {
            // onProductSave should handle its own error UI
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>My Products</Text>
                    <Text style={styles.subtitle}>Edit stock and price in 5 seconds</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#00615E" />
                </View>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>My Products</Text>
                    <Text style={styles.subtitle}>Edit stock and price in 5 seconds</Text>
                </View>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={refetch}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    if (products.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>My Products</Text>
                    <Text style={styles.subtitle}>All products are well stocked!</Text>
                </View>
                <View style={styles.emptyContainer}>
                    <Ionicons name="checkmark-circle-outline" size={48} color="#00615E" />
                    <Text style={styles.emptyText}>No low stock products</Text>
                </View>
            </View>
        );
    }

    // Show only first 2 products
    const displayProducts = products.slice(0, 2);
    const hasMore = products.length > 2;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>My Products</Text>
                <Text style={styles.subtitle}>Edit stock and price in 5 seconds</Text>
            </View>

            <View style={styles.productsContainer}>
                {displayProducts.map((product: any) => (
                    <LowStockProductCard
                        key={product.marketplace_product_id || product.id}
                        product={product}
                        onSave={handleSave}
                        onEdit={onProductEdit}
                        onEditVariants={onEditVariants}
                        onToggleStatus={onToggleStatus}
                        onDuplicate={onDuplicate}
                    />
                ))}
            </View>

            {hasMore && onSeeAll && (
                <TouchableOpacity style={styles.seeAllButton} onPress={onSeeAll}>
                    <Text style={styles.seeAllButtonText}>See All</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: 16,
        gap: 16,
        alignSelf: 'stretch',
        backgroundColor: '#FCF7EA',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 6,
        borderRadius: 16,
        marginBottom: 24,
    },
    header: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        gap: 8,
        alignSelf: 'stretch',
    },
    title: {
        fontFamily: 'Inter',
        fontWeight: '700',
        fontSize: 24,
        color: '#000000',
        alignSelf: 'stretch',
        includeFontPadding: false,
    },
    subtitle: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 14,
        color: '#000000',
        alignSelf: 'stretch',
        includeFontPadding: false,
    },
    productsContainer: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        gap: 8,
        alignSelf: 'stretch',
    },
    loadingContainer: {
        alignSelf: 'stretch',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    errorContainer: {
        alignSelf: 'stretch',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        gap: 12,
    },
    errorText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 14,
        color: '#FF6B6B',
        textAlign: 'center',
        includeFontPadding: false,
    },
    retryButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#00615E',
        borderRadius: 8,
    },
    retryButtonText: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 14,
        color: '#FFFFFF',
        includeFontPadding: false,
    },
    emptyContainer: {
        alignSelf: 'stretch',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        gap: 12,
    },
    emptyText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 14,
        color: '#666666',
        textAlign: 'center',
        includeFontPadding: false,
    },
    seeAllButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 12,
        gap: 8,
        alignSelf: 'stretch',
        height: 40,
        backgroundColor: '#EAECE1',
        borderWidth: 1,
        borderColor: '#EAECE1',
        borderRadius: 8,
    },
    seeAllButtonText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 16,
        color: '#000000',
        includeFontPadding: false,
    },
});
