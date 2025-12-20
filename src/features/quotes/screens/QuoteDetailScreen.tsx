import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { theme } from '@/theme';
import { useToast } from '@/shared/components/Toast';
import { useRequireAuth } from '@/shared/hooks/useRequireAuth';
import { suppliersApi, QuoteDetail, QuoteResponse } from '@/services/api/suppliers.api';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { ErrorMessage } from '@/shared/components/ErrorMessage';
import { formatters } from '@/shared/utils/formatters';

type StatusTab = 'new' | 'pending' | 'answered' | 'approved' | 'rejected';

export const QuoteDetailScreen: React.FC = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const { showToast } = useToast();
    const { quoteId } = useLocalSearchParams<{ quoteId: string }>();
    const { user, isAuthenticated, isLoading: isAuthLoading } = useRequireAuth();

    const [quoteDetail, setQuoteDetail] = useState<QuoteDetail | null>(null);
    const [activeTab, setActiveTab] = useState<StatusTab>('new');
    const [responses, setResponses] = useState<QuoteResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingResponses, setIsLoadingResponses] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const loadQuoteDetail = useCallback(async () => {
        if (!isAuthenticated || !user || !quoteId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const detail = await suppliersApi.getQuoteDetail(Number(quoteId));
            setQuoteDetail(detail);
        } catch (err: any) {
            setError(err.message || 'Failed to load quote details');
            showToast({ message: err.message || 'Failed to load quote', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, user, quoteId, showToast]);

    const loadResponses = useCallback(async (status: StatusTab, page: number = 1, refresh = false) => {
        if (!isAuthenticated || !user || !quoteId) {
            setIsLoadingResponses(false);
            return;
        }

        if (page === 1) {
            setIsLoadingResponses(true);
        } else {
            setIsLoadingMore(true);
        }

        try {
            const response = await suppliersApi.getQuoteByStatus(Number(quoteId), status, page, 15);

            if (refresh) {
                setResponses(response.data);
            } else {
                setResponses((prev) => (page === 1 ? response.data : [...prev, ...response.data]));
            }


            // Use meta if available, otherwise fall back to top-level properties
            const currentPage = response.meta?.current_page ?? response.current_page;
            const lastPage = response.meta?.last_page ?? response.last_page;

            setHasMore(currentPage < lastPage);
            setCurrentPage(currentPage);
        } catch (err: any) {
            showToast({ message: err.message || 'Failed to load responses', type: 'error' });
        } finally {
            setIsLoadingResponses(false);
            setIsLoadingMore(false);
            setIsRefreshing(false);
        }
    }, [isAuthenticated, user, quoteId, showToast]);

    useEffect(() => {
        loadQuoteDetail();
    }, [loadQuoteDetail]);

    // Use refs to track state and prevent cascading re-renders
    const activeTabRef = React.useRef<StatusTab>(activeTab);
    const hasLoadedInitial = React.useRef(false);

    useEffect(() => {
        if (!quoteDetail) return;

        // Initial load when quote detail is first available
        if (!hasLoadedInitial.current) {
            hasLoadedInitial.current = true;
            activeTabRef.current = activeTab;
            loadResponses(activeTab, 1, true);
            return;
        }

        // Tab changed - load new tab data
        if (activeTabRef.current !== activeTab) {
            activeTabRef.current = activeTab;
            loadResponses(activeTab, 1, true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, quoteDetail]);

    // Refresh data when screen comes into focus (e.g., after navigating back from detail screen)
    // Use a ref to track if this is the initial mount to avoid double-loading
    const isInitialMount = React.useRef(true);
    // Track the active tab in a ref for useFocusEffect to avoid re-running when tab changes
    const activeTabForFocus = React.useRef<StatusTab>(activeTab);

    // Update the ref whenever activeTab changes
    useEffect(() => {
        activeTabForFocus.current = activeTab;
    }, [activeTab]);

    useFocusEffect(
        useCallback(() => {
            // Skip on initial mount since useEffect already handles it
            if (isInitialMount.current) {
                isInitialMount.current = false;
                return;
            }

            // Only refresh when screen gains focus (coming back from another screen)
            // Use the ref to get the current active tab without adding it to dependencies
            if (isAuthenticated && user && quoteId) {
                // Only reload the current tab's data, not the quote details
                loadResponses(activeTabForFocus.current, 1, true);
            }
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [isAuthenticated, user, quoteId])
    );

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        loadQuoteDetail();
        loadResponses(activeTab, 1, true);
    }, [loadQuoteDetail, loadResponses, activeTab]);

    const handleLoadMore = () => {
        if (!isLoadingMore && hasMore) {
            loadResponses(activeTab, currentPage + 1);
        }
    };

    const handleTabChange = (tab: StatusTab) => {
        // Don't do anything if clicking the same tab
        if (tab === activeTab) {
            return;
        }

        // Set loading state immediately to show loader instead of empty state
        setIsLoadingResponses(true);
        setActiveTab(tab);
        setCurrentPage(1);
        setHasMore(true);
        setResponses([]);
    };

    const renderTabs = () => {
        if (!quoteDetail) return null;

        const tabs: { key: StatusTab; label: string; count: number }[] = [
            { key: 'new', label: t('quotes.tabs.new', 'New'), count: quoteDetail.status_counts.new },
            { key: 'pending', label: t('quotes.tabs.pending', 'Pending'), count: quoteDetail.status_counts.pending },
            { key: 'answered', label: t('quotes.tabs.answered', 'Answered'), count: quoteDetail.status_counts.answered },
            { key: 'approved', label: t('quotes.tabs.confirmed', 'Confirmed'), count: quoteDetail.status_counts.approved },
            { key: 'rejected', label: t('quotes.tabs.rejected', 'Rejected'), count: quoteDetail.status_counts.rejected },
        ];

        return (
            <View style={styles.tabsContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabsScroll}
                >
                    {tabs.map((tab) => (
                        <TouchableOpacity
                            key={tab.key}
                            style={[
                                styles.tabButton,
                                activeTab === tab.key && styles.activeTabButton,
                            ]}
                            onPress={() => handleTabChange(tab.key)}
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    activeTab === tab.key && styles.activeTabText,
                                ]}
                            >
                                {tab.label}
                                {tab.count > 0 && (
                                    <Text style={styles.tabCount}> ({tab.count})</Text>
                                )}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        );
    };

    const renderResponseCard = ({ item }: { item: QuoteResponse }) => (
        <TouchableOpacity
            onPress={() => router.push({
                pathname: '/quotes/quote-response-detail',
                params: {
                    quoteId: quoteId,
                    customerQuoteItemId: item.customer_quote_item_id.toString(),
                    supplierId: item.supplier_id?.toString() || '',
                    productId: item.product_id.toString(),
                    productName: item.product_name || '',
                }
            })}
            activeOpacity={0.7}
        >
            <View style={styles.responseCard}>
                <View style={styles.responseHeader}>
                    <View style={styles.responseTitleContainer}>
                        <Text style={styles.productName} numberOfLines={1}>
                            {item.product_name || t('quotes.unknownProduct', 'Unknown Product')}
                        </Text>
                        {item.supplier_name && (
                            <Text style={styles.supplierName}>{item.supplier_name}</Text>
                        )}
                    </View>
                    {item.supplier_status && (
                        <View style={styles.statusBadge}>
                            <Text style={styles.statusText}>{item.supplier_status}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.responseDetails}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>
                            {t('quotes.requestedQuantity', 'Requested Qty')}:
                        </Text>
                        <Text style={styles.detailValue}>{item.requested_quantity}</Text>
                    </View>

                    {item.quoted_quantity !== null && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>
                                {t('quotes.quotedQuantity', 'Quoted Qty')}:
                            </Text>
                            <Text style={styles.detailValue}>{item.quoted_quantity}</Text>
                        </View>
                    )}

                    {item.requested_price !== null && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>
                                {t('quotes.requestedPrice', 'Requested Price')}:
                            </Text>
                            <Text style={styles.detailValue}>
                                {formatters.formatPrice(item.requested_price)}
                            </Text>
                        </View>
                    )}

                    {item.quoted_price !== null && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>
                                {t('quotes.quotedPrice', 'Quoted Price')}:
                            </Text>
                            <Text style={[styles.detailValue, styles.quotedPrice]}>
                                {formatters.formatPrice(item.quoted_price)}
                            </Text>
                        </View>
                    )}

                    {item.customer_description && (
                        <View style={styles.descriptionContainer}>
                            <Text style={styles.detailLabel}>
                                {t('quotes.description', 'Description')}:
                            </Text>
                            <Text style={styles.descriptionText}>{item.customer_description}</Text>
                        </View>
                    )}

                    {item.is_sample === 1 && (
                        <View style={styles.sampleBadge}>
                            <Ionicons name="cube-outline" size={16} color={theme.colors.primary[500]} />
                            <Text style={styles.sampleText}>
                                {t('quotes.sampleRequired', 'Sample Required')}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderQuoteInfo = () => {
        if (!quoteDetail) return null;

        return (
            <View style={styles.quoteInfoContainer}>
                <Text style={styles.sectionTitle}>
                    {t('quotes.quoteInfo', 'Quote Information')}
                </Text>

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>
                        {t('quotes.quoteTitle', 'Quote Title')}:
                    </Text>
                    <Text style={styles.infoValue}>{quoteDetail.quote_title}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>
                        {t('quotes.description', 'Description')}:
                    </Text>
                    <Text style={styles.infoValue}>{quoteDetail.quote_brief}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>
                        {t('quotes.name', 'Name')}:
                    </Text>
                    <Text style={styles.infoValue}>{quoteDetail.name}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>
                        {t('quotes.companyName', 'Company')}:
                    </Text>
                    <Text style={styles.infoValue}>{quoteDetail.company_name}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>
                        {t('quotes.createdAt', 'Created')}:
                    </Text>
                    <Text style={styles.infoValue}>
                        {formatters.formatDate(quoteDetail.created_at)}
                    </Text>
                </View>
            </View>
        );
    };

    if (isAuthLoading || isLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {t('quotes.quoteDetail', 'Quote Detail')}
                    </Text>
                    <View style={styles.headerRight} />
                </View>
                <LoadingSpinner />
            </SafeAreaView>
        );
    }

    if (error && !quoteDetail) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {t('quotes.quoteDetail', 'Quote Detail')}
                    </Text>
                    <View style={styles.headerRight} />
                </View>
                <ErrorMessage message={error} onRetry={loadQuoteDetail} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {quoteDetail?.quote_title || t('quotes.quoteDetail', 'Quote Detail')}
                </Text>
                <View style={styles.headerRight} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollViewContent}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={onRefresh}
                        colors={[theme.colors.primary[500]]}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {renderQuoteInfo()}

                {renderTabs()}

                {isLoadingResponses ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
                    </View>
                ) : responses.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-outline" size={64} color={theme.colors.gray[400]} />
                        <Text style={styles.emptyText}>
                            {t('quotes.noResponses', 'No responses in this category')}
                        </Text>
                    </View>
                ) : (
                    <View style={styles.responsesContainer}>
                        {responses.map((item, index) => (
                            <View key={`${item.customer_quote_item_id}-${index}`}>
                                {renderResponseCard({ item })}
                            </View>
                        ))}
                        {isLoadingMore && (
                            <View style={styles.loadingMore}>
                                <ActivityIndicator size="small" color={theme.colors.primary[500]} />
                                <Text style={styles.loadingMoreText}>
                                    {t('common.loadingMore', 'Loading more...')}
                                </Text>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
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
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        flexGrow: 1,
    },
    quoteInfoContainer: {
        backgroundColor: theme.colors.white,
        padding: theme.spacing.lg,
        marginHorizontal: theme.spacing.md,
        marginTop: theme.spacing.sm,
        marginBottom: 0,
        borderRadius: theme.borderRadius.md,
        ...theme.shadows.sm,
    },
    sectionTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[100],
    },
    infoLabel: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.secondary,
        flex: 1,
    },
    infoValue: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.primary,
        flex: 1,
        textAlign: 'right',
    },
    tabsContainer: {
        backgroundColor: theme.colors.white,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200],
    },
    tabsScroll: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
    },
    tabButton: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        marginRight: theme.spacing.sm,
        borderRadius: theme.borderRadius.md,
    },
    activeTabButton: {
        backgroundColor: theme.colors.primary[500] + '20',
        borderWidth: 1,
        borderColor: theme.colors.primary[500],
    },
    tabText: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.secondary,
    },
    activeTabText: {
        color: theme.colors.primary[500],
        fontWeight: theme.typography.fontWeight.bold,
    },
    tabCount: {
        fontSize: theme.typography.fontSize.xs,
    },
    responsesContainer: {
        backgroundColor: theme.colors.background.default,
    },
    responsesList: {
        paddingHorizontal: theme.spacing.md,
        paddingBottom: theme.spacing.md,
    },
    responseCard: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        ...theme.shadows.sm,
    },
    responseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.sm,
    },
    responseTitleContainer: {
        flex: 1,
        marginRight: theme.spacing.sm,
    },
    productName: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs / 2,
    },
    supplierName: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
    },
    statusBadge: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.borderRadius.sm,
        backgroundColor: theme.colors.primary[500] + '20',
    },
    statusText: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.primary[500],
    },
    responseDetails: {
        gap: theme.spacing.xs,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
    },
    detailValue: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.primary,
    },
    quotedPrice: {
        color: theme.colors.success.main,
        fontWeight: theme.typography.fontWeight.bold,
    },
    descriptionContainer: {
        marginTop: theme.spacing.xs,
        paddingTop: theme.spacing.xs,
        borderTopWidth: 1,
        borderTopColor: theme.colors.gray[100],
    },
    descriptionText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.primary,
        marginTop: theme.spacing.xs,
    },
    sampleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
        marginTop: theme.spacing.xs,
        padding: theme.spacing.xs,
        backgroundColor: theme.colors.primary[500] + '10',
        borderRadius: theme.borderRadius.sm,
        alignSelf: 'flex-start',
    },
    sampleText: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.primary[500],
        fontWeight: theme.typography.fontWeight.medium,
    },
    loadingContainer: {
        alignItems: 'center',
        paddingTop: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.xl,
        paddingHorizontal: theme.spacing.md,
        minHeight: 200,
    },
    emptyText: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.secondary,
        marginTop: theme.spacing.md,
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

export default QuoteDetailScreen;

