import { Ionicons } from '@expo/vector-icons';
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { ProductImage as ProductImageType, ProductVideo as ProductVideoType } from '../types/product.types';
import { ProductImage } from '@/shared/components/LazyImage';
import { theme } from '@/theme';
import { PriceBadge } from './PriceBadge';
import { DiscountBadge } from './DiscountBadge';
import { useAppSelector } from '@/store/hooks';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { WebView } from 'react-native-webview';

const { width } = Dimensions.get('window');
const IMAGE_HEIGHT = 400;
const THUMBNAIL_SIZE = 60;
const THUMBNAIL_SPACING = 8;

interface ProductGalleryProps {
    images: ProductImageType[];
    videos?: ProductVideoType[];
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

const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const getWebViewSource = (url: string) => {
    // 1. YouTube
    const ytId = getYoutubeId(url);
    if (ytId) {
        return { uri: `https://www.youtube.com/embed/${ytId}?autoplay=1` };
    }
    
    // 2. Vimeo
    const vimeoRegex = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/;
    const vimeoMatch = url.match(vimeoRegex);
    if (vimeoMatch && vimeoMatch[3]) {
        return { uri: `https://player.vimeo.com/video/${vimeoMatch[3]}?autoplay=1` };
    }
    
    // 3. Direct video URLs (S3 etc.) wrapped in HTML5 player to bypass direct load blocks (403s)
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
            <style>
                body, html {
                    margin: 0;
                    padding: 0;
                    width: 100%;
                    height: 100%;
                    background-color: #000;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    overflow: hidden;
                    position: relative;
                }
                video {
                    width: 100%;
                    height: 100%;
                    max-height: 100%;
                    object-fit: contain;
                    z-index: 1;
                }
                .spinner-container {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    z-index: 10;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }
                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 4px solid rgba(255, 255, 255, 0.1);
                    border-left-color: #00615E; /* Teal primary color */
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        </head>
        <body>
            <div id="spinner" class="spinner-container">
                <div class="spinner"></div>
            </div>
            
            <video 
                id="videoPlayer"
                controls 
                autoplay 
                playsinline
                oncanplay="document.getElementById('spinner').style.display='none';"
                onplaying="document.getElementById('spinner').style.display='none';"
                onwaiting="document.getElementById('spinner').style.display='flex';"
                onseeking="document.getElementById('spinner').style.display='flex';"
                onseeked="document.getElementById('spinner').style.display='none';"
            >
                <source src="${url}" type="video/mp4">
                Your browser does not support the video tag.
            </video>
        </body>
        </html>
    `;
    
    return { html: htmlContent, baseUrl: url };
};

export const ProductGallery: React.FC<ProductGalleryProps> = ({
    images,
    videos = [],
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
    const router = useRouter();
    const { t } = useTranslation();
    const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
    const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const mainGalleryRef = useRef<FlatList>(null);
    const isProgrammaticScroll = useRef(false);

    // Reset index and scroll position when the images list changes (e.g. variant is selected/switched)
    useEffect(() => {
        setActiveIndex(0);
        isProgrammaticScroll.current = true;
        mainGalleryRef.current?.scrollToOffset({ offset: 0, animated: false });
        const timer = setTimeout(() => {
            isProgrammaticScroll.current = false;
        }, 100);
        return () => clearTimeout(timer);
    }, [images]);

    const handleScroll = (event: any) => {
        if (isProgrammaticScroll.current) return;
        const slideSize = event.nativeEvent.layoutMeasurement.width;
        const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
        setActiveIndex(index);
    };

    const handleThumbnailPress = (index: number) => {
        if (index === activeIndex) return;
        isProgrammaticScroll.current = true;
        setActiveIndex(index);
        mainGalleryRef.current?.scrollToIndex({ index, animated: true });
    };

    const handleMomentumScrollEnd = (event: any) => {
        isProgrammaticScroll.current = false;
        const slideSize = event.nativeEvent.layoutMeasurement.width;
        const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
        setActiveIndex(index);
    };

    const handleScrollBeginDrag = () => {
        isProgrammaticScroll.current = false;
    };

    const galleryItems = useMemo(() => {
        const items: Array<{ type: 'image' | 'video'; url: string; thumbnail: string }> = [];

        images.forEach(img => {
            items.push({
                type: 'image',
                url: img.url,
                thumbnail: img.url
            });
        });

        if (videos && videos.length > 0) {
            videos.forEach(vid => {
                let thumbUrl = 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=200&auto=format&fit=crop'; // fallback video thumbnail
                const ytId = getYoutubeId(vid.url);
                if (ytId) {
                    thumbUrl = `https://img.youtube.com/vi/${ytId}/0.jpg`;
                }
                items.push({
                    type: 'video',
                    url: vid.url,
                    thumbnail: thumbUrl
                });
            });
        }

        return items;
    }, [images, videos]);

    const activeItems = galleryItems.length > 0
        ? galleryItems
        : [{ type: 'image' as const, url: 'https://via.placeholder.com/400', thumbnail: 'https://via.placeholder.com/400' }];

    return (
        <View style={styles.container}>
            {/* Main Image Gallery */}
            <View style={styles.mainGalleryContainer}>
                <FlatList
                    ref={mainGalleryRef}
                    data={activeItems}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={handleScroll}
                    onMomentumScrollEnd={handleMomentumScrollEnd}
                    onScrollBeginDrag={handleScrollBeginDrag}
                    scrollEventThrottle={16}
                    keyExtractor={(item, index) => `${item.type}-${index}`}
                    renderItem={({ item, index }) => (
                        <View style={styles.imageContainer}>
                            <ProductImage
                                imageUrl={item.thumbnail}
                                style={styles.image}
                                recyclingKey={`product-gallery-${index}`}
                                priority={index === 0 ? 'high' : 'normal'}
                            />
                            {item.type === 'video' && (
                                <TouchableOpacity
                                    style={styles.playOverlay}
                                    onPress={() => setSelectedVideoUrl(item.url)}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.playButtonCircle}>
                                        <Ionicons name="play" size={32} color={theme.colors.white} style={{ marginLeft: 4 }} />
                                    </View>
                                </TouchableOpacity>
                            )}
                        </View>
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

                {/* Price and Guest Login Badges */}
                <View style={styles.rightBadgesContainer}>
                    {!isAuthenticated && (
                        <TouchableOpacity
                            style={styles.wholesaleLoginBadge}
                            onPress={() => router.push('/login')}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="lock-closed-outline" size={12} color={theme.colors.white} />
                            <Text style={styles.wholesaleLoginText}>
                                {t('product.loginToViewWholesale')}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {formattedPrice ? (
                        <PriceBadge
                            priceLabel={priceLabel}
                            formattedPrice={formattedPrice}
                            formattedRegularPrice={formattedRegularPrice}
                        />
                    ) : null}
                </View>
            </View>

            {/* Thumbnail Navigation */}
            {activeItems.length > 1 && (
                <View style={styles.thumbnailContainer}>
                    <FlatList
                        data={activeItems}
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
                                <View style={{ position: 'relative', width: '100%', height: '100%' }}>
                                    <ProductImage
                                        imageUrl={item.thumbnail}
                                        style={styles.thumbnail}
                                        recyclingKey={`thumbnail-${index}`}
                                        priority="normal"
                                    />
                                    {item.type === 'video' && (
                                        <View style={styles.thumbnailVideoBadge}>
                                            <Ionicons name="videocam" size={10} color={theme.colors.white} />
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}

            {/* Video Player Modal */}
            <Modal
                visible={selectedVideoUrl !== null}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedVideoUrl(null)}
            >
                <View style={styles.modalBackground}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setSelectedVideoUrl(null)}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="close-circle" size={36} color={theme.colors.white} />
                        </TouchableOpacity>
                        
                        {selectedVideoUrl && (
                            <View style={styles.videoPlayerContainer}>
                                <WebView
                                    source={getWebViewSource(selectedVideoUrl)}
                                    style={styles.videoPlayer}
                                    allowsFullscreenVideo={true}
                                    mediaPlaybackRequiresUserAction={false}
                                    javaScriptEnabled={true}
                                    domStorageEnabled={true}
                                    startInLoadingState={true}
                                    onError={(syntheticEvent) => {
                                        const { nativeEvent } = syntheticEvent;
                                        console.warn('🎥 WebView error payload:', JSON.stringify(nativeEvent, null, 2));
                                    }}
                                    onHttpError={(syntheticEvent) => {
                                        const { nativeEvent } = syntheticEvent;
                                        console.warn('🎥 WebView HTTP error payload:', JSON.stringify(nativeEvent, null, 2));
                                    }}
                                    onNavigationStateChange={(navState) => {
                                        console.log('🎥 WebView Navigation State:', JSON.stringify(navState, null, 2));
                                    }}
                                    renderLoading={() => (
                                        <ActivityIndicator
                                            size="large"
                                            color={theme.colors.primary[500]}
                                            style={styles.videoLoader}
                                        />
                                    )}
                                />
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
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
    rightBadgesContainer: {
        position: 'absolute',
        bottom: theme.spacing.lg,
        right: theme.spacing.lg,
        alignItems: 'flex-end',
        gap: theme.spacing.xs,
        zIndex: 10,
    },
    wholesaleLoginBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0, 97, 94, 0.9)', // Teal primary color with opacity
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.full,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    wholesaleLoginText: {
        fontSize: 10,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.white,
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
    imageContainer: {
        width,
        height: IMAGE_HEIGHT,
        position: 'relative',
    },
    playOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    playButtonCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.colors.white,
    },
    thumbnailVideoBadge: {
        position: 'absolute',
        top: 2,
        right: 2,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        padding: 2,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    closeButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        zIndex: 20,
        padding: 10,
    },
    videoPlayerContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: '#000',
    },
    videoPlayer: {
        flex: 1,
    },
    videoLoader: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: [{ translateX: -20 }, { translateY: -20 }],
    },
});

export default ProductGallery;
