/**
 * MediaGalleryModal
 * A reusable full-screen modal for browsing images and videos.
 *
 * Features:
 *  - Horizontal swipe between media items (pagingEnabled FlatList)
 *  - Images rendered with LazyImage (expo-image, cached, contain fit)
 *  - Video items show a branded placeholder (full video playback requires expo-av)
 *  - Thumbnail strip at the bottom for quick-jump navigation
 *  - Slide counter (e.g. "2 / 5")
 *  - Safe-area-aware close button
 *
 * Usage:
 *  const media: MediaItem[] = [
 *    { type: 'image', url: 'https://...' },
 *    { type: 'video', url: 'https://...file.mp4' },
 *  ];
 *  <MediaGalleryModal
 *    visible={showGallery}
 *    media={media}
 *    initialIndex={0}
 *    onClose={() => setShowGallery(false)}
 *  />
 */

import { LazyImage } from '@/shared/components/LazyImage';
import { theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Modal,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewToken,
} from 'react-native';

// ─── Types ───────────────────────────────────────────────────────────────────

export type MediaItem =
    | { type: 'image'; url: string }
    | { type: 'video'; url: string };

export interface MediaGalleryModalProps {
    /** Whether the modal is visible */
    visible: boolean;
    /** Array of image/video items to display */
    media: MediaItem[];
    /** Index of the item to show first (default: 0) */
    initialIndex?: number;
    /** Called when the user dismisses the modal */
    onClose: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const THUMBNAIL_SIZE = 56;
const THUMBNAIL_SPACING = 6;

// ─── MediaGalleryModal ───────────────────────────────────────────────────────

export const MediaGalleryModal: React.FC<MediaGalleryModalProps> = ({
    visible,
    media,
    initialIndex = 0,
    onClose,
}) => {
    const [activeIndex, setActiveIndex] = useState(initialIndex);

    const mainListRef = useRef<FlatList>(null);
    const thumbListRef = useRef<FlatList>(null);

    // Reset when modal opens
    useEffect(() => {
        if (visible) {
            setActiveIndex(initialIndex);
        }
    }, [visible, initialIndex]);

    // Scroll thumbnail strip to keep active thumb centred
    useEffect(() => {
        if (media.length > 1) {
            thumbListRef.current?.scrollToIndex({
                index: activeIndex,
                animated: true,
                viewPosition: 0.5,
            });
        }
    }, [activeIndex, media.length]);

    const onViewableItemsChanged = useCallback(
        ({ viewableItems }: { viewableItems: ViewToken[] }) => {
            if (viewableItems.length > 0 && viewableItems[0].index !== null) {
                setActiveIndex(viewableItems[0].index!);
            }
        },
        []
    );

    const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 });

    const handleThumbnailPress = (index: number) => {
        setActiveIndex(index);
        mainListRef.current?.scrollToIndex({ index, animated: true });
    };

    // ── Render helpers ────────────────────────────────────────────────────

    const renderMediaItem = ({ item, index }: { item: MediaItem; index: number }) => {
        if (item.type === 'video') {
            // Video placeholder — install expo-av and extend this block for playback
            return (
                <View style={styles.mediaSlide}>
                    <View style={styles.videoPlaceholder}>
                        <View style={styles.videoPlayButton}>
                            <Ionicons name="videocam" size={48} color={theme.colors.white} />
                        </View>
                        <Text style={styles.videoPlaceholderText}>Video</Text>
                        <Text style={styles.videoPlaceholderSubText}>
                            {item.url.split('/').pop()}
                        </Text>
                    </View>
                    {/* VIDEO badge */}
                    <View style={styles.videoBadge}>
                        <Ionicons name="videocam" size={12} color={theme.colors.white} />
                        <Text style={styles.videoBadgeText}>VIDEO</Text>
                    </View>
                </View>
            );
        }

        return (
            <View style={styles.mediaSlide}>
                <LazyImage
                    source={item.url}
                    style={styles.fullImage}
                    contentFit="contain"
                    recyclingKey={`gallery-${index}`}
                    priority={index === activeIndex ? 'high' : 'normal'}
                />
            </View>
        );
    };

    const renderThumbnail = ({ item, index }: { item: MediaItem; index: number }) => {
        const isActive = index === activeIndex;
        return (
            <TouchableOpacity
                style={[styles.thumbnail, isActive && styles.thumbnailActive]}
                onPress={() => handleThumbnailPress(index)}
                activeOpacity={0.7}
            >
                {item.type === 'video' ? (
                    <View style={styles.thumbnailVideoPlaceholder}>
                        <Ionicons name="videocam" size={20} color={theme.colors.white} />
                    </View>
                ) : (
                    <LazyImage
                        source={item.url}
                        style={styles.thumbnailImage}
                        contentFit="cover"
                        recyclingKey={`thumb-${index}`}
                        priority="low"
                    />
                )}
            </TouchableOpacity>
        );
    };

    if (!media || media.length === 0) return null;

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={false}
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <StatusBar barStyle="light-content" backgroundColor="#000" />
            <View style={styles.container}>
                {/* ── Header ────────────────────────────────────────────── */}
                <SafeAreaView style={styles.header}>
                    <View style={styles.headerInner}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        >
                            <Ionicons name="close" size={24} color={theme.colors.white} />
                        </TouchableOpacity>

                        {media.length > 1 && (
                            <View style={styles.counter}>
                                <Text style={styles.counterText}>
                                    {activeIndex + 1} / {media.length}
                                </Text>
                            </View>
                        )}
                    </View>
                </SafeAreaView>

                {/* ── Main swipeable viewer ──────────────────────────────── */}
                <FlatList
                    ref={mainListRef}
                    data={media}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(_, i) => `media-${i}`}
                    renderItem={renderMediaItem}
                    initialScrollIndex={initialIndex}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig.current}
                    getItemLayout={(_, index) => ({
                        length: SCREEN_WIDTH,
                        offset: SCREEN_WIDTH * index,
                        index,
                    })}
                    onScrollToIndexFailed={(info) => {
                        setTimeout(() => {
                            mainListRef.current?.scrollToIndex({
                                index: info.index,
                                animated: false,
                            });
                        }, 300);
                    }}
                    style={styles.mainList}
                />

                {/* ── Thumbnail strip ────────────────────────────────────── */}
                {media.length > 1 && (
                    <SafeAreaView style={styles.thumbnailContainer}>
                        <FlatList
                            ref={thumbListRef}
                            data={media}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.thumbnailList}
                            keyExtractor={(_, i) => `thumb-${i}`}
                            renderItem={renderThumbnail}
                            onScrollToIndexFailed={() => {}}
                        />
                    </SafeAreaView>
                )}
            </View>
        </Modal>
    );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },

    // Header
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    headerInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    counter: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        backgroundColor: 'rgba(0,0,0,0.45)',
        borderRadius: 20,
    },
    counterText: {
        color: theme.colors.white,
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semiBold,
    },

    // Main viewer
    mainList: {
        flex: 1,
    },
    mediaSlide: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullImage: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
    },

    // Video placeholder
    videoPlaceholder: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#111',
    },
    videoPlayButton: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    videoPlaceholderText: {
        color: theme.colors.white,
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        marginBottom: 4,
    },
    videoPlaceholderSubText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: theme.typography.fontSize.xs,
        maxWidth: SCREEN_WIDTH * 0.7,
        textAlign: 'center',
    },
    videoBadge: {
        position: 'absolute',
        top: 56,
        left: theme.spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0,0,0,0.55)',
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 3,
        borderRadius: 12,
    },
    videoBadgeText: {
        color: theme.colors.white,
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.bold,
        letterSpacing: 0.5,
    },

    // Thumbnails
    thumbnailContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingVertical: theme.spacing.sm,
    },
    thumbnailList: {
        paddingHorizontal: theme.spacing.md,
        gap: THUMBNAIL_SPACING,
        alignItems: 'center',
    },
    thumbnail: {
        width: THUMBNAIL_SIZE,
        height: THUMBNAIL_SIZE,
        borderRadius: theme.borderRadius.sm,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    thumbnailActive: {
        borderColor: theme.colors.primary[500],
    },
    thumbnailImage: {
        width: '100%',
        height: '100%',
    },
    thumbnailVideoPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#1a1a1a',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default MediaGalleryModal;
