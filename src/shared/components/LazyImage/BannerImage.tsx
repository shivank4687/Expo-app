import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { LazyImage } from './LazyImage';
import { getAbsoluteImageUrl } from '@/shared/utils/imageUtils';

interface BannerImageProps {
    imageUrl?: string;
    style?: StyleProp<ViewStyle>;
    onError?: () => void;
    priority?: 'low' | 'normal' | 'high';
}

/**
 * BannerImage Component
 * Specialized LazyImage for banner/carousel images with automatic URL handling
 * Uses high priority for above-the-fold content
 * 
 * @example
 * ```tsx
 * <BannerImage 
 *   imageUrl={banner.image}
 *   style={styles.bannerImage}
 *   priority="high"
 * />
 * ```
 */
export const BannerImage: React.FC<BannerImageProps> = ({
    imageUrl,
    style,
    onError,
    priority = 'high',
}) => {
    const absoluteUrl = getAbsoluteImageUrl(imageUrl);

    return (
        <LazyImage
            source={absoluteUrl}
            style={style}
            contentFit="cover"
            transition={{ duration: 300 }}
            cachePolicy="memory-disk"
            priority={priority}
            onError={onError}
            placeholderIcon="images-outline"
            accessibilityLabel="Banner image"
        />
    );
};

