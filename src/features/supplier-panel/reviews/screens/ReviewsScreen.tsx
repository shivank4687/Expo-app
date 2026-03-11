import { getReviews, Review } from '@/features/supplier-panel/reviews/api/reviews.api';
import { ReviewCard } from '@/features/supplier-panel/reviews/components';
import { supplierTheme } from '@/theme';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ReviewsScreen() {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const insets = useSafeAreaInsets();

    const fetchReviews = async (page: number = 1, isRefresh: boolean = false) => {
        try {
            if (page === 1 && !isRefresh) {
                setLoading(true);
            }

            const response = await getReviews(page, 20);

            if (isRefresh || page === 1) {
                setReviews(response.data);
            } else {
                setReviews(prev => [...prev, ...response.data]);
            }

            setCurrentPage(response.meta.current_page);
            setLastPage(response.meta.last_page);
            setError(null);
        } catch (err) {
            console.error('Error fetching reviews:', err);
            setError('Failed to load reviews');
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        fetchReviews(1);
    }, []);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        fetchReviews(1, true);
    }, []);

    const handleLoadMore = useCallback(() => {
        if (!loadingMore && currentPage < lastPage) {
            setLoadingMore(true);
            fetchReviews(currentPage + 1);
        }
    }, [loadingMore, currentPage, lastPage]);

    const renderHeader = () => (
        <View style={styles.header}>
            <Text style={styles.title}>My reviews</Text>
            <Text style={styles.subtitle}>Your reputation sells for you</Text>
        </View>
    );

    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#00615E" />
            </View>
        );
    };

    const renderEmpty = () => {
        if (loading) return null;
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                    {error || 'No reviews yet'}
                </Text>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#00615E" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <FlatList
                data={reviews}
                renderItem={({ item }) => (
                    <ReviewCard
                        review={{
                            id: item.id.toString(),
                            rating: item.rating,
                            text: item.comment,
                            author: item.customer_name,
                            tag: item.status === 'approved' ? 'Approved' : 'Pending',
                        }}
                    />
                )}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={[styles.container, { paddingBottom: insets.bottom }]}
                ListHeaderComponent={renderHeader}
                ListFooterComponent={renderFooter}
                ListEmptyComponent={renderEmpty}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor="#00615E"
                    />
                }
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: supplierTheme.colors.background.default,
    },
    container: {
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 0,
        flexGrow: 1,
    },
    header: {
        gap: 8,
        marginBottom: 20,
    },
    title: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '700',
        fontSize: 24,
        lineHeight: 24,
        color: '#000000',
    },
    subtitle: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 14,
        lineHeight: 20,
        color: '#000000',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerLoader: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    emptyContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 20,
        color: '#666666',
    },
});
