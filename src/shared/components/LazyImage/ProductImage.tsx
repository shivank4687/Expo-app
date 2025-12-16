import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { LazyImage } from './LazyImage';
import { getAbsoluteImageUrl } from '@/shared/utils/imageUtils';

interface ProductImageProps {
    imageUrl?: string;
    style?: StyleProp<ViewStyle>;
    onError?: () => void;
    priority?: 'low' | 'normal' | 'high';
    recyclingKey?: string;
}

/**
 * ProductImage Component
 * Specialized LazyImage for product images with automatic URL handling
 * 
 * @example
 * ```tsx
 * <ProductImage 
 *   imageUrl={product.base_image?.large_image_url}
 *   style={styles.productImage}
 * />
 * ```
 */
export const ProductImage: React.FC<ProductImageProps> = ({
    imageUrl,
    style,
    onError,
    priority = 'normal',
    recyclingKey,
}) => {
    const absoluteUrl = getAbsoluteImageUrl(imageUrl);

    return (
        <LazyImage
            source={absoluteUrl}
            style={style}
            contentFit="contain"
            transition={{ duration: 200 }}
            cachePolicy="memory-disk"
            priority={priority}
            recyclingKey={recyclingKey}
            onError={onError}
            placeholderIcon="cube-outline"
            accessibilityLabel="Product image"
        />
    );
};

