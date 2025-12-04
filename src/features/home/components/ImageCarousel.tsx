import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    ScrollView,
    Dimensions,
    TouchableOpacity,
    StyleSheet,
    Linking,
} from 'react-native';
import { ImageCarouselOptions } from '@/types/theme.types';
import { theme } from '@/theme';
import { BannerImage } from '@/shared/components/LazyImage';

interface ImageCarouselProps {
    options: ImageCarouselOptions;
}

const AUTO_PLAY_INTERVAL = 4000;
const SCROLL_EVENT_THROTTLE = 16;

/**
 * ImageCarousel Component
 * Auto-rotating image carousel with pagination dots
 * Supports clickable images with external links
 */
export const ImageCarousel: React.FC<ImageCarouselProps> = ({ options }) => {
    const { width: screenWidth } = Dimensions.get('window');
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollViewRef = useRef<ScrollView>(null);
    const images = options.images || [];

    useEffect(() => {
        if (images.length <= 1) return;

        const interval = setInterval(() => {
            setActiveIndex((prevIndex) => {
                const nextIndex = (prevIndex + 1) % images.length;
                scrollViewRef.current?.scrollTo({
                    x: nextIndex * screenWidth,
                    animated: true,
                });
                return nextIndex;
            });
        }, AUTO_PLAY_INTERVAL);

        return () => clearInterval(interval);
    }, [images.length, screenWidth]);

    const handleScroll = useCallback((event: any) => {
        const contentOffsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(contentOffsetX / screenWidth);
        setActiveIndex(index);
    }, [screenWidth]);

    const handleImagePress = useCallback((link?: string) => {
        if (!link) return;
        
        Linking.openURL(link).catch((err) =>
            console.error('[ImageCarousel] Failed to open link:', err)
        );
    }, []);

    if (images.length === 0) return null;

    return (
        <View style={styles.container}>
            <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={SCROLL_EVENT_THROTTLE}
            >
                {images.map((image, index) => (
                    <TouchableOpacity
                        key={`carousel-${index}`}
                        style={[styles.imageContainer, { width: screenWidth }]}
                        onPress={() => handleImagePress(image.link)}
                        activeOpacity={image.link ? 0.8 : 1}
                        disabled={!image.link}
                    >
                        <BannerImage
                            imageUrl={image.image}
                            style={styles.image}
                            priority={index === 0 ? 'high' : 'normal'}
                        />
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {images.length > 1 ? (
                <View style={styles.paginationContainer}>
                    {images.map((_, index) => (
                        <View
                            key={`dot-${index}`}
                            style={[
                                styles.paginationDot,
                                index === activeIndex && styles.paginationDotActive,
                            ]}
                        />
                    ))}
                </View>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: theme.spacing.lg,
    },
    imageContainer: {
        aspectRatio: 2.743,
        width: '100%',
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    paginationContainer: {
        position: 'absolute',
        bottom: theme.spacing.md,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        marginHorizontal: 4,
        borderWidth: 0.5,
        borderColor: 'rgba(0, 0, 0, 0.2)',
    },
    paginationDotActive: {
        backgroundColor: theme.colors.primary[500],
        width: 24,
        height: 8,
        borderRadius: 4,
        borderWidth: 0,
    },
});

