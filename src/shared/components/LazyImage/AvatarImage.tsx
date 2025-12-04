import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { LazyImage } from './LazyImage';
import { getAbsoluteImageUrl } from '@/shared/utils/imageUtils';

interface AvatarImageProps {
    imageUrl?: string;
    style?: StyleProp<ViewStyle>;
    onError?: () => void;
    size?: number;
}

/**
 * AvatarImage Component
 * Specialized LazyImage for user avatars with automatic URL handling
 * 
 * @example
 * ```tsx
 * <AvatarImage 
 *   imageUrl={user.avatar}
 *   style={styles.avatar}
 *   size={100}
 * />
 * ```
 */
export const AvatarImage: React.FC<AvatarImageProps> = ({
    imageUrl,
    style,
    onError,
    size = 100,
}) => {
    const absoluteUrl = getAbsoluteImageUrl(imageUrl);

    return (
        <LazyImage
            source={absoluteUrl}
            style={style}
            contentFit="cover"
            transition={{ duration: 200 }}
            cachePolicy="memory-disk"
            priority="high"
            onError={onError}
            placeholderIcon="person-outline"
            placeholderIconSize={size * 0.5}
            accessibilityLabel="User avatar"
        />
    );
};

