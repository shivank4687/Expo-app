import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { reviewsApi } from '@/services/api/reviews.api';
import { ProductReview } from '../types/review.types';
import { theme } from '@/theme';
import { useAppSelector } from '@/store/hooks';
import { useRouter } from 'expo-router';
import { MediaGalleryModal, MediaItem } from '@/shared/modals';

interface ProductReviewCardProps {
    productId: number;
    totalReviews?: number;
}

export const ProductReviewCard: React.FC<ProductReviewCardProps> = ({ productId, totalReviews = 0 }) => {
    const router = useRouter();
    const { isAuthenticated } = useAppSelector((state) => state.auth);
    const [reviews, setReviews] = useState<ProductReview[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedReviewId, setExpandedReviewId] = useState<number | null>(null);
    const [galleryMedia, setGalleryMedia] = useState<MediaItem[]>([]);
    const [isGalleryVisible, setIsGalleryVisible] = useState(false);
    const [eligibility, setEligibility] = useState<{ eligible: boolean; message?: string } | null>(null);
    const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);

    const openGallery = (review: ProductReview) => {
        const media: MediaItem[] = (review.images || []).map((a) => ({
            type: a.type,
            url: a.url,
        }));
        if (media.length > 0) {
            setGalleryMedia(media);
            setIsGalleryVisible(true);
        }
    };

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const response = await reviewsApi.getProductReviews(productId, 1);
                const reviewsData = response.data || response;
                const reviewsList = Array.isArray(reviewsData) ? reviewsData : (reviewsData.data || []);

                // Show top 2 reviews in card
                setReviews(reviewsList.slice(0, 5));
            } catch (error) {
                console.error('Failed to load top reviews:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (totalReviews > 0) {
            fetchReviews();
        } else {
            setIsLoading(false);
        }
    }, [productId, totalReviews]);

    useEffect(() => {
        const checkEligibility = async () => {
            if (!isAuthenticated) return;
            setIsCheckingEligibility(true);
            try {
                const result = await reviewsApi.checkReviewEligibility(productId);
                setEligibility(result);
            } catch (error) {
                console.error('Failed to check review eligibility:', error);
            } finally {
                setIsCheckingEligibility(false);
            }
        };

        checkEligibility();
    }, [productId, isAuthenticated]);

    const toggleExpand = (id: number) => {
        setExpandedReviewId(prev => prev === id ? null : id);
    };

    const handleWriteReview = () => {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        router.push(`/product/${productId}/write-review` as any);
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>Reviews {totalReviews > 0 ? `(${totalReviews})` : ''}</Text>
                </View>
                {totalReviews > 0 && (
                    <TouchableOpacity
                        style={styles.seeAllButton}
                        onPress={() => router.push(`/product/${productId}/reviews` as any)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.seeAllText}>See all</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Reviews List */}
            {isLoading ? (
                <ActivityIndicator size="small" color={theme.colors.primary[500]} />
            ) : reviews.length > 0 ? (
                <View style={styles.reviewsListContainer}>
                    {reviews.map((review) => {
                        const isExpanded = expandedReviewId === review.id;

                        return (
                            <View key={review.id} style={styles.collapsedSection}>
                                <TouchableOpacity
                                    style={styles.collapsedContent}
                                    onPress={() => toggleExpand(review.id)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.reviewHeaderLeft}>
                                        <Text style={styles.name} numberOfLines={1}>
                                            {review.name}
                                        </Text>
                                        <View style={styles.stars}>
                                            {Array.from({ length: 5 }).map((_, index) => (
                                                <Ionicons
                                                    key={index}
                                                    name={index < review.rating ? 'star' : 'star-outline'}
                                                    size={12}
                                                    color={theme.colors.warning.main}
                                                />
                                            ))}
                                        </View>
                                    </View>
                                    <Ionicons
                                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                        size={16}
                                        color={theme.colors.text.secondary}
                                    />
                                </TouchableOpacity>

                                {isExpanded && (
                                    <View style={styles.expandedContent}>
                                        <Text style={styles.expandedTitle}>{review.title}</Text>
                                        <Text style={styles.comment}>{review.comment}</Text>

                                        {review.images && review.images.length > 0 && (
                                            <TouchableOpacity
                                                style={styles.mediaButton}
                                                onPress={() => openGallery(review)}
                                                activeOpacity={0.7}
                                            >
                                                <Ionicons
                                                    name="images-outline"
                                                    size={13}
                                                    color={theme.colors.primary[500]}
                                                />
                                                <Text style={styles.mediaButtonText}>
                                                    View Media ({review.images!.length})
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                        
                                        {review.reply_text ? (
                                            <View style={styles.replyContainer}>
                                                <View style={styles.replyHeaderRow}>
                                                    <Ionicons name="chatbubble-ellipses" size={12} color="#00615E" />
                                                    <Text style={styles.replyHeaderLabel}>
                                                        {review.reply_name ? `${review.reply_name} (Supplier)` : 'Supplier Reply'}
                                                    </Text>
                                                </View>
                                                <Text style={styles.replyContentText}>{review.reply_text}</Text>
                                            </View>
                                        ) : null}
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </View>
            ) : (
                <Text style={styles.noReviewsText}>No reviews yet.</Text>
            )}

            {/* Write Review Button */}
            {isAuthenticated ? (
                <View style={styles.writeReviewContainer}>
                    {isCheckingEligibility ? (
                        <ActivityIndicator size="small" color={theme.colors.primary[500]} />
                    ) : (
                        <>
                            <TouchableOpacity
                                style={[
                                    styles.writeReviewButton,
                                    eligibility && !eligibility.eligible && styles.writeReviewButtonDisabled
                                ]}
                                onPress={handleWriteReview}
                                disabled={eligibility !== null && !eligibility.eligible}
                                activeOpacity={0.7}
                            >
                                <Ionicons 
                                    name="create-outline" 
                                    size={20} 
                                    color={eligibility && !eligibility.eligible ? '#9CA3AF' : '#1E3A8A'} 
                                />
                                <Text 
                                    style={[
                                        styles.writeReviewText,
                                        eligibility && !eligibility.eligible && styles.writeReviewTextDisabled
                                    ]}
                                >
                                    Write a Review
                                </Text>
                            </TouchableOpacity>
                            {eligibility && !eligibility.eligible && (
                                <Text style={styles.eligibilityMessage}>
                                    {eligibility.message}
                                </Text>
                            )}
                        </>
                    )}
                </View>
            ) : null}

            <MediaGalleryModal
                visible={isGalleryVisible}
                media={galleryMedia}
                onClose={() => setIsGalleryVisible(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 8,
        padding: 8,
        gap: 12,
        alignSelf: 'stretch',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        alignSelf: 'stretch',
    },
    titleContainer: {
        flex: 1,
    },
    title: {
        fontWeight: '700',
        fontSize: 16,
        color: '#000000',
    },
    seeAllButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
        backgroundColor: 'rgba(0, 97, 94, 0.1)',
        borderRadius: 50,
    },
    seeAllText: {
        fontWeight: '600',
        fontSize: 11,
        color: '#00615E',
    },
    collapsedSection: {
        flexDirection: 'column',
        padding: 8,
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 8,
        alignSelf: 'stretch',
        marginBottom: 8,
    },
    reviewsListContainer: {
        marginTop: 4,
    },
    collapsedContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flex: 1,
    },
    reviewHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flex: 1,
        paddingRight: 8,
    },
    collapsedText: {
        fontWeight: '400',
        fontSize: 11,
        color: '#000000',
        flexShrink: 1,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    ratingText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#000000',
    },
    expandedContent: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#E9E3D3',
    },
    reviewerDetailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    reviewerName: {
        fontSize: 11,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    reviewDate: {
        fontSize: 10,
        color: theme.colors.text.secondary,
    },
    reviewComment: {
        fontSize: 11,
        color: theme.colors.text.secondary,
        lineHeight: 16,
    },
    noReviewsText: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        paddingVertical: 8,
    },
    writeReviewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#1E3A8A',
        backgroundColor: '#FFFFFF',
        marginTop: 4,
    },
    writeReviewText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E3A8A',
    },
    mediaButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        alignSelf: 'flex-start',
        marginTop: 8,
        paddingVertical: 4,
        paddingHorizontal: 8,
        backgroundColor: `${theme.colors.primary[500]}14`,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: `${theme.colors.primary[500]}33`,
    },
    mediaButtonText: {
        fontSize: 11,
        fontWeight: '600',
        color: theme.colors.primary[500],
    },
    replyContainer: {
        marginTop: 8,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        padding: 8,
        gap: 4,
    },
    replyHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    replyHeaderLabel: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '600',
        fontSize: 10,
        color: '#00615E',
    },
    replyContentText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 11,
        lineHeight: 14,
        color: '#4B5563',
    },
    writeReviewContainer: {
        width: '100%',
        alignItems: 'center',
        marginTop: 8,
    },
    writeReviewButtonDisabled: {
        backgroundColor: '#F3F4F6',
        borderColor: '#E5E7EB',
    },
    writeReviewTextDisabled: {
        color: '#9CA3AF',
    },
    eligibilityMessage: {
        fontSize: 12,
        color: '#D97706',
        marginTop: 6,
        textAlign: 'center',
        fontWeight: '500',
    },
});
