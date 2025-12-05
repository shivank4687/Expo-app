import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity } from 'react-native';
import { ProductImage as ProductImageType } from '../types/product.types';
import { ProductImage } from '@/shared/components/LazyImage';
import { theme } from '@/theme';

const { width } = Dimensions.get('window');
const IMAGE_HEIGHT = 400;
const THUMBNAIL_SIZE = 60;
const THUMBNAIL_SPACING = 8;

interface ProductGalleryProps {
    images: ProductImageType[];
    isOnSale?: boolean;
    isNew?: boolean;
    inStock?: boolean;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({ 
    images, 
    isOnSale = false, 
    isNew = false, 
    inStock = true 
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

                {/* Out of Stock Badge */}
                {!inStock ? (
                    <View style={styles.outOfStockBadge}>
                        <Text style={styles.outOfStockText}>Out of Stock</Text>
                    </View>
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
