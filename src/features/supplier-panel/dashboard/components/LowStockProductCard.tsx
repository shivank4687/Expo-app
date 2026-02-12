import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { LowStockProduct } from '../api/low-stock-products.api';
import { ProductImage } from '@/shared/components/LazyImage';
import { ToggleSlider } from '@/shared/components/ToggleSlider';

interface LowStockProductCardProps {
    product: LowStockProduct;
    onSave?: (productId: number, price: number, stock: number) => Promise<boolean | void> | boolean | void;
    onEdit?: (productId: number) => void;
    onEditVariants?: (productId: number) => void;
    onToggleStatus?: (productId: number, currentStatus: 'active' | 'inactive') => Promise<boolean | void> | boolean | void;
}

export const LowStockProductCard: React.FC<LowStockProductCardProps> = ({
    product,
    onSave,
    onEdit,
    onEditVariants,
    onToggleStatus,
}) => {
    const marketplaceProductId = product.marketplace_product_id || product.id;

    const normalizePriceDisplay = (value: number | string) => {
        const numericValue = typeof value === 'number' ? value : parseFloat(String(value));

        if (Number.isNaN(numericValue)) {
            return '0';
        }

        return numericValue.toString();
    };

    const [price, setPrice] = useState(normalizePriceDisplay(product.price));
    const [stock, setStock] = useState(product.stock_qty.toString());
    const [savedPrice, setSavedPrice] = useState(normalizePriceDisplay(product.price));
    const [savedStock, setSavedStock] = useState(product.stock_qty.toString());
    const [priceError, setPriceError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isTogglingStatus, setIsTogglingStatus] = useState(false);
    const [isActive, setIsActive] = useState(product.status !== 'inactive');

    const isConfigurable = product.type === 'configurable';
    useEffect(() => {
        const nextPrice = normalizePriceDisplay(product.price);
        const nextStock = product.stock_qty.toString();
        setPrice(nextPrice);
        setStock(nextStock);
        setSavedPrice(nextPrice);
        setSavedStock(nextStock);
        setIsActive(product.status !== 'inactive');
    }, [product.id, product.price, product.stock_qty, product.status]);

    const hasChanges = price !== savedPrice || stock !== savedStock;

    const handleSave = async () => {
        if (onSave) {
            const parsedPrice = parseFloat(price);
            if (!price || Number.isNaN(parsedPrice) || parsedPrice <= 0) {
                setPriceError('Price is required');
                return;
            }
            setPriceError(null);
            try {
                setIsSaving(true);
                await onSave(marketplaceProductId, parsedPrice, parseInt(stock));
                setSavedPrice(price);
                setSavedStock(stock);
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleToggleStatus = async () => {
        if (!onToggleStatus || isTogglingStatus) return;
        const currentStatus: 'active' | 'inactive' = isActive ? 'active' : 'inactive';
        const nextIsActive = !isActive;
        setIsActive(nextIsActive);
        setIsTogglingStatus(true);
        try {
            const result = await onToggleStatus(marketplaceProductId, currentStatus);
            if (result === false) {
                setIsActive(!nextIsActive);
            }
        } catch {
            setIsActive(!nextIsActive);
        } finally {
            setIsTogglingStatus(false);
        }
    };

    return (
        <View style={styles.productCard}>
            <View style={styles.productHeader}>
                <View style={styles.productImage}>
                    <ProductImage
                        imageUrl={product.image_url ?? undefined}
                        style={styles.image}
                        recyclingKey={product.id?.toString()}
                        priority="low"
                    />
                </View>
                <View style={styles.productInfo}>
                    <View style={styles.productTitleRow}>
                        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                        <View style={styles.statusToggleButton}>
                            <ToggleSlider
                                isActive={isActive}
                                onToggle={handleToggleStatus}
                                size={24}
                            />
                        </View>
                    </View>
                    <Text style={styles.productCategory}>{product.sku}</Text>
                </View>
            </View>

            <View style={styles.productFields}>
                <View style={styles.productField}>
                    <Text style={styles.productFieldLabel}>Price (MX$)</Text>
                    <TextInput
                        style={[styles.productFieldInput, priceError && styles.productFieldInputError]}
                        value={price}
                        onChangeText={(value) => {
                            setPrice(value);
                            if (priceError) setPriceError(null);
                        }}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor="#666666"
                    />
                    {priceError && <Text style={styles.fieldErrorText}>{priceError}</Text>}
                </View>
                <View style={styles.productField}>
                    <Text style={styles.productFieldLabel}>Stock</Text>
                    <TextInput
                        style={styles.productFieldInput}
                        value={stock}
                        onChangeText={setStock}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor="#666666"
                    />
                </View>
            </View>

            {isConfigurable ? (
                <View style={styles.productActionsThree}>
                    <TouchableOpacity
                        style={[styles.productActionSmallPrimary, (!hasChanges || isSaving) && styles.productActionDisabled]}
                        onPress={handleSave}
                        disabled={!hasChanges || isSaving}
                    >
                        {isSaving ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Text style={styles.productActionPrimaryText}>Save</Text>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.productActionMediumOutline}
                        onPress={() => onEditVariants?.(marketplaceProductId)}
                    >
                        <Text style={styles.productActionOutlineText}>Edit Variants</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.productActionSmallOutline}
                        onPress={() => onEdit?.(marketplaceProductId)}
                    >
                        <Text style={styles.productActionOutlineText}>Edit</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.productActions}>
                    <TouchableOpacity
                        style={[styles.productActionPrimary, (!hasChanges || isSaving) && styles.productActionDisabled]}
                        onPress={handleSave}
                        disabled={!hasChanges || isSaving}
                    >
                        {isSaving ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Text style={styles.productActionPrimaryText}>Save</Text>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.productActionOutline}
                        onPress={() => onEdit?.(marketplaceProductId)}
                    >
                        <Text style={styles.productActionOutlineText}>Edit</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    productCard: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 16,
        gap: 16,
        alignSelf: 'stretch',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#EEEEEF',
        borderRadius: 16,
    },
    productHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 0,
        gap: 16,
        alignSelf: 'stretch',
    },
    productImage: {
        width: 53,
        height: 53,
        backgroundColor: '#A6A6A6',
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    productInfo: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        gap: 8,
    },
    productTitleRow: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    productName: {
        flex: 1,
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 20,
        lineHeight: 24,
        color: '#000000',
    },
    statusToggleButton: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    productCategory: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 13,
        lineHeight: 18,
        color: '#666666',
        alignSelf: 'stretch',
    },
    productFields: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 0,
        gap: 8,
        alignSelf: 'stretch',
    },
    productField: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        gap: 8,
    },
    productFieldLabel: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
        alignSelf: 'stretch',
    },
    productFieldInput: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        alignSelf: 'stretch',
        height: 40,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 16,
        color: '#666666',
    },
    productFieldInputError: {
        borderWidth: 1,
        borderColor: '#EF4444',
    },
    fieldErrorText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 12,
        lineHeight: 14,
        color: '#DC2626',
    },
    productActions: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 0,
        gap: 8,
        alignSelf: 'stretch',
    },
    productActionPrimary: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        gap: 8,
        flex: 1,
        height: 40,
        backgroundColor: '#00615E',
        borderRadius: 8,
    },
    productActionDisabled: {
        opacity: 0.5,
    },
    productActionPrimaryText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 16,
        color: '#F5F5F5',
    },
    productActionOutline: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        gap: 8,
        flex: 1,
        height: 40,
        borderWidth: 1,
        borderColor: '#00615E',
        borderRadius: 8,
    },
    productActionOutlineText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 16,
        color: '#000000',
    },
    productActionsThree: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 0,
        gap: 8,
        alignSelf: 'stretch',
    },
    productActionSmallPrimary: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        gap: 8,
        width: 75,
        height: 40,
        backgroundColor: '#00615E',
        borderRadius: 8,
    },
    productActionMediumOutline: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        gap: 8,
        width: 131,
        height: 40,
        borderWidth: 1,
        borderColor: '#00615E',
        borderRadius: 8,
    },
    productActionSmallOutline: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        gap: 8,
        width: 75,
        height: 40,
        borderWidth: 1,
        borderColor: '#00615E',
        borderRadius: 8,
    },
});
