import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LowStockProduct } from '../api/low-stock-products.api';

interface LowStockProductCardProps {
    product: LowStockProduct;
    onSave?: (productId: number, price: number, stock: number) => void;
    onEdit?: (productId: number) => void;
    onEditVariants?: (productId: number) => void;
}

export const LowStockProductCard: React.FC<LowStockProductCardProps> = ({
    product,
    onSave,
    onEdit,
    onEditVariants,
}) => {
    const [price, setPrice] = useState(product.price.toString());
    const [stock, setStock] = useState(product.stock_qty.toString());

    const isConfigurable = product.type === 'configurable';

    const handleSave = () => {
        if (onSave) {
            onSave(product.id, parseFloat(price), parseInt(stock));
        }
    };

    return (
        <View style={styles.productCard}>
            <View style={styles.productHeader}>
                <View style={styles.productImage}>
                    {product.image_url ? (
                        <Image
                            source={{ uri: product.image_url }}
                            style={styles.image}
                            resizeMode="cover"
                        />
                    ) : (
                        <Ionicons name="image-outline" size={24} color="#666666" />
                    )}
                </View>
                <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                    <Text style={styles.productCategory}>{product.sku}</Text>
                </View>
            </View>

            <View style={styles.productFields}>
                <View style={styles.productField}>
                    <Text style={styles.productFieldLabel}>B2B Price (MX$)</Text>
                    <TextInput
                        style={styles.productFieldInput}
                        value={price}
                        onChangeText={setPrice}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor="#666666"
                    />
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
                        style={styles.productActionSmallPrimary}
                        onPress={handleSave}
                    >
                        <Text style={styles.productActionPrimaryText}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.productActionMediumOutline}
                        onPress={() => onEditVariants?.(product.id)}
                    >
                        <Text style={styles.productActionOutlineText}>Edit Variants</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.productActionSmallOutline}
                        onPress={() => onEdit?.(product.id)}
                    >
                        <Text style={styles.productActionOutlineText}>Edit</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.productActions}>
                    <TouchableOpacity
                        style={styles.productActionPrimary}
                        onPress={handleSave}
                    >
                        <Text style={styles.productActionPrimaryText}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.productActionOutline}
                        onPress={() => onEdit?.(product.id)}
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
    productName: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 20,
        lineHeight: 24,
        color: '#000000',
        alignSelf: 'stretch',
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
        padding: 12,
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
