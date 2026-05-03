import { getReviews, Review } from '@/features/supplier-panel/reviews/api/reviews.api';
import { ReviewCard } from '@/features/supplier-panel/reviews/components';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface DashboardReviewsSectionProps {
    onSeeAll?: () => void;
}

export function DashboardReviewsSection({ onSeeAll }: DashboardReviewsSectionProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getReviews(1, 3);
            setReviews(response.data);
        } catch (err) {
            console.error('Error fetching dashboard reviews:', err);
            setError('Failed to load reviews');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchReviews();
        }, [])
    );

    return (
        <View style={styles.reviewsSection}>
            <View style={styles.reviewsSectionHeader}>
                <Text style={styles.reviewsSectionTitle}>My reviews</Text>
                <Text style={styles.reviewsSectionSubtitle}>Your reputation sells for you</Text>
            </View>

            {loading ? (
                <View style={styles.stateContainer}>
                    <ActivityIndicator size="small" color="#00615E" />
                </View>
            ) : error ? (
                <View style={styles.stateContainer}>
                    <Text style={styles.stateText}>{error}</Text>
                </View>
            ) : reviews.length === 0 ? (
                <View style={styles.stateContainer}>
                    <Text style={styles.stateText}>No reviews yet</Text>
                </View>
            ) : (
                <View style={styles.reviewsContainer}>
                    {reviews.map((item) => (
                        <ReviewCard
                            key={item.id}
                            review={{
                                id: item.id.toString(),
                                rating: item.rating,
                                text: item.comment,
                                author: item.customer_name,
                                tag: item.status === 'approved' ? 'Approved' : 'Pending',
                            }}
                        />
                    ))}
                </View>
            )}

            <TouchableOpacity style={styles.seeAllButton} onPress={onSeeAll}>
                <Text style={styles.seeAllButtonText}>See All</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    reviewsSection: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 16,
        gap: 16,
        alignSelf: 'stretch',
        backgroundColor: '#FCF7EA',
        borderRadius: 16,
        marginBottom: 24,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 6,
    },
    reviewsSectionHeader: {
        alignSelf: 'stretch',
        gap: 8,
    },
    reviewsSectionTitle: {
        fontFamily: 'Inter',
        fontWeight: '700',
        fontSize: 24,
        color: '#000000',
        includeFontPadding: false,
    },
    reviewsSectionSubtitle: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 14,
        color: '#000000',
        includeFontPadding: false,
    },
    reviewsContainer: {
        alignSelf: 'stretch',
        gap: 8,
    },
    stateContainer: {
        alignSelf: 'stretch',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 24,
    },
    stateText: {
        fontFamily: 'Inter',
        fontSize: 14,
        color: '#666666',
        includeFontPadding: false,
    },
    seeAllButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 12,
        gap: 8,
        alignSelf: 'stretch',
        height: 40,
        backgroundColor: '#EAECE1',
        borderWidth: 1,
        borderColor: '#EAECE1',
        borderRadius: 8,
    },
    seeAllButtonText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 16,
        color: '#000000',
        includeFontPadding: false,
    },
});
