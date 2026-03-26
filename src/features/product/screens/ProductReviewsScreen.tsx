import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ErrorMessage } from '@/shared/components/ErrorMessage';
import { reviewsApi } from '@/services/api/reviews.api';
import { ProductReview } from '../types/review.types';
import { theme } from '@/theme';
import { useAppSelector } from '@/store/hooks';
import { TopHeader } from '@/shared/components';

export const ProductReviewsScreen: React.FC = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const productId = Number(id);
    const hasValidId = !Number.isNaN(productId);
    const { isAuthenticated } = useAppSelector((state) => state.auth);
    const insets = useSafeAreaInsets();

    const [reviews, setReviews] = useState<ProductReview[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalReviews, setTotalReviews] = useState(0);
    const [averageRating, setAverageRating] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setReviews([]);
        setHasMore(false);
        setCurrentPage(1);
        setTotalReviews(0);
        setAverageRating(0);
        setError(null);

        if (!hasValidId) {
            setError('Unable to find product reviews');
            return;
        }

        loadReviews(1);
    }, [productId]);

    const computeAverageRating = (metaAverage: any, records: ProductReview[]) => {
        if (typeof metaAverage === 'number') return metaAverage;
        if (typeof metaAverage === 'string') {
            const parsed = Number(metaAverage);
            if (!Number.isNaN(parsed)) return parsed;
        }

        if (records.length === 0) return 0;

        const total = records.reduce((acc, review) => acc + Number(review.rating || 0), 0);
        return total / records.length;
    };

    const deriveTotalCount = (meta: any, records: ProductReview[]) => {
        const candidates = [
            meta?.total,
            meta?.total_reviews,
            meta?.pagination?.total,
            meta?.pagination?.total_items,
        ];

        for (const candidate of candidates) {
            if (typeof candidate === 'number') {
                return candidate;
            }
            if (typeof candidate === 'string') {
                const parsed = Number(candidate);
                if (!Number.isNaN(parsed)) {
                    return parsed;
                }
            }
        }

        return records.length;
    };

    const hasNextPage = (meta: any, links: any) => {
        if (links?.next || links?.next_page_url) return true;
        if (meta?.pagination) {
            const current = meta.pagination.current_page;
            const total = meta.pagination.total_pages || meta.pagination.total;
            if (typeof current === 'number' && typeof total === 'number') {
                return current < total;
            }
        }
        return false;
    };

    const loadReviews = async (page: number = 1, refresh: boolean = false) => {
        if (!hasValidId) return;
        if (isLoading || isRefreshing || isLoadingMore) return;

        if (refresh) {
            setIsRefreshing(true);
        } else if (page === 1) {
            setIsLoading(true);
        } else {
            setIsLoadingMore(true);
        }

        try {
            const response = await reviewsApi.getProductReviews(productId, page);
            const reviewsData = response.data || response;
            const reviewsList = Array.isArray(reviewsData)
                ? reviewsData
                : reviewsData?.data || [];
            const meta = response?.meta || reviewsData?.meta || response?.pagination || reviewsData?.pagination;
            const links = response?.links || meta?.links || meta?.pagination?.links || reviewsData?.links;

            const combinedReviews = page === 1 ? reviewsList : [...reviews, ...reviewsList];

            setReviews(combinedReviews);
            setCurrentPage(page);
            setAverageRating(computeAverageRating(meta?.average_rating ?? meta?.rating_average ?? meta?.avg_rating, combinedReviews));
            setTotalReviews(deriveTotalCount(meta, combinedReviews));
            setHasMore(hasNextPage(meta, links));
            setError(null);
        } catch (err) {
            console.error('Failed to load product reviews:', err);
            setError('Failed to load reviews');
        } finally {
            if (refresh) {
                setIsRefreshing(false);
            } else if (page === 1) {
                setIsLoading(false);
            } else {
                setIsLoadingMore(false);
            }
        }
    };

    const handleRefresh = () => {
        loadReviews(1, true);
    };

    const handleLoadMore = () => {
        if (!hasMore || isLoadingMore || isLoading) return;
        loadReviews(currentPage + 1);
    };

    const handleWriteReview = () => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        router.push(`/product/${productId}/write-review` as any);
    };

    const renderReviewItem = ({ item }: { item: ProductReview }) => (
        <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
                <Text style={styles.reviewTitle}>{item.title}</Text>
                <View style={styles.ratingBadge}>
                    <Text style={styles.ratingText}>{Number(item.rating).toFixed(1)}</Text>
                    <Ionicons name="star" size={14} color={theme.colors.warning.main} />
                </View>
            </View>
            <View style={styles.metaRow}>
                <Text style={styles.reviewerName}>{item.name}</Text>
                <Text style={styles.reviewDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.reviewComment}>{item.comment}</Text>
        </View>
    );

    const renderFooter = () => {
        if (!hasMore) return null;
        return (
            <TouchableOpacity
                style={styles.loadMoreButton}
                onPress={handleLoadMore}
                disabled={isLoadingMore}
            >
                {isLoadingMore ? (
                    <ActivityIndicator size="small" color={theme.colors.primary[500]} />
                ) : (
                    <Text style={styles.loadMoreText}>Load more reviews</Text>
                )}
            </TouchableOpacity>
        );
    };

    const renderEmpty = () => (
        <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={52} color={theme.colors.gray[400]} />
            <Text style={styles.emptyTitle}>No reviews yet.</Text>
            <Text style={styles.emptySubtitle}>Be the first to leave feedback for this product.</Text>
        </View>
    );

    const subtitle = totalReviews > 0
        ? `${averageRating.toFixed(1)} avg • ${totalReviews} reviews`
        : undefined;

    return (
        <View style={styles.screen}>
            <TopHeader
                title="Product Reviews"
                subtitle={subtitle}
                onBack={() => router.back()}
            />
            <View style={[styles.body, { paddingBottom: Math.max(insets.bottom, theme.spacing.md) }]}>
                {error ? (
                    <ErrorMessage message={error} onRetry={() => loadReviews(1)} />
                ) : isLoading && reviews.length === 0 ? (
                    <View style={styles.loaderWrapper}>
                        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
                    </View>
                ) : (
                    <>
                        <View style={styles.listWrapper}>
                            <FlatList
                                data={reviews}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={renderReviewItem}
                                ItemSeparatorComponent={() => <View style={styles.itemDivider} />}
                                contentContainerStyle={styles.listContent}
                                refreshControl={
                                    <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
                                }
                                ListFooterComponent={renderFooter}
                                ListEmptyComponent={renderEmpty}
                                showsVerticalScrollIndicator={false}
                            />
                        </View>
                        {isAuthenticated && (
                            <TouchableOpacity
                                style={styles.writeReviewButton}
                                onPress={handleWriteReview}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="create-outline" size={18} color="#1E3A8A" />
                                <Text style={styles.writeReviewText}>Write a Review</Text>
                            </TouchableOpacity>
                        )}
                    </>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: theme.colors.background.default,
    },
    body: {
        flex: 1,
        paddingHorizontal: theme.spacing.md,
    },
    listWrapper: {
        flex: 1,
    },
    listContent: {
        paddingBottom: theme.spacing.lg,
    },
    loaderWrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    reviewCard: {
        backgroundColor: theme.colors.white,
        borderRadius: 14,
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.gray[200],
    },
    reviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.sm,
    },
    reviewTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.primary,
        flex: 1,
        marginRight: theme.spacing.md,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.sm,
    },
    reviewerName: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    reviewDate: {
        fontSize: 10,
        color: theme.colors.text.secondary,
    },
    reviewComment: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        lineHeight: 18,
    },
    itemDivider: {
        height: theme.spacing.sm,
    },
    loadMoreButton: {
        paddingVertical: theme.spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadMoreText: {
        color: '#1E3A8A',
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: theme.spacing.xl,
        paddingVertical: theme.spacing.lg,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text.primary,
        marginTop: theme.spacing.sm,
    },
    emptySubtitle: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginTop: theme.spacing.xs,
        textAlign: 'center',
    },
    writeReviewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: theme.spacing.md,
        marginTop: theme.spacing.md,
        borderRadius: 10,
        backgroundColor: theme.colors.white,
        borderWidth: 1,
        borderColor: '#1E3A8A',
    },
    writeReviewText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E3A8A',
    },
});
