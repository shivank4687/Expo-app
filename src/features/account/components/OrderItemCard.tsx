/**
 * OrderItemCard Component
 * Displays individual order item information with enhanced UI
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { OrderItem } from '@/services/api/orders.api';
import { ProductImage } from '@/shared/components/LazyImage';
import { productsApi } from '@/services/api/products.api';

interface OrderItemCardProps {
    item: OrderItem;
}

export const OrderItemCard: React.FC<OrderItemCardProps> = ({ item }) => {
    const { t } = useTranslation();
    const router = useRouter();
    const [fetchedImageUrl, setFetchedImageUrl] = useState<string | null>(null);

    // Try multiple possible image URL locations from order item
    const imageUrlFromItem = item.base_image?.small_image_url || 
                             item.base_image?.medium_image_url || 
                             item.base_image?.large_image_url || 
                             item.product_image ||
                             (item as any).image?.url ||
                             (item as any).image_url ||
                             (item as any).base_image?.original_image_url ||
                             (item as any).product?.base_image?.medium_image_url ||
                             (item as any).product?.base_image?.small_image_url ||
                             (item as any).product?.thumbnail ||
                             (item as any).images?.[0]?.url ||
                             (item as any).images?.[0]?.medium_image_url;

    // If no image in order item, try to fetch from product API
    useEffect(() => {
        if (!imageUrlFromItem && item.product_id) {
            productsApi.getProductById(item.product_id)
                .then((product) => {
                    const productImageUrl = product.thumbnail ||
                                          (product.images && product.images.length > 0 && product.images[0]?.url) ||
                                          (product as any).base_image?.medium_image_url || 
                                          (product as any).base_image?.small_image_url;
                    if (productImageUrl) {
                        setFetchedImageUrl(productImageUrl);
                    }
                })
                .catch((error) => {
                    console.log('[OrderItemCard] Failed to fetch product image:', error);
                });
        }
    }, [imageUrlFromItem, item.product_id]);

    // Use image from item first, then fallback to fetched image
    const imageUrl = imageUrlFromItem || fetchedImageUrl;

    const handleProductPress = () => {
        if (item.product_id) {
            router.push(`/product/${item.product_id}`);
        }
    };

    return (
        <TouchableOpacity 
            style={styles.card}
            onPress={handleProductPress}
            activeOpacity={0.7}
            disabled={!item.product_id}
        >
            <View style={styles.content}>
                {/* Product Image - Always show container */}
                <View style={styles.imageContainer}>
                    {imageUrl ? (
                        <ProductImage
                            imageUrl={imageUrl}
                            style={styles.image}
                            recyclingKey={`order-item-${item.id}`}
                            priority="low"
                        />
                    ) : (
                        <View style={styles.placeholderContainer}>
                            <Ionicons name="cube-outline" size={32} color={theme.colors.gray[400]} />
                        </View>
                    )}
                </View>

                {/* Product Details */}
                <View style={styles.details}>
                    {/* Product Name */}
                    <Text style={styles.productName} numberOfLines={2}>
                        {item.name}
                    </Text>

                    {/* Product Attributes */}
                    {item.additional?.attributes && item.additional.attributes.length > 0 && (
                        <View style={styles.attributes}>
                            {item.additional.attributes.map((attr, index) => (
                                <Text key={index} style={styles.attributeText}>
                                    <Text style={styles.attributeLabel}>{attr.attribute_name}: </Text>
                                    {attr.option_label}
                                </Text>
                            ))}
                        </View>
                    )}

                    {/* SKU and Quantity */}
                    <View style={styles.infoRow}>
                        <View style={styles.infoItem}>
                            <Text style={styles.infoLabel}>
                                {t('orders.sku', 'SKU')}: 
                            </Text>
                            <Text style={styles.infoValue}>{item.sku}</Text>
                        </View>
                        {item.qty_ordered > 0 && (
                            <View style={styles.infoItem}>
                                <Text style={styles.infoLabel}>
                                    {t('orders.quantity', 'Qty')}: 
                                </Text>
                                <Text style={styles.infoValue}>{item.qty_ordered}</Text>
                            </View>
                        )}
                    </View>

                    {/* Price and Total */}
                    <View style={styles.priceRow}>
                        <View style={styles.priceInfo}>
                            <Text style={styles.priceLabel}>
                                {t('orders.price', 'Price')}: 
                            </Text>
                            <Text style={styles.priceValue}>
                                {item.formatted_price_incl_tax || item.formatted_price}
                            </Text>
                        </View>
                        <View style={styles.totalInfo}>
                            <Text style={styles.totalLabel}>
                                {t('orders.subtotal', 'Subtotal')}: 
                            </Text>
                            <Text style={styles.totalValue}>
                                {item.formatted_total_incl_tax || item.formatted_total}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.md,
        marginHorizontal: theme.spacing.md,
        marginVertical: theme.spacing.xs,
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.gray[200],
        shadowColor: theme.colors.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    content: {
        flexDirection: 'row',
        gap: theme.spacing.md,
    },
    imageContainer: {
        width: 80,
        height: 80,
        borderRadius: theme.borderRadius.sm,
        overflow: 'hidden',
        backgroundColor: theme.colors.gray[100],
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    placeholderContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.gray[100],
    },
    details: {
        flex: 1,
        justifyContent: 'space-between',
    },
    productName: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
        lineHeight: 20,
        marginBottom: theme.spacing.xs,
    },
    attributes: {
        gap: 2,
        marginBottom: theme.spacing.xs,
    },
    attributeText: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
        lineHeight: 16,
    },
    attributeLabel: {
        fontWeight: theme.typography.fontWeight.medium,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        marginTop: theme.spacing.xs,
        marginBottom: theme.spacing.xs,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    infoLabel: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
    },
    infoValue: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.primary,
    },
    priceRow: {
        marginTop: theme.spacing.xs,
        paddingTop: theme.spacing.xs,
        borderTopWidth: 1,
        borderTopColor: theme.colors.gray[200],
        gap: 4,
    },
    priceInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceLabel: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
    },
    priceValue: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.primary,
    },
    totalInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
    },
    totalValue: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.primary[500],
    },
});

