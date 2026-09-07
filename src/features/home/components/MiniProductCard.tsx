import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '@/features/product/types/product.types';
import { ProductImage } from '@/shared/components/LazyImage';
import { formatters } from '@/shared/utils/formatters';
import { theme } from '@/theme';
import { useAppSelector } from '@/store/hooks';
import { useToast } from '@/shared/components/Toast';
import { useTranslation } from 'react-i18next';

interface MiniProductCardProps {
    product: Product;
    onPress: () => void;
    showPrice?: boolean;
}

export const MiniProductCard = React.memo<MiniProductCardProps>(({ product, onPress, showPrice = true }) => {
    const { selectedCurrency } = useAppSelector((state) => state.core);
    const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
    const currencySymbol = selectedCurrency?.symbol || selectedCurrency?.code || '$';
    const { showToast } = useToast();
    const { t } = useTranslation();

    const imageUrl = product.thumbnail || (product.images && product.images[0]?.url);

    return (
        <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
            <View style={styles.imageContainer}>
                <ProductImage
                    imageUrl={imageUrl}
                    style={styles.image}
                    priority="low"
                />
            </View>
            <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>
                    {product.name}
                </Text>
                {showPrice && (
                    <View style={styles.priceRow}>
                        <Text style={styles.price} numberOfLines={1}>
                            {formatters.formatPrice(product.price, currencySymbol)}
                        </Text>
                        {!isAuthenticated && (
                            <TouchableOpacity
                                onPress={(e) => {
                                    e.stopPropagation();
                                    showToast({ message: t('product.loginToViewWholesale') || 'Login for wholesale pricing', type: 'info' });
                                }}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                style={styles.lockIconContainer}
                            >
                                <View style={styles.lockIconBackground}>
                                    <Ionicons name="lock-closed" size={10} color={theme.colors.primary[600] || theme.colors.primary[500]} />
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.product.id === nextProps.product.id &&
        prevProps.showPrice === nextProps.showPrice
    );
});

const styles = StyleSheet.create({
    container: {
        width: 140,
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.colors.border.card_light,
        overflow: 'hidden',
    },
    imageContainer: {
        width: '100%',
        height: 100,
        backgroundColor: theme.colors.background.default,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    info: {
        padding: theme.spacing.sm,
    },
    name: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 2,
    },
    price: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.primary[500],
        flex: 1,
    },
    lockIconContainer: {
        marginLeft: theme.spacing.xs,
        justifyContent: 'center',
        alignItems: 'center',
    },
    lockIconBackground: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: theme.colors.primary[50] || '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
