import { getReviews, submitReviewReply, Review } from '@/features/supplier-panel/reviews/api/reviews.api';
import { ReviewCard } from '@/features/supplier-panel/reviews/components';
import { InputModal } from '@/shared/components/InputModal';
import { useToast } from '@/shared/components/Toast';
import { TabGroup } from '@/shared/components/tabs/TabGroup';
import { supplierTheme } from '@/theme';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ReviewsScreen() {
    const { tab } = useLocalSearchParams<{ tab?: string }>();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [activeTab, setActiveTab] = useState<'company' | 'product'>('company');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const [replyModalVisible, setReplyModalVisible] = useState(false);
    const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null);
    const [selectedReviewText, setSelectedReviewText] = useState('');
    const [replySubmitting, setReplySubmitting] = useState(false);
        const insets = useSafeAreaInsets();
    const { showToast } = useToast();

    useEffect(() => {
        if (tab === 'company' || tab === 'product') {
            setActiveTab(tab);
        }
    }, [tab]);

    const fetchReviews = async (page: number = 1, isRefresh: boolean = false) => {
        try {
            if (page === 1 && !isRefresh) {
                setLoading(true);
            }

            const response = await getReviews(page, 20, activeTab);

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
    }, [activeTab]);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        fetchReviews(1, true);
    }, [activeTab]);

    const handleLoadMore = useCallback(() => {
        if (!loadingMore && currentPage < lastPage) {
            setLoadingMore(true);
            fetchReviews(currentPage + 1);
        }
    }, [loadingMore, currentPage, lastPage, activeTab]);

    const handleTabChange = (tabId: string) => {
        const tab = tabId as 'company' | 'product';
        if (tab === activeTab) return;
        setActiveTab(tab);
        setReviews([]);
        setCurrentPage(1);
        setLastPage(1);
    };

    const handleOpenReplyModal = useCallback((reviewId: string, currentReply?: string) => {
        setSelectedReviewId(parseInt(reviewId));
        setSelectedReviewText(currentReply || '');
        setReplyModalVisible(true);
    }, []);

    const handleReplySubmit = async (replyText: string) => {
        if (!selectedReviewId) return;

        try {
            setReplySubmitting(true);
            const response = await submitReviewReply(selectedReviewId, replyText);

            setReviews((prevReviews) =>
                prevReviews.map((rev) => {
                    if (rev.id === selectedReviewId) {
                        return {
                            ...rev,
                            reply_text: response.reply_text,
                            reply_by: response.reply_by,
                        };
                    }
                    return rev;
                })
            );

            showToast({
                message: response.message || 'Reply saved successfully',
                type: 'success',
            });
            setReplyModalVisible(false);
        } catch (err) {
            console.error('Failed to submit reply:', err);
            showToast({
                message: 'Failed to save reply. Please try again.',
                type: 'error',
            });
            throw err;
        } finally {
            setReplySubmitting(false);
        }
    };

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

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <View style={styles.headerContainer}>
                <Text style={styles.title}>My reviews</Text>
                <Text style={styles.subtitle}>Your reputation sells for you</Text>
                <TabGroup
                    tabs={[
                        { id: 'company', label: 'Company' },
                        { id: 'product', label: 'Product' },
                    ]}
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    containerStyle={styles.tabContainer}
                />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#00615E" />
                </View>
            ) : (
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
                                reply: item.reply_text ?? undefined,
                                replyBy: item.reply_by ?? undefined,
                                productName: item.product_name,
                            }}
                            onReply={handleOpenReplyModal}
                        />
                    )}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={[styles.container, { paddingBottom: insets.bottom }]}
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
            )}
            <InputModal
                visible={replyModalVisible}
                onClose={() => setReplyModalVisible(false)}
                onSubmit={handleReplySubmit}
                title={selectedReviewText ? 'Edit Reply' : 'Reply to Review'}
                placeholder="Type your reply here..."
                submitButtonText={selectedReviewText ? 'Update' : 'Submit'}
                initialValue={selectedReviewText}
                multiline={true}
                isLoading={replySubmitting}
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
        paddingTop: 8,
        paddingBottom: 0,
        flexGrow: 1,
    },
    headerContainer: {
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 12,
        gap: 8,
    },
    tabContainer: {
        marginTop: 10,
        backgroundColor: '#F2F2F2',
        borderWidth: 1,
        borderColor: '#EAEAEA',
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
