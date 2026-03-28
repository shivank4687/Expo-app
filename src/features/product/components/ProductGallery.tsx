import { Ionicons } from '@expo/vector-icons';
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity } from 'react-native';
import { ProductImage as ProductImageType } from '../types/product.types';
import { ProductImage } from '@/shared/components/LazyImage';
import { theme } from '@/theme';
import { PriceBadge } from './PriceBadge';
import { DiscountBadge } from './DiscountBadge';

const { width } = Dimensions.get('window');
const IMAGE_HEIGHT = 400;
const THUMBNAIL_SIZE = 60;
const THUMBNAIL_SPACING = 8;

interface ProductGalleryProps {
    images: ProductImageType[];
    isOnSale?: boolean;
    isNew?: boolean;
    inStock?: boolean;
    priceLabel?: string;
    formattedPrice?: string;
    formattedRegularPrice?: string;
    discountPercent?: number;
    rating?: number;
    reviewCount?: number;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({
    images,
    isOnSale = false,
    isNew = false,
    inStock = true,
    priceLabel,
    formattedPrice,
    formattedRegularPrice,
    discountPercent,
    rating,
    reviewCount
}) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const mainGalleryRef = useRef<FlatList>(null);

    const handleScroll = (event: any) => {
        const slideSize = event.nativeEvent.layoutMeasurement.width;
        const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
        setActiveIndex(index);
    };

    const handleThumbnailPress = (index: number) => {
        setActiveIndex(index);
        mainGalleryRef.current?.scrollToIndex({ index, animated: true });
    };

    const imageUrls = images.length > 0
        ? images.map(img => img.url)
        : ['https://via.placeholder.com/400'];

    return (
        <View style={styles.container}>
            {/* Main Image Gallery */}
            <View style={styles.mainGalleryContainer}>
                <FlatList
                    ref={mainGalleryRef}
                    data={imageUrls}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    keyExtractor={(item, index) => `image-${index}`}
                    renderItem={({ item, index }) => (
                        <ProductImage
                            imageUrl={item}
                            style={styles.image}
                            recyclingKey={`product-gallery-${index}`}
                            priority={index === 0 ? 'high' : 'normal'}
                        />
                    )}
                    onScrollToIndexFailed={(info) => {
                        const wait = new Promise(resolve => setTimeout(resolve, 500));
                        wait.then(() => {
                            mainGalleryRef.current?.scrollToIndex({ index: info.index, animated: true });
                        });
                    }}
                />

                {/* Sale Badge - Shows when product is on sale */}
                {isOnSale && inStock ? (
                    <View style={styles.saleBadge}>
                        <Text style={styles.saleText}>SALE</Text>
                    </View>
                ) : null}

                {/* New Badge - Shows when product is new and not on sale */}
                {!isOnSale && isNew && inStock ? (
                    <View style={styles.newBadge}>
                        <Text style={styles.newText}>NEW</Text>
                    </View>
                ) : null}

                {/* Discount Badge */}
                {discountPercent && discountPercent > 0 ? (
                    <DiscountBadge
                        discountPercent={discountPercent}
                        style={styles.discountBadge}
                    />
                ) : null}

                {/* Review Badge */}
                {rating && rating > 0 && inStock ? (
                    <View style={styles.reviewBadge}>
                        <Ionicons name="star" size={12} color="#FFB800" />
                        <Text style={styles.ratingText}>{Number(rating).toFixed(1)}</Text>
                        {reviewCount && reviewCount > 0 ? (
                            <Text style={styles.reviewCountText}>({reviewCount})</Text>
                        ) : null}
                    </View>
                ) : null}

                {/* Out of Stock Badge */}
                {!inStock ? (
                    <View style={styles.outOfStockBadge}>
                        <Text style={styles.outOfStockText}>Out of Stock</Text>
                    </View>
                ) : null}

                {/* Price Badge */}
                {formattedPrice ? (
                    <PriceBadge
                        priceLabel={priceLabel}
                        formattedPrice={formattedPrice}
                        formattedRegularPrice={formattedRegularPrice}
                        style={styles.priceBadge}
                    />
                ) : null}
            </View>

            {/* Thumbnail Navigation */}
            {imageUrls.length > 1 && (
                <View style={styles.thumbnailContainer}>
                    <FlatList
                        data={imageUrls}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.thumbnailList}
                        keyExtractor={(item, index) => `thumbnail-${index}`}
                        renderItem={({ item, index }) => (
                            <TouchableOpacity
                                style={[
                                    styles.thumbnailWrapper,
                                    index === activeIndex && styles.thumbnailWrapperActive,
                                ]}
                                onPress={() => handleThumbnailPress(index)}
                                activeOpacity={0.7}
                            >
                                <ProductImage
                                    imageUrl={item}
                                    style={styles.thumbnail}
                                    recyclingKey={`thumbnail-${index}`}
                                    priority="normal"
                                />
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width,
        backgroundColor: theme.colors.neutral[100],
    },
    mainGalleryContainer: {
        position: 'relative',
        width,
        height: IMAGE_HEIGHT,
    },
    image: {
        width,
        height: IMAGE_HEIGHT,
    },
    saleBadge: {
        position: 'absolute',
        top: theme.spacing.lg,
        left: theme.spacing.lg,
        backgroundColor: '#DC2626', // Red color matching web app (bg-red-600)
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: 22, // Rounded pill shape (rounded-[44px])
        zIndex: 10,
    },
    saleText: {
        color: theme.colors.white,
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semiBold,
        textTransform: 'uppercase',
    },
    newBadge: {
        position: 'absolute',
        top: theme.spacing.lg,
        left: theme.spacing.lg,
        backgroundColor: '#1E3A8A', // Navy blue matching web app (bg-navyBlue)
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: 22, // Rounded pill shape (rounded-[44px])
        zIndex: 10,
    },
    newText: {
        color: theme.colors.white,
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semiBold,
        textTransform: 'uppercase',
    },
    discountBadge: {
        position: 'absolute',
        top: theme.spacing.lg,
        right: theme.spacing.lg,
        zIndex: 10,
    },
    outOfStockBadge: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: theme.spacing.md,
        alignItems: 'center',
        zIndex: 10,
    },
    outOfStockText: {
        color: theme.colors.white,
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.semiBold,
        textTransform: 'uppercase',
    },
    priceBadge: {
        position: 'absolute',
        bottom: theme.spacing.lg,
        right: theme.spacing.lg,
        zIndex: 10,
    },
    reviewBadge: {
        position: 'absolute',
        bottom: theme.spacing.lg,
        left: theme.spacing.lg,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.full,
        zIndex: 10,
        ...theme.shadows.sm,
    },
    ratingText: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
        marginLeft: 4,
    },
    reviewCountText: {
        fontSize: 10,
        color: theme.colors.text.secondary,
        marginLeft: 2,
    },
    thumbnailContainer: {
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        backgroundColor: theme.colors.white,
    },
    thumbnailList: {
        alignItems: 'center',
        gap: THUMBNAIL_SPACING,
    },
    thumbnailWrapper: {
        width: THUMBNAIL_SIZE,
        height: THUMBNAIL_SIZE,
        borderRadius: theme.borderRadius.sm,
        borderWidth: 2,
        borderColor: 'transparent',
        overflow: 'hidden',
        marginRight: THUMBNAIL_SPACING,
    },
    thumbnailWrapperActive: {
        borderColor: theme.colors.primary[500],
        borderWidth: 2,
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
});

export default ProductGallery;
