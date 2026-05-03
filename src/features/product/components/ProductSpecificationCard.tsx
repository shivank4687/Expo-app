import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, DimensionValue } from 'react-native';
import { HTMLContent } from '@/shared/components/HTMLContent';
import { SupplierInfo } from '../types/product.types';
import { useAppSelector } from '@/store/hooks';
import { theme } from '@/theme';

interface ProductSpecificationCardProps {
    shortDescription?: string | null;
    specifications?: { key: string; value: string }[];
    supplier?: SupplierInfo;
}

export const ProductSpecificationCard: React.FC<ProductSpecificationCardProps> = ({
    shortDescription,
    specifications,
    supplier,
}) => {
    const { cart } = useAppSelector((state) => state.cart);
    const { selectedCurrency } = useAppSelector((state) => state.core);
    const currencySymbol = selectedCurrency?.symbol || selectedCurrency?.code || '$';
    const { isAuthenticated } = useAppSelector((state) => state.auth);
    // Compute how much the user currently has in cart from this supplier
    const currentAmount = React.useMemo(() => {
        if (!cart?.items || !supplier?.id) return 0;

        const total = cart.items
            .filter((item) => item?.product?.supplier?.id === supplier.id)
            .reduce((sum, item) => {
                const itemTotal = Number(item?.total || 0);
                return sum + itemTotal;
            }, 0);

        return total || 0;
    }, [cart?.items, supplier?.id]);
    console.log(supplier)
    const minimumAmount = supplier?.minimum_order_amount ?? 0;
    const freeShippingThreshold = supplier?.free_shipping_threshold ?? 0;
    const freeShippingEnable = supplier?.free_shipping_enable ?? false;

    const showProgress = isAuthenticated && (minimumAmount > 0 || (freeShippingEnable && freeShippingThreshold > 0));

    const progressRatio = minimumAmount > 0 ? Math.min(currentAmount / minimumAmount, 1) : 0;
    const progressPercent = `${Math.round(progressRatio * 100)}%`;
    const remaining = Math.max(minimumAmount - currentAmount, 0);
    const hasMetMinimum = currentAmount >= minimumAmount;

    const freeShippingRemaining = Math.max(freeShippingThreshold - currentAmount, 0);
    const hasMetFreeShipping = currentAmount >= freeShippingThreshold;

    return (
        <View style={styles.container}>
            {/* Header: Product details & Copy */}
            <View style={styles.headerRow}>
                <Text style={styles.title}>Product details</Text>
            </View>

            <View style={styles.contentContainer}>
                {/* Description block */}
                {shortDescription ? (
                    <View style={styles.descriptionBox}>
                        <HTMLContent
                            html={shortDescription}
                            baseStyle={styles.descriptionText}
                        />
                    </View>
                ) : (
                    <View style={styles.descriptionBox}>
                        <Text style={styles.descriptionText}>
                            Hand-painted talavera-style mug set made by a vetted artisan studio. Smooth glaze, durable finish, gift-ready packaging. Each piece is slightly unique.
                        </Text>
                    </View>
                )}

                {/* Specifications Section */}
                {specifications && specifications.length > 0 && (
                    <>
                        <View style={styles.specHeaderRow}>
                            <Text style={styles.sectionTitle}>Specifications</Text>
                        </View>

                        <View style={styles.specificationsContainer}>
                            {specifications.map((spec, index) => (
                                <View key={index} style={styles.specRow}>
                                    <Text style={styles.specLabel}>{spec.key}</Text>
                                    <Text style={styles.specValue}>{spec.value}</Text>
                                </View>
                            ))}

                            {/* Image with "More Detail" button */}
                            <ImageBackground
                                source={{ uri: 'https://via.placeholder.com/328x219' }}
                                style={styles.imageBackground}
                                imageStyle={styles.imageStyle}
                            >
                                <View style={styles.imageOverlay} />
                                <TouchableOpacity style={styles.moreDetailButton}>
                                    <Text style={styles.moreDetailText}>More Detail</Text>
                                </TouchableOpacity>
                            </ImageBackground>
                        </View>
                    </>
                )}

                {/* Supplier Minimum Order & Free Shipping — only when supplier has settings */}
                {showProgress && (
                    <>
                        <View style={styles.supplierRow}>
                            <Text style={styles.supplierLabel}>Supplier minimum order</Text>
                            {freeShippingEnable && freeShippingThreshold > 0 && (
                                <View style={styles.freeShippingBadge}>
                                    <Text style={styles.freeShippingText}>
                                        {hasMetFreeShipping
                                            ? 'Free Shipping Met 🎉'
                                            : `Add ${currencySymbol}${freeShippingRemaining.toFixed(0)} for Free Shipping`
                                        }
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Progress Box */}
                        <View style={styles.progressBox}>
                            <View style={styles.progressHeader}>
                                <Text style={styles.progressTitle}>
                                    {hasMetMinimum ? 'Minimum reached! 🎉' : 'Progress to minimum'}
                                </Text>
                                <Text style={[styles.progressAmount, hasMetMinimum && styles.progressAmountMet]}>
                                    {currencySymbol}{(currentAmount || 0).toFixed(0)} / {currencySymbol}{(minimumAmount || 0).toFixed(0)}
                                </Text>
                            </View>
                            <Text style={styles.progressDesc}>
                                {hasMetMinimum
                                    ? `You've reached the minimum order of ${currencySymbol}${(minimumAmount || 0).toFixed(0)} from this supplier.`
                                    : `You have ${currencySymbol}${(currentAmount || 0).toFixed(0)} in cart from this supplier. Add ${currencySymbol}${(remaining || 0).toFixed(0)} more to reach the minimum.`
                                }
                            </Text>
                            <View style={styles.progressBarTrack}>
                                <View style={[styles.progressBarFill, { width: progressPercent as DimensionValue }, hasMetMinimum && styles.progressBarFillComplete]} />
                            </View>
                        </View>
                    </>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 8,
        padding: theme.spacing.sm,
        gap: 12,
        alignSelf: 'stretch',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    title: {
        fontWeight: '700',
        fontSize: 16,
        color: '#000000',
    },
    contentContainer: {
        gap: 4,
    },
    descriptionBox: {
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 8,
        padding: 8,
    },
    descriptionText: {
        fontSize: 12,
        lineHeight: 19,
        color: '#0A292D',
    },
    specHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
        marginBottom: 4,
    },
    sectionTitle: {
        fontWeight: '500',
        fontSize: 12,
        color: '#000000',
    },
    specificationsContainer: {
        gap: 4,
    },
    specRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 8,
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 8,
    },
    specLabel: {
        fontSize: 11,
        color: '#000000',
    },
    specValue: {
        fontWeight: '500',
        fontSize: 12,
        color: '#000000',
    },
    imageBackground: {
        height: 86,
        borderRadius: 4,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#C8C8C8',
        marginTop: 4,
    },
    imageStyle: {
        borderRadius: 4,
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(33, 33, 33, 0.6)',
    },
    moreDetailButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 50,
        zIndex: 1,
    },
    moreDetailText: {
        fontWeight: '600',
        fontSize: 11,
        color: '#00615E',
    },
    supplierRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 8,
        marginTop: 4,
    },
    supplierLabel: {
        fontSize: 11,
        color: '#000000',
    },
    freeShippingBadge: {
        backgroundColor: 'rgba(0, 97, 94, 0.1)',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 50,
    },
    freeShippingText: {
        fontWeight: '500',
        fontSize: 11,
        color: '#00615E',
    },
    progressBox: {
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 8,
        padding: 8,
        gap: 8,
    },
    progressHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    progressTitle: {
        fontWeight: '500',
        fontSize: 14,
        color: '#000000',
    },
    progressAmount: {
        fontWeight: '500',
        fontSize: 12,
        color: '#000000',
    },
    progressAmountMet: {
        color: '#00615E',
    },
    progressDesc: {
        fontSize: 12,
        lineHeight: 19,
        color: '#0A292D',
    },
    progressBarTrack: {
        height: 12,
        backgroundColor: '#F0F0F0',
        borderRadius: 254,
        width: '100%',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#00615E',
        borderRadius: 254,
    },
    progressBarFillComplete: {
        backgroundColor: '#00A896',
    },
});
