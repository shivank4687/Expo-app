import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { theme } from '@/theme';
import { ProductReview } from '../types/review.types';
import { reviewsApi } from '@/services/api/reviews.api';
import { useAppSelector } from '@/store/hooks';
import { Accordion } from '@/shared/components/Accordion';

interface ProductReviewsProps {
    productId: number;
    averageRating: number;
    totalReviews: number;
}

/**
 * ProductReviews Component
 * Displays customer reviews in an accordion with rating summary
 */
export const ProductReviews: React.FC<ProductReviewsProps> = ({
    productId,
    averageRating,
    totalReviews,
}) => {
    const router = useRouter();
    const { isAuthenticated } = useAppSelector((state) => state.auth);
    const [reviews, setReviews] = useState<ProductReview[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        loadReviews(1);
    }, [productId]);

    const loadReviews = async (page: number) => {
        if (isLoading) return;
        
        setIsLoading(true);
        try {
            const response = await reviewsApi.getProductReviews(productId, page);
            console.log('📦 Reviews response:', JSON.stringify(response, null, 2));
            
            // Handle different response structures
            const reviewsData = response.data || response;
            const reviewsList = Array.isArray(reviewsData) ? reviewsData : (reviewsData.data || []);
            
            if (page === 1) {
                setReviews(reviewsList);
            } else {
                setReviews(prev => [...prev, ...reviewsList]);
            }
            
            setCurrentPage(page);
            
            // Check for pagination links
            const links = response.links || (response as any).meta?.links;
            setHasMore(!!(links?.next));
        } catch (error) {
            console.error('Failed to load reviews:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleWriteReview = () => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        router.push(`/product/${productId}/write-review` as any);
    };

    const handleLoadMore = () => {
        if (hasMore && !isLoading) {
            loadReviews(currentPage + 1);
        }
    };

    const renderReviewItem = ({ item }: { item: ProductReview }) => (
        <View style={styles.reviewCard}>
            {/* Reviewer Info */}
            <View style={styles.reviewerInfo}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {item.name.split(' ').map(n => n.charAt(0).toUpperCase()).join('')}
                    </Text>
                </View>
                <View style={styles.reviewerDetails}>
                    <Text style={styles.reviewerName}>{item.name}</Text>
                    <Text style={styles.reviewDate}>
                        {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                </View>
            </View>

            {/* Rating Stars */}
            <View style={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                        key={star}
                        name={star <= item.rating ? 'star' : 'star-outline'}
                        size={16}
                        color={star <= item.rating ? theme.colors.warning.main : theme.colors.gray[400]}
                    />
                ))}
            </View>

            {/* Review Content */}
            <Text style={styles.reviewTitle}>{item.title}</Text>
            <Text style={styles.reviewComment}>{item.comment}</Text>
        </View>
    );

    const renderHeader = () => (
        <View style={styles.header}>
            {/* Rating Summary */}
            <View style={styles.ratingSummary}>
                <Text style={styles.averageRating}>{averageRating.toFixed(1)}</Text>
                <View style={styles.stars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                            key={star}
                            name={star <= Math.round(averageRating) ? 'star' : 'star-outline'}
                            size={20}
                            color={star <= Math.round(averageRating) ? theme.colors.warning.main : theme.colors.gray[400]}
                        />
                    ))}
                </View>
                <Text style={styles.totalReviews}>{totalReviews} reviews</Text>
            </View>

            {/* Write Review Button */}
            {isAuthenticated && (
                <TouchableOpacity 
                    style={styles.writeReviewButton}
                    onPress={handleWriteReview}
                    activeOpacity={0.7}
                >
                    <Ionicons name="create-outline" size={20} color="#1E3A8A" />
                    <Text style={styles.writeReviewText}>Write a Review</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const renderFooter = () => {
        if (!hasMore) return null;
        
        return (
            <TouchableOpacity 
                style={styles.loadMoreButton}
                onPress={handleLoadMore}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator size="small" color="#1E3A8A" />
                ) : (
                    <Text style={styles.loadMoreText}>Load More Reviews</Text>
                )}
            </TouchableOpacity>
        );
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color={theme.colors.gray[400]} />
            <Text style={styles.emptyText}>No reviews yet</Text>
            {/* {isAuthenticated && (
                <TouchableOpacity 
                    style={styles.writeReviewButton}
                    onPress={handleWriteReview}
                >
                    <Ionicons name="create-outline" size={20} color="#1E3A8A" />
                    <Text style={styles.writeReviewText}>Write a Review</Text>
                </TouchableOpacity>
            )} */}
        </View>
    );

    return (
        <Accordion 
            title={`Customer Reviews (${totalReviews})`}
            defaultExpanded={false}
            style={styles.accordion}
        >
            <View style={styles.container}>
                {renderHeader()}
                
                {isLoading && reviews.length === 0 ? (
                    <ActivityIndicator size="large" color={theme.colors.primary[500]} style={styles.loader} />
                ) : reviews.length === 0 ? (
                    renderEmpty()
                ) : (
                    <FlatList
                        data={reviews}
                        renderItem={renderReviewItem}
                        keyExtractor={(item) => item.id.toString()}
                        scrollEnabled={false}
                        ListFooterComponent={renderFooter}
                    />
                )}
            </View>
        </Accordion>
    );
};

const styles = StyleSheet.create({
    accordion: {
        marginBottom: theme.spacing.lg,
    },
    container: {
        gap: theme.spacing.md,
    },
    header: {
        marginBottom: theme.spacing.lg,
    },
    ratingSummary: {
        alignItems: 'center',
        paddingVertical: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.main,
        marginBottom: theme.spacing.md,
    },
    averageRating: {
        fontSize: 48,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    stars: {
        flexDirection: 'row',
        gap: 4,
        marginBottom: theme.spacing.xs,
    },
    totalReviews: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
    },
    writeReviewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: '#1E3A8A',
        backgroundColor: theme.colors.white,
    },
    writeReviewText: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: '#1E3A8A',
    },
    reviewCard: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.border.main,
        marginBottom: theme.spacing.md,
    },
    reviewerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.colors.gray[200],
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    avatarText: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.gray[600],
    },
    reviewerDetails: {
        flex: 1,
    },
    reviewerName: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    reviewDate: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
    },
    ratingStars: {
        flexDirection: 'row',
        gap: 2,
        marginBottom: theme.spacing.sm,
    },
    reviewTitle: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    reviewComment: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.sm,
    },
    loadMoreButton: {
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        borderColor: '#1E3A8A',
        backgroundColor: theme.colors.white,
        alignItems: 'center',
        marginTop: theme.spacing.md,
    },
    loadMoreText: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.medium,
        color: '#1E3A8A',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: theme.spacing.xl * 2,
        gap: theme.spacing.md,
    },
    emptyText: {
        fontSize: theme.typography.fontSize.lg,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.md,
    },
    loader: {
        paddingVertical: theme.spacing.xl,
    },
});

export default ProductReviews;

