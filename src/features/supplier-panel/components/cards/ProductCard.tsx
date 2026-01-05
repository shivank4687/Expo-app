import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS } from '../../styles/colors';
import { EditIcon } from '@/assets/icons';

export interface ProductCardProps {
    id: number;
    name: string;
    price: string;
    status: 'active' | 'inactive';
    stock: number;
    imageUrl?: string | null;
    onEdit?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
    id,
    name,
    price,
    status,
    stock,
    imageUrl,
    onEdit,
}) => {
    const router = useRouter();

    const handleImagePress = () => {
        router.push({
            pathname: '/(supplier-drawer)/product-view',
            params: { id: id.toString(), name },
        });
    };

    return (
        <View style={styles.card}>
            {/* Product Image with Price Badge - Clickable */}
            <TouchableOpacity
                style={styles.imageContainer}
                onPress={handleImagePress}
                activeOpacity={0.7}
            >
                {imageUrl ? (
                    <Image
                        source={{ uri: imageUrl }}
                        style={styles.productImage}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.placeholderImage}>
                        <Ionicons name="image-outline" size={40} color="#999" />
                    </View>
                )}

                {/* Price Badge - Bottom Left */}
                <View style={styles.priceBadge}>
                    <Text style={styles.priceText}>{price}</Text>
                </View>
            </TouchableOpacity>

            {/* Product Info */}
            <View style={styles.infoContainer}>
                {/* Title Section */}
                <View style={styles.titleSection}>
                    {/* Product Name */}
                    <Text style={styles.productName} numberOfLines={1}>
                        {name}
                    </Text>

                    {/* Status and Stock Row */}
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
                        <Text style={styles.stockText}>In Stock: {stock}</Text>
                    </View>
                </View>

                {/* Edit Button Section */}
                <View style={styles.buttonSection}>
                    <TouchableOpacity style={styles.editButton} onPress={onEdit}>
                        <EditIcon width={16} height={16} color={COLORS.black} />
                        <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
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
        width: '48%',
        height: 276,
        backgroundColor: COLORS.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
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
        gap: 16,
        width: '100%',
        flex: 1,
    },
    titleSection: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        gap: 8,
        width: '100%',
    },
    productName: {
        width: '100%',
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '600',
        fontSize: 16,
        lineHeight: 16,
        color: COLORS.black,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 0,
        gap: 8,
        width: '100%',
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
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusDotActive: {
        backgroundColor: COLORS.primary,
    },
    statusDotInactive: {
        backgroundColor: COLORS.textSecondary,
    },
    statusText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 12,
        lineHeight: 14,
        color: COLORS.black,
    },
    stockText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 14,
        lineHeight: 17,
        color: COLORS.black,
    },
    buttonSection: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        width: '100%',
    },
    editButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        gap: 8,
        width: '100%',
        height: 40,
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 8,
    },
    editButtonText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 16,
        color: COLORS.black,
    },
});
