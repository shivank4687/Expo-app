import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    TextInput,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { theme } from '@/theme';
import { useToast } from '@/shared/components/Toast';
import { useRequireAuth } from '@/shared/hooks/useRequireAuth';
import { suppliersApi, QuoteResponseDetail, QuoteMessage } from '@/services/api/suppliers.api';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { ErrorMessage } from '@/shared/components/ErrorMessage';
import { formatters } from '@/shared/utils/formatters';

type TabType = 'summary' | 'messages';

export const QuoteResponseDetailScreen: React.FC = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const { showToast } = useToast();
    const insets = useSafeAreaInsets();
    const { quoteId, customerQuoteItemId, productName } = useLocalSearchParams<{
        quoteId: string;
        customerQuoteItemId: string;
        productName?: string;
    }>();
    const { user, isAuthenticated, isLoading: isAuthLoading } = useRequireAuth();
    const flatListRef = useRef<FlatList>(null);

    const [activeTab, setActiveTab] = useState<TabType>('summary');
    const [quoteDetail, setQuoteDetail] = useState<QuoteResponseDetail | null>(null);
    const [messages, setMessages] = useState<QuoteMessage[]>([]);
    const [messageText, setMessageText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadQuoteDetail = useCallback(async () => {
        if (!isAuthenticated || !user || !quoteId || !customerQuoteItemId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const detail = await suppliersApi.getQuoteResponseDetail(
                Number(quoteId),
                Number(customerQuoteItemId)
            );
            setQuoteDetail(detail);
            setMessages(detail.quote_messages || []);
        } catch (err: any) {
            setError(err.message || 'Failed to load quote details');
            showToast({ message: err.message || 'Failed to load quote', type: 'error' });
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [isAuthenticated, user, quoteId, customerQuoteItemId, showToast]);

    useEffect(() => {
        loadQuoteDetail();
    }, [loadQuoteDetail]);

    useEffect(() => {
        // Scroll to bottom when messages change
        if (messages.length > 0 && flatListRef.current && activeTab === 'messages') {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages, activeTab]);

    const onRefresh = useCallback(() => {
        setIsRefreshing(true);
        loadQuoteDetail();
    }, [loadQuoteDetail]);

    const handleSendMessage = async () => {
        console.log('📤 handleSendMessage called', { messageText: messageText.trim(), hasQuoteDetail: !!quoteDetail, isSending });

        if (!messageText.trim() || !quoteDetail || isSending) {
            console.log('⚠️ Early return:', { hasMessage: !!messageText.trim(), hasQuoteDetail: !!quoteDetail, isSending });
            return;
        }

        console.log('📊 Quote detail:', {
            supplierQuoteItemsCount: quoteDetail.supplier_quote_items.length,
            customerQuoteItemId: quoteDetail.customer_quote_item.id,
        });

        const latestSupplierQuote = quoteDetail.supplier_quote_items[quoteDetail.supplier_quote_items.length - 1];
        if (!latestSupplierQuote) {
            console.log('❌ No supplier quote found');
            showToast({ message: 'No supplier quote found. Please wait for supplier to respond first.', type: 'error' });
            return;
        }

        console.log('✅ Latest supplier quote:', { id: latestSupplierQuote.id });

        const messageToSend = messageText.trim();
        setMessageText('');
        setIsSending(true);

        try {
            console.log('🚀 Sending message:', {
                supplierQuoteItemId: latestSupplierQuote.id,
                customerQuoteItemId: quoteDetail.customer_quote_item.id,
                message: messageToSend,
            });

            const response = await suppliersApi.sendQuoteMessage(
                latestSupplierQuote.id,
                quoteDetail.customer_quote_item.id,
                messageToSend
            );

            console.log('✅ Message sent successfully:', response);

            if (response.data) {
                setMessages(prev => [...prev, response.data!]);
                setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
                showToast({ message: 'Message sent successfully', type: 'success' });
            }
        } catch (err: any) {
            console.error('❌ Failed to send message:', err);
            setMessageText(messageToSend);
            showToast({ message: err.message || 'Failed to send message', type: 'error' });
        } finally {
            setIsSending(false);
        }
    };

    const handleApprove = () => {
        if (!quoteDetail) return;

        const latestSupplierQuote = quoteDetail.supplier_quote_items[quoteDetail.supplier_quote_items.length - 1];
        if (!latestSupplierQuote) return;

        Alert.alert(
            t('quotes.approveQuote', 'Approve Quote'),
            t('quotes.approveConfirmation', 'Are you sure you want to approve this quote?'),
            [
                { text: t('common.cancel', 'Cancel'), style: 'cancel' },
                {
                    text: t('common.approve', 'Approve'),
                    onPress: async () => {
                        try {
                            await suppliersApi.approveQuote(latestSupplierQuote.id);
                            showToast({ message: t('quotes.approveSuccess', 'Quote approved successfully'), type: 'success' });
                            loadQuoteDetail();
                        } catch (err: any) {
                            showToast({ message: err.message || 'Failed to approve quote', type: 'error' });
                        }
                    },
                },
            ]
        );
    };

    const handleReject = () => {
        if (!quoteDetail) return;

        const latestSupplierQuote = quoteDetail.supplier_quote_items[quoteDetail.supplier_quote_items.length - 1];
        if (!latestSupplierQuote) return;

        Alert.alert(
            t('quotes.rejectQuote', 'Reject Quote'),
            t('quotes.rejectConfirmation', 'Are you sure you want to reject this quote?'),
            [
                { text: t('common.cancel', 'Cancel'), style: 'cancel' },
                {
                    text: t('common.reject', 'Reject'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await suppliersApi.rejectQuote(latestSupplierQuote.id);
                            showToast({ message: t('quotes.rejectSuccess', 'Quote rejected successfully'), type: 'success' });
                            loadQuoteDetail();
                        } catch (err: any) {
                            showToast({ message: err.message || 'Failed to reject quote', type: 'error' });
                        }
                    },
                },
            ]
        );
    };

    const handleAddToCart = async () => {
        if (!quoteDetail) return;

        const latestSupplierQuote = quoteDetail.supplier_quote_items[quoteDetail.supplier_quote_items.length - 1];
        if (!latestSupplierQuote) return;

        try {
            const response = await suppliersApi.addQuoteToCart(latestSupplierQuote.id);

            if (response.success) {
                showToast({ message: response.message || t('quotes.addToCartSuccess', 'Quote added to cart successfully'), type: 'success' });
                loadQuoteDetail();
                // Navigate to cart after successful add
                router.push('/cart');
            } else {
                showToast({ message: response.message || 'Failed to add quote to cart', type: 'error' });
            }
        } catch (err: any) {
            showToast({ message: err.message || 'Failed to add quote to cart', type: 'error' });
        }
    };

    const formatMessageTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    };

    const renderMessage = ({ item, index }: { item: QuoteMessage; index: number }) => {
        const isCustomer = item.customer_id !== null;
        const showTime =
            index === messages.length - 1 ||
            new Date(item.created_at).getTime() - new Date(messages[index + 1].created_at).getTime() > 300000;

        return (
            <View style={styles.messageWrapper}>
                <View
                    style={[
                        styles.messageContainer,
                        isCustomer ? styles.customerMessage : styles.supplierMessage,
                    ]}
                >
                    <Text
                        style={[
                            styles.messageText,
                            isCustomer && styles.customerMessageText,
                        ]}
                    >
                        {item.message}
                    </Text>
                    {showTime && (
                        <Text
                            style={[
                                styles.messageTime,
                                isCustomer && styles.customerMessageTime,
                            ]}
                        >
                            {formatMessageTime(item.created_at)}
                        </Text>
                    )}
                </View>
            </View>
        );
    };

    const renderSummaryTab = () => {
        if (!quoteDetail) return null;

        const latestSupplierQuote = quoteDetail.supplier_quote_items[quoteDetail.supplier_quote_items.length - 1];

        return (
            <ScrollView
                style={styles.tabContent}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={onRefresh}
                        colors={[theme.colors.primary[500]]}
                    />
                }
            >
                {/* Customer Request Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('quotes.customerRequest', 'Customer Request')}</Text>
                    <View style={styles.card}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>{t('quotes.product', 'Product')}:</Text>
                            <Text style={styles.infoValue}>{quoteDetail.customer_quote_item.product_name}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>{t('quotes.quantity', 'Quantity')}:</Text>
                            <Text style={styles.infoValue}>{quoteDetail.customer_quote_item.quantity}</Text>
                        </View>
                        {quoteDetail.customer_quote_item.price_per_quantity && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>{t('quotes.expectedPrice', 'Expected Price')}:</Text>
                                <Text style={styles.infoValue}>
                                    {formatters.formatPrice(quoteDetail.customer_quote_item.price_per_quantity)}
                                </Text>
                            </View>
                        )}
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>{t('quotes.sampleRequired', 'Sample Required')}:</Text>
                            <Text style={styles.infoValue}>
                                {quoteDetail.customer_quote_item.is_sample ? t('common.yes', 'Yes') : t('common.no', 'No')}
                            </Text>
                        </View>
                        {quoteDetail.customer_quote_item.description && (
                            <View style={styles.descriptionRow}>
                                <Text style={styles.infoLabel}>{t('quotes.description', 'Description')}:</Text>
                                <Text style={styles.descriptionText}>{quoteDetail.customer_quote_item.description}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Supplier Quotations */}
                {quoteDetail.supplier_quote_items.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('quotes.supplierQuotations', 'Supplier Quotations')}</Text>
                        {quoteDetail.supplier_quote_items.map((quote, index) => (
                            <View
                                key={quote.id}
                                style={[
                                    styles.card,
                                    index === quoteDetail.supplier_quote_items.length - 1 && styles.latestQuoteCard,
                                ]}
                            >
                                {index === quoteDetail.supplier_quote_items.length - 1 && (
                                    <View style={styles.latestBadge}>
                                        <Text style={styles.latestBadgeText}>{t('quotes.latest', 'Latest')}</Text>
                                    </View>
                                )}
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>{t('quotes.quotedQuantity', 'Quoted Qty')}:</Text>
                                    <Text style={styles.infoValue}>{quote.quantity}</Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>{t('quotes.pricePerUnit', 'Price/Unit')}:</Text>
                                    <Text style={[styles.infoValue, styles.priceText]}>
                                        {formatters.formatPrice(quote.price_per_quantity)}
                                    </Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>{t('quotes.totalPrice', 'Total Price')}:</Text>
                                    <Text style={[styles.infoValue, styles.totalPriceText]}>
                                        {formatters.formatPrice(quote.price_per_quantity * quote.quantity)}
                                    </Text>
                                </View>
                                {quote.shipping_time && (
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>{t('quotes.shippingTime', 'Shipping Time')}:</Text>
                                        <Text style={styles.infoValue}>{quote.shipping_time} {t('quotes.days', 'days')}</Text>
                                    </View>
                                )}
                                {quote.is_sample && (
                                    <>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>{t('quotes.sampleUnits', 'Sample Units')}:</Text>
                                            <Text style={styles.infoValue}>{quote.sample_unit || 0}</Text>
                                        </View>
                                        {quote.sample_price && (
                                            <View style={styles.infoRow}>
                                                <Text style={styles.infoLabel}>{t('quotes.samplePrice', 'Sample Price')}:</Text>
                                                <Text style={styles.infoValue}>{formatters.formatPrice(quote.sample_price)}</Text>
                                            </View>
                                        )}
                                    </>
                                )}
                                {quote.note && (
                                    <View style={styles.descriptionRow}>
                                        <Text style={styles.infoLabel}>{t('quotes.notes', 'Notes')}:</Text>
                                        <Text style={styles.descriptionText}>{quote.note}</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                )}

                {/* Action Buttons */}
                {latestSupplierQuote && !latestSupplierQuote.is_ordered && (
                    <View style={[styles.actionsContainer, { paddingBottom: Math.max(insets.bottom, theme.spacing.md) }]}>
                        {/* Show approve button if latest quote is not approved AND not rejected */}
                        {!latestSupplierQuote.is_approve && latestSupplierQuote.status !== 'rejected' && (
                            <TouchableOpacity style={styles.approveButton} onPress={handleApprove}>
                                <Text style={styles.approveButtonText}>{t('quotes.approveQuote', 'Approve Quote')}</Text>
                            </TouchableOpacity>
                        )}

                        {/* Show reject button if latest quote is not rejected */}
                        {latestSupplierQuote.status !== 'rejected' && !latestSupplierQuote.is_approve && (
                            <TouchableOpacity style={styles.rejectButton} onPress={handleReject}>
                                <Text style={styles.rejectButtonText}>{t('quotes.rejectQuote', 'Reject Quote')}</Text>
                            </TouchableOpacity>
                        )}

                        {/* Show approved status if latest quote is approved */}
                        {latestSupplierQuote.is_approve && latestSupplierQuote.status !== 'rejected' && (
                            <>
                                <View style={styles.statusContainer}>
                                    {/* <Ionicons name="checkmark-circle" size={24} color={theme.colors.success.main} /> */}
                                    <Text style={styles.approvedText}>{t('quotes.quoteApproved', 'Quote Approved')}</Text>
                                </View>

                                {/* Add to Cart button for approved quotes */}
                                <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
                                    <Ionicons name="cart" size={20} color={theme.colors.white} />
                                    <Text style={styles.addToCartButtonText}>{t('quotes.addToCart', 'Add to Cart')}</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {/* Show rejected status if latest quote is rejected */}
                        {latestSupplierQuote.status === 'rejected' && (
                            <View style={styles.statusContainer}>
                                {/* <Ionicons name="close-circle" size={24} color={theme.colors.error.main} /> */}
                                <Text style={styles.rejectedText}>{t('quotes.quoteRejected', 'Quote Rejected')}</Text>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        );
    };

    const renderMessagesTab = () => {
        if (!quoteDetail) return null;

        return (
            <KeyboardAvoidingView
                style={styles.messagesTabContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.messagesContainer}
                    style={styles.messagesList}
                    onContentSizeChange={() => {
                        if (messages.length > 0) {
                            flatListRef.current?.scrollToEnd({ animated: false });
                        }
                    }}
                    ListEmptyComponent={
                        <View style={styles.emptyMessages}>
                            <Ionicons name="chatbubbles-outline" size={64} color={theme.colors.gray[400]} />
                            <Text style={styles.emptyMessagesText}>{t('quotes.noMessages', 'No messages yet')}</Text>
                        </View>
                    }
                />

                <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, theme.spacing.md) }]}>
                    <TextInput
                        style={styles.textInput}
                        placeholder={t('quotes.typeMessage', 'Type a message...')}
                        placeholderTextColor={theme.colors.text.secondary}
                        value={messageText}
                        onChangeText={setMessageText}
                        multiline
                        maxLength={1000}
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            (!messageText.trim() || isSending) && styles.sendButtonDisabled,
                        ]}
                        onPress={handleSendMessage}
                        disabled={!messageText.trim() || isSending}
                    >
                        {isSending ? (
                            <ActivityIndicator size="small" color={theme.colors.white} />
                        ) : (
                            <Ionicons name="send" size={20} color={theme.colors.white} />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        );
    };

    if (isAuthLoading || isLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {productName || t('quotes.quoteDetail', 'Quote Detail')}
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
                    <Text style={styles.headerTitle}>{t('quotes.quoteDetail', 'Quote Detail')}</Text>
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
                    {productName || quoteDetail?.customer_quote_item.product_name || t('quotes.quoteDetail', 'Quote Detail')}
                </Text>
                <View style={styles.headerRight} />
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'summary' && styles.activeTab]}
                    onPress={() => setActiveTab('summary')}
                >
                    <Text style={[styles.tabText, activeTab === 'summary' && styles.activeTabText]}>
                        {t('quotes.summary', 'Summary')}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'messages' && styles.activeTab]}
                    onPress={() => setActiveTab('messages')}
                >
                    <Text style={[styles.tabText, activeTab === 'messages' && styles.activeTabText]}>
                        {t('quotes.messages', 'Messages')}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Tab Content */}
            {activeTab === 'summary' ? renderSummaryTab() : renderMessagesTab()}
            {/* Tab Content - Keep both mounted to prevent refresh */}
            {/* <View style={{ display: activeTab === 'summary' ? 'flex' : 'none', flex: 1 }}>
                {renderSummaryTab()}
            </View>
            <View style={{ display: activeTab === 'messages' ? 'flex' : 'none', flex: 1 }}>
                {renderMessagesTab()}
            </View> */}
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
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: theme.colors.white,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200],
    },
    tab: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: theme.colors.primary[500],
    },
    tabText: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.secondary,
    },
    activeTabText: {
        color: theme.colors.primary[500],
        fontWeight: theme.typography.fontWeight.bold,
    },
    tabContent: {
        flex: 1,
    },
    scrollContent: {
        padding: theme.spacing.md,
    },
    section: {
        marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
    },
    card: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
        ...theme.shadows.sm,
    },
    latestQuoteCard: {
        borderWidth: 2,
        borderColor: theme.colors.primary[500],
    },
    latestBadge: {
        position: 'absolute',
        top: theme.spacing.sm,
        right: theme.spacing.sm,
        backgroundColor: theme.colors.primary[500],
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs / 2,
        borderRadius: theme.borderRadius.sm,
    },
    latestBadgeText: {
        color: theme.colors.white,
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.bold,
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
    priceText: {
        color: theme.colors.primary[500],
        fontWeight: theme.typography.fontWeight.bold,
    },
    totalPriceText: {
        color: theme.colors.success.main,
        fontWeight: theme.typography.fontWeight.bold,
        fontSize: theme.typography.fontSize.base,
    },
    descriptionRow: {
        paddingTop: theme.spacing.sm,
    },
    descriptionText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.primary,
        marginTop: theme.spacing.xs,
        lineHeight: 20,
    },
    actionsContainer: {
        padding: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    approveButton: {
        backgroundColor: theme.colors.success.main,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
    },
    approveButtonText: {
        color: theme.colors.white,
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.bold,
    },
    rejectButton: {
        backgroundColor: theme.colors.white,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.error.main,
    },
    rejectButtonText: {
        color: theme.colors.error.main,
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.bold,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    approvedText: {
        color: theme.colors.success.main,
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.bold,
    },
    rejectedText: {
        color: theme.colors.error.main,
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.bold,
    },
    // Messages Tab Styles
    messagesTabContainer: {
        flex: 1,
    },
    messagesList: {
        flex: 1,
    },
    messagesContainer: {
        padding: theme.spacing.md,
        paddingBottom: theme.spacing.lg,
        flexGrow: 1,
    },
    messageWrapper: {
        marginBottom: theme.spacing.sm,
    },
    messageContainer: {
        maxWidth: '75%',
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        marginVertical: theme.spacing.xs,
    },
    customerMessage: {
        alignSelf: 'flex-end',
        backgroundColor: theme.colors.primary[500],
        borderBottomRightRadius: 4,
    },
    supplierMessage: {
        alignSelf: 'flex-start',
        backgroundColor: theme.colors.white,
        borderBottomLeftRadius: 4,
        ...theme.shadows.sm,
    },
    messageText: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.primary,
        lineHeight: 20,
    },
    customerMessageText: {
        color: theme.colors.white,
    },
    messageTime: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
        marginTop: theme.spacing.xs,
        alignSelf: 'flex-end',
    },
    customerMessageTime: {
        color: 'rgba(255, 255, 255, 0.8)',
    },
    emptyMessages: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.xl * 2,
    },
    emptyMessagesText: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.secondary,
        marginTop: theme.spacing.md,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingTop: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        backgroundColor: theme.colors.white,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border.main,
        ...theme.shadows.lg,
    },
    textInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: theme.colors.border.main,
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.primary,
        maxHeight: 100,
        marginRight: theme.spacing.sm,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.colors.primary[500],
        justifyContent: 'center',
        alignItems: 'center',
    },
    addToCartButton: {
        backgroundColor: theme.colors.primary[500],
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: theme.spacing.sm,
    },
    addToCartButtonText: {
        color: theme.colors.white,
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.bold,
    },
    sendButtonDisabled: {
        backgroundColor: theme.colors.text.secondary,
        opacity: 0.5,
    },
});

export default QuoteResponseDetailScreen;
