import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Image, Dimensions, TouchableOpacity } from 'react-native';
import { ProductImage } from '../types/product.types';
import { theme } from '@/theme';

const { width } = Dimensions.get('window');
const IMAGE_HEIGHT = 400;

interface ProductGalleryProps {
    images: ProductImage[];
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({ images }) => {
    const [activeIndex, setActiveIndex] = useState(0);

    const handleScroll = (event: any) => {
        const slideSize = event.nativeEvent.layoutMeasurement.width;
        const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
        setActiveIndex(index);
    };

    const imageUrls = images.length > 0
        ? images.map(img => img.url)
        : ['https://via.placeholder.com/400'];

    return (
        <View style={styles.container}>
            <FlatList
                data={imageUrls}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                keyExtractor={(item, index) => `image-${index}`}
                renderItem={({ item }) => (
                    <Image
                        source={{ uri: item }}
                        style={styles.image}
                        resizeMode="cover"
                    />
                )}
            />

            {/* Pagination Dots */}
            {imageUrls.length > 1 && (
                <View style={styles.pagination}>
                    {imageUrls.map((_, index) => (
                        <View
                            key={`dot-${index}`}
                            style={[
                                styles.dot,
                                index === activeIndex && styles.activeDot,
                            ]}
                        />
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width,
        height: IMAGE_HEIGHT,
        backgroundColor: theme.colors.neutral[100],
    },
    image: {
        width,
        height: IMAGE_HEIGHT,
    },
    pagination: {
        flexDirection: 'row',
        position: 'absolute',
        bottom: theme.spacing.lg,
        alignSelf: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.white,
        opacity: 0.5,
        marginHorizontal: theme.spacing.xs,
    },
    activeDot: {
        opacity: 1,
        width: 24,
    },
});

export default ProductGallery;
