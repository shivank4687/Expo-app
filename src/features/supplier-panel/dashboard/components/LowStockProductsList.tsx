import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LowStockProductCard } from './LowStockProductCard';
import { useLowStockProducts } from '../hooks/useLowStockProducts';

interface LowStockProductsListProps {
    onProductSave?: (productId: number, price: number, stock: number) => void;
    onProductEdit?: (productId: number) => void;
    onEditVariants?: (productId: number) => void;
    onSeeAll?: () => void;
}

export const LowStockProductsList: React.FC<LowStockProductsListProps> = ({
    onProductSave,
    onProductEdit,
    onEditVariants,
    onSeeAll,
}) => {
    const { data: products, loading, error, refetch } = useLowStockProducts();

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
                {displayProducts.map((product) => (
                    <LowStockProductCard
                        key={product.id}
                        product={product}
                        onSave={onProductSave}
                        onEdit={onProductEdit}
                        onEditVariants={onEditVariants}
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
        backgroundColor: '#FFFFFF',
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
        lineHeight: 24,
        color: '#000000',
        alignSelf: 'stretch',
    },
    subtitle: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 14,
        lineHeight: 20,
        color: '#000000',
        alignSelf: 'stretch',
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
        lineHeight: 17,
        color: '#FF6B6B',
        textAlign: 'center',
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
        lineHeight: 17,
        color: '#FFFFFF',
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
        lineHeight: 17,
        color: '#666666',
        textAlign: 'center',
    },
    seeAllButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        gap: 8,
        alignSelf: 'stretch',
        height: 40,
        borderWidth: 1,
        borderColor: '#00615E',
        borderRadius: 8,
    },
    seeAllButtonText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 16,
        color: '#000000',
    },
});
