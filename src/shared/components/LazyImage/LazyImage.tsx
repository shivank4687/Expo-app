import React, { useState } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Image, ImageContentFit, ImageTransition } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';

export interface LazyImageProps {
    source: string | { uri: string } | number;
    style?: StyleProp<ViewStyle>;
    contentFit?: ImageContentFit;
    transition?: ImageTransition | number;
    placeholder?: string;
    placeholderContentFit?: ImageContentFit;
    cachePolicy?: 'none' | 'disk' | 'memory' | 'memory-disk';
    priority?: 'low' | 'normal' | 'high';
    recyclingKey?: string;
    onError?: () => void;
    showPlaceholderOnError?: boolean;
    placeholderIcon?: keyof typeof Ionicons.glyphMap;
    placeholderIconSize?: number;
    placeholderIconColor?: string;
    accessibilityLabel?: string;
}

/**
 * LazyImage Component
 * A performant image component with lazy loading, caching, and error handling
 * Uses expo-image which provides better performance than React Native's Image
 * 
 * Features:
 * - Automatic lazy loading (loads when in viewport)
 * - Memory and disk caching
 * - Smooth transitions
 * - Error handling with placeholder
 * - Progressive loading with blur hash support
 * - Automatic image recycling for lists
 * 
 * @example
 * ```tsx
 * <LazyImage 
 *   source={{ uri: imageUrl }}
 *   style={styles.image}
 *   contentFit="cover"
 * />
 * ```
 */
export const LazyImage: React.FC<LazyImageProps> = ({
    source,
    style,
    contentFit = 'cover',
    transition = { duration: 200 },
    placeholder,
    placeholderContentFit = 'cover',
    cachePolicy = 'memory-disk',
    priority = 'normal',
    recyclingKey,
    onError,
    showPlaceholderOnError = true,
    placeholderIcon = 'image-outline',
    placeholderIconSize = 40,
    placeholderIconColor,
    accessibilityLabel,
}) => {
    const [hasError, setHasError] = useState(false);

    const handleError = () => {
        setHasError(true);
        onError?.();
    };

    // Convert source to uri format if needed
    const imageSource = typeof source === 'string' 
        ? { uri: source }
        : typeof source === 'number'
        ? source
        : source;

    // Normalize transition prop
    const normalizedTransition = typeof transition === 'number' 
        ? { duration: transition }
        : transition;

    // Show placeholder if error occurred
    if (hasError && showPlaceholderOnError) {
        return (
            <View style={[styles.errorContainer, style]}>
                <Ionicons 
                    name={placeholderIcon}
                    size={placeholderIconSize} 
                    color={placeholderIconColor || theme.colors.gray[400]} 
                />
            </View>
        );
    }

    return (
        <Image
            source={imageSource}
            style={style}
            contentFit={contentFit}
            transition={normalizedTransition}
            placeholder={placeholder}
            placeholderContentFit={placeholderContentFit}
            cachePolicy={cachePolicy}
            priority={priority}
            recyclingKey={recyclingKey}
            onError={handleError}
            accessibilityLabel={accessibilityLabel}
        />
    );
};

const styles = StyleSheet.create({
    errorContainer: {
        backgroundColor: theme.colors.gray[100],
        justifyContent: 'center',
        alignItems: 'center',
    },
});

