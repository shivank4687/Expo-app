import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { theme } from '@/theme';
import { useToast } from '@/shared/components/Toast';
import { useRequireAuth } from '@/shared/hooks/useRequireAuth';
import { suppliersApi, CustomerQuote } from '@/services/api/suppliers.api';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { ErrorMessage } from '@/shared/components/ErrorMessage';
import { formatters } from '@/shared/utils/formatters';

export const RequestedQuotesListScreen: React.FC = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const { showToast } = useToast();
    const { user, isAuthenticated, isLoading: isAuthLoading } = useRequireAuth();

    const [quotes, setQuotes] = useState<CustomerQuote[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const loadQuotes = useCallback(async (page: number = 1, refresh = false) => {
        if (!isAuthenticated || !user) {
            setIsLoading(false);
            return;
        }

        if (page === 1) {
            setIsLoading(true);
        } else {
            setIsLoadingMore(true);
        }
        setError(null);

        try {
            const response = await suppliersApi.getCustomerQuotes(page, 15);
            
            if (refresh) {
                setQuotes(response.data);
            } else {
                setQuotes((prev) => (page === 1 ? response.data : [...prev, ...response.data]));
            }
            
            setHasMore(response.meta.current_page < response.meta.last_page);
            setCurrentPage(response.meta.current_page);
        } catch (err: any) {
            setError(err.message || 'Failed to load quotes');
            showToast({ message: err.message || 'Failed to load quotes', type: 'error' });
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
            setIsRefreshing(false);
        }
    }, [isAuthenticated, user, showToast]);

    useEffect(() => {
        loadQuotes(1, true);
    }, [loadQuotes]);

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        loadQuotes(1, true);
    }, [loadQuotes]);

    const handleLoadMore = () => {
        if (!isLoadingMore && hasMore) {
            loadQuotes(currentPage + 1);
        }
    };

    const handleQuotePress = (quoteId: number) => {
        router.push(`/quotes/${quoteId}` as any);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return theme.colors.warning.main;
            case 'processing':
                return theme.colors.info.main || theme.colors.primary[500];
            case 'completed':
                return theme.colors.success.main;
            default:
                return theme.colors.text.secondary;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending':
                return t('quotes.status.pending', 'Pending');
            case 'processing':
                return t('quotes.status.processing', 'Processing');
            case 'completed':
                return t('quotes.status.completed', 'Completed');
            default:
                return status;
        }
    };

    const renderQuoteCard = ({ item }: { item: CustomerQuote }) => (
        <TouchableOpacity
            style={styles.quoteCard}
            onPress={() => handleQuotePress(item.id)}
            activeOpacity={0.7}
        >
            <View style={styles.quoteHeader}>
                <View style={styles.quoteTitleContainer}>
                    <Text style={styles.quoteTitle} numberOfLines={1}>
                        {item.quote_title}
                    </Text>
                    <Text style={styles.quoteId}>#{item.id}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.quote_status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.quote_status) }]}>
                        {getStatusLabel(item.quote_status)}
                    </Text>
                </View>
            </View>

            <View style={styles.quoteDetails}>
                <View style={styles.detailRow}>
                    <Ionicons name="person-outline" size={16} color={theme.colors.text.secondary} />
                    <Text style={styles.detailText}>{item.name}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Ionicons name="cube-outline" size={16} color={theme.colors.text.secondary} />
                    <Text style={styles.detailText}>
                        {t('quotes.quantity', 'Quantity')}: {item.quantity}
                    </Text>
                </View>
                <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={16} color={theme.colors.text.secondary} />
                    <Text style={styles.detailText}>
                        {formatters.formatDate(item.created_at)}
                    </Text>
                </View>
            </View>

            <View style={styles.arrowContainer}>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
            </View>
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={80} color={theme.colors.gray[400]} />
            <Text style={styles.emptyText}>
                {t('quotes.noQuotes', 'You have no requested quotes yet.')}
            </Text>
            <Text style={styles.emptySubText}>
                {t('quotes.createQuote', 'Request a quote from a supplier to get started.')}
            </Text>
        </View>
    );

    if (isAuthLoading || isLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {t('quotes.title', 'My Requested Quotes')}
                    </Text>
                    <View style={styles.headerRight} />
                </View>
                <LoadingSpinner />
            </SafeAreaView>
        );
    }

    if (error && quotes.length === 0) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {t('quotes.title', 'My Requested Quotes')}
                    </Text>
                    <View style={styles.headerRight} />
                </View>
                <ErrorMessage message={error} onRetry={() => loadQuotes(1, true)} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {t('quotes.title', 'My Requested Quotes')}
                </Text>
                <View style={styles.headerRight} />
            </View>

            {quotes.length === 0 ? (
                renderEmptyState()
            ) : (
                <FlatList
                    data={quotes}
                    renderItem={renderQuoteCard}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={onRefresh}
                            colors={[theme.colors.primary[500]]}
                        />
                    }
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={
                        isLoadingMore ? (
                            <View style={styles.loadingMore}>
                                <ActivityIndicator size="small" color={theme.colors.primary[500]} />
                                <Text style={styles.loadingMoreText}>
                                    {t('common.loadingMore', 'Loading more...')}
                                </Text>
                            </View>
                        ) : null
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.default,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200] || theme.colors.border.main,
        backgroundColor: theme.colors.background.paper || theme.colors.white,
    },
    backButton: {
        padding: theme.spacing.xs,
    },
    headerTitle: {
        flex: 1,
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        textAlign: 'center',
        marginHorizontal: theme.spacing.sm,
    },
    headerRight: {
        minWidth: 40,
    },
    listContent: {
        padding: theme.spacing.md,
    },
    quoteCard: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        ...theme.shadows.sm,
    },
    quoteHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.sm,
    },
    quoteTitleContainer: {
        flex: 1,
        marginRight: theme.spacing.sm,
    },
    quoteTitle: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs / 2,
    },
    quoteId: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
    },
    statusBadge: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.sm,
    },
    statusText: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.medium,
    },
    quoteDetails: {
        gap: theme.spacing.xs,
        marginBottom: theme.spacing.xs,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
    },
    detailText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
    },
    arrowContainer: {
        position: 'absolute',
        right: theme.spacing.md,
        top: '50%',
        marginTop: -10,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.xl,
    },
    emptyText: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.primary,
        marginTop: theme.spacing.md,
        textAlign: 'center',
    },
    emptySubText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        marginTop: theme.spacing.xs,
        textAlign: 'center',
    },
    loadingMore: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.md,
    },
    loadingMoreText: {
        marginLeft: theme.spacing.sm,
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
    },
});

export default RequestedQuotesListScreen;

