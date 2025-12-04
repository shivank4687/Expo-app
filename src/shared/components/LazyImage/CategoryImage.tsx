import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { LazyImage } from './LazyImage';
import { getAbsoluteImageUrl } from '@/shared/utils/imageUtils';

interface CategoryImageProps {
    imageUrl?: string;
    style?: StyleProp<ViewStyle>;
    onError?: () => void;
    priority?: 'low' | 'normal' | 'high';
}

/**
 * CategoryImage Component
 * Specialized LazyImage for category images with automatic URL handling
 * 
 * @example
 * ```tsx
 * <CategoryImage 
 *   imageUrl={category.image}
 *   style={styles.categoryImage}
 * />
 * ```
 */
export const CategoryImage: React.FC<CategoryImageProps> = ({
    imageUrl,
    style,
    onError,
    priority = 'normal',
}) => {
    const absoluteUrl = getAbsoluteImageUrl(imageUrl);

    return (
        <LazyImage
            source={absoluteUrl}
            style={style}
            contentFit="cover"
            transition={{ duration: 200 }}
            cachePolicy="memory-disk"
            priority={priority}
            onError={onError}
            placeholderIcon="grid-outline"
            accessibilityLabel="Category image"
        />
    );
};

