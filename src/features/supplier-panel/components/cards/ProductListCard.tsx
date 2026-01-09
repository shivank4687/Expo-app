import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../../styles/colors';
import { EditIcon } from '@/assets/icons';
import { ProductImage } from '@/shared/components/LazyImage';

export interface ProductListCardProps {
    id: number;
    name: string;
    price: string;
    status: 'active' | 'inactive';
    stock: number;
    imageUrl?: string | null;
    onEdit?: () => void;
}

export const ProductListCard: React.FC<ProductListCardProps> = ({
    id,
    name,
    price,
    status,
    stock,
    imageUrl,
    onEdit,
}) => {
    const router = useRouter();

    const handlePress = () => {
        router.push({
            pathname: '/(supplier-drawer)/product-view',
            params: { id: id.toString(), name },
        });
    };

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={handlePress}
            activeOpacity={0.7}
        >
            {/* Product Image */}
            <View style={styles.imageContainer}>
                <ProductImage
                    imageUrl={imageUrl ?? undefined}
                    style={styles.productImage}
                    recyclingKey={id?.toString()}
                    priority="low"
                />
            </View>

            {/* Product Info */}
            <View style={styles.infoContainer}>
                {/* Product Name and Price */}
                <View style={styles.topSection}>
                    <Text style={styles.productName} numberOfLines={2}>
                        {name}
                    </Text>
                    <Text style={styles.priceText}>{price}</Text>
                </View>

                {/* Status and Stock Row */}
                <View style={styles.bottomSection}>
                    <View style={styles.statusRow}>
                        {/* Status Badge */}
                        <View style={styles.statusBadge}>
                            <View
                                style={[
                                    styles.statusDot,
                                    status === 'active' ? styles.statusDotActive : styles.statusDotInactive
                                ]}
                            />
                            <Text style={styles.statusText}>
                                {status === 'active' ? 'Active' : 'Inactive'}
                            </Text>
                        </View>

                        {/* Stock Count */}
                        <Text style={styles.stockText}>Stock: {stock}</Text>
                    </View>

                    {/* Edit Button */}
                    <TouchableOpacity style={styles.editButton} onPress={onEdit}>
                        <EditIcon width={14} height={14} color={COLORS.black} />
                        <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        width: '100%',
        backgroundColor: COLORS.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
        borderRadius: 8,
        marginBottom: 8,
    },
    imageContainer: {
        width: 100,
        height: 100,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        overflow: 'hidden',
    },
    productImage: {
        width: '100%',
        height: '100%',
    },
    infoContainer: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'space-between',
        height: 100,
    },
    topSection: {
        flex: 1,
        justifyContent: 'flex-start',
    },
    productName: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 16,
        lineHeight: 20,
        color: COLORS.black,
        marginBottom: 4,
    },
    priceText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 14,
        lineHeight: 16,
        color: COLORS.primary,
    },
    bottomSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 4,
        paddingHorizontal: 8,
        gap: 4,
        backgroundColor: COLORS.primaryLight,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 80,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusDotActive: {
        backgroundColor: COLORS.primary,
    },
    statusDotInactive: {
        backgroundColor: COLORS.textSecondary,
    },
    statusText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 10,
        lineHeight: 12,
        color: COLORS.black,
    },
    stockText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 12,
        lineHeight: 14,
        color: COLORS.black,
    },
    editButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8,
        paddingHorizontal: 12,
        gap: 4,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 6,
    },
    editButtonText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 12,
        lineHeight: 12,
        color: COLORS.black,
    },
});

export default ProductListCard;
