import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../../styles/colors';
import { EditIcon } from '@/assets/icons';
import { ProductImage } from '@/shared/components/LazyImage';
import { ToggleSlider } from '@/shared/components/ToggleSlider';

export interface ProductCardProps {
    id: number;
    name: string;
    price: string;
    status: 'active' | 'inactive';
    stock: number;
    imageUrl?: string | null;
    type?: string;
    onEdit?: () => void;
    onToggleStatus?: (id: number, currentStatus: 'active' | 'inactive') => void;
    onSave?: (id: number, price: string, stock: number) => void;
    onDuplicate?: (productId: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
    id,
    name,
    price,
    status,
    stock,
    imageUrl,
    type,
    onEdit,
    onToggleStatus,
    onSave,
    onDuplicate,
}) => {
    const router = useRouter();

    // Extract numeric value from price (remove currency symbols and formatting)
    const numericPrice = price.replace(/[^0-9.]/g, '');

    const [editablePrice, setEditablePrice] = useState(numericPrice);
    const [editableStock, setEditableStock] = useState(stock.toString());
    const [hasChanges, setHasChanges] = useState(false);

    // Reset state when props change (e.g., on pull-to-refresh)
    useEffect(() => {
        const newNumericPrice = price.replace(/[^0-9.]/g, '');
        setEditablePrice(newNumericPrice);
        setEditableStock(stock.toString());
        setHasChanges(false);
    }, [id, price, stock]);

    const handlePriceChange = (value: string) => {
        // Only allow numeric input with decimal point
        const numericValue = value.replace(/[^0-9.]/g, '');
        setEditablePrice(numericValue);
        setHasChanges(true);
    };

    const handleStockChange = (value: string) => {
        // Only allow numeric input
        const numericValue = value.replace(/[^0-9]/g, '');
        setEditableStock(numericValue);
        setHasChanges(true);
    };

    const handleSave = () => {
        if (onSave && hasChanges) {
            onSave(id, editablePrice, parseInt(editableStock) || 0);
            setHasChanges(false);
        }
    };

    const handleImagePress = () => {
        // router.push({
        //     pathname: '/(supplier-drawer)/product-view',
        //     params: { id: id.toString(), name },
        // });
    };

    return (
        <View style={styles.card}>
            {/* Product Image with Price Badge - Clickable */}
            <TouchableOpacity
                style={styles.imageContainer}
                onPress={handleImagePress}
                activeOpacity={0.7}
            >
                <ProductImage
                    imageUrl={imageUrl ?? undefined}
                    style={styles.productImage}
                    recyclingKey={id?.toString()}
                    priority="low"
                />

                {/* Edit Icon - Top Right */}
                {onEdit && (
                    <TouchableOpacity
                        style={styles.editIconButton}
                        onPress={(e) => {
                            e.stopPropagation();
                            onEdit();
                        }}
                        activeOpacity={0.7}
                    >
                        <EditIcon width={16} height={16} color={COLORS.black} />
                    </TouchableOpacity>
                )}

                {/* Duplicate Icon - Below Edit Icon */}
                {onDuplicate && (
                    <TouchableOpacity
                        style={styles.duplicateIconButton}
                        onPress={(e) => {
                            e.stopPropagation();
                            onDuplicate(id);
                        }}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="copy-outline" size={16} color={COLORS.black} />
                    </TouchableOpacity>
                )}

                {/* Price Badge - Bottom Left */}
                <View style={styles.priceBadge}>
                    <Text style={styles.priceText}>{price}</Text>
                </View>

                {/* Status Toggle Slider - Bottom Right */}
                {onToggleStatus && (
                    <View style={styles.statusToggleButton}>
                        <ToggleSlider
                            isActive={status === 'active'}
                            onToggle={() => onToggleStatus(id, status)}
                            size={24}
                        />
                    </View>
                )}
            </TouchableOpacity>

            {/* Product Info */}
            <View style={styles.infoContainer}>
                {/* Product Name */}
                <Text style={styles.productName} numberOfLines={1}>
                    {name}
                </Text>

                {/* Price and Stock Input Row */}
                <View style={[
                    styles.inputsSection,
                    type === 'configurable' && { opacity: 0, pointerEvents: 'none' }
                ]}>
                    <View style={styles.priceStockRow}>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputLabel}>Price</Text>
                            <View style={styles.priceInputContainer}>
                                <Text style={styles.currencySymbol}>$</Text>
                                <TextInput
                                    style={styles.priceInput}
                                    value={editablePrice}
                                    onChangeText={handlePriceChange}
                                    placeholder="0.00"
                                    placeholderTextColor={COLORS.textSecondary}
                                    keyboardType="decimal-pad"
                                />
                            </View>
                        </View>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputLabel}>Stock</Text>
                            <TextInput
                                style={styles.input}
                                value={editableStock}
                                onChangeText={handleStockChange}
                                placeholder="0"
                                placeholderTextColor={COLORS.textSecondary}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>

                    {/* Save Button - Only show when there are changes */}
                    {hasChanges && (
                        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                            <Text style={styles.saveButtonText}>Save</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 8,
        gap: 8,
        width: '100%',
        height: 'auto',
        backgroundColor: '#FCF7EA',
        borderWidth: 1,
        borderColor: '#E9E3D3',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 6,
        borderRadius: 8,
    },
    imageContainer: {
        width: '100%',
        height: 150,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        position: 'relative',
        overflow: 'hidden',
    },
    productImage: {
        width: '100%',
        height: '100%',
    },
    placeholderImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    priceBadge: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 4,
        paddingHorizontal: 8,
        position: 'absolute',
        left: 8,
        top: 120,
        backgroundColor: COLORS.white,
        borderRadius: 4,
    },
    statusToggleButton: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editIconButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 28,
        height: 28,
        backgroundColor: COLORS.white,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    duplicateIconButton: {
        position: 'absolute',
        top: 44, // 8px (initial top) + 28px (edit button height) + 8px (gap)
        right: 8,
        width: 28,
        height: 28,
        backgroundColor: COLORS.white,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    priceText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 12,
        lineHeight: 14,
        color: COLORS.primary,
    },
    infoContainer: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        gap: 8,
        width: '100%',
        flex: 1,
    },
    productName: {
        width: '100%',
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '600',
        fontSize: 16,
        lineHeight: 20,
        color: COLORS.black,
    },
    inputsSection: {
        width: '100%',
        flexDirection: 'column',
        gap: 8,
    },
    priceStockRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        width: '100%',
        gap: 8,
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'column',
        gap: 4,
    },
    inputLabel: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
        includeFontPadding: false,
    },
    input: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        color: '#0A292D',
        paddingTop: 0,
        paddingBottom: 0,
        paddingHorizontal: 16,
        backgroundColor: '#F3F0E7',
        borderRadius: 8,
        height: 40,
        textAlignVertical: 'center',
        includeFontPadding: false,
    },
    priceInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        alignSelf: 'stretch',
        height: 40,
        backgroundColor: '#F3F0E7',
        borderRadius: 8,
    },
    currencySymbol: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        color: '#0A292D',
        marginRight: 2,
        includeFontPadding: false,
    },
    priceInput: {
        flex: 1,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        color: '#0A292D',
        paddingTop: 0,
        paddingBottom: 0,
        textAlignVertical: 'center',
        includeFontPadding: false,
    },
    saveButton: {
        width: '100%',
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: COLORS.primary,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },
    saveButtonText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '600',
        fontSize: 14,
        lineHeight: 16,
        color: COLORS.white,
    },
    stockText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 12,
        lineHeight: 14,
        color: COLORS.textSecondary,
    },
});
