import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useRFQDetails } from '../hooks/useRFQDetails';
import { useRFQQuotes } from '../hooks/useRFQQuotes';
import { useRFQMessages } from '../hooks/useRFQMessages';
import { COLORS } from '../../styles/colors';

import RFQDetailsTab from '../components/RFQDetailsTab';
import RFQQuotesTab from '../components/RFQQuotesTab';
import RFQMessagesTab from '../components/RFQMessagesTab';
import { TabGroup, type Tab } from '@/shared/components';

type TabView = 'details' | 'quotes' | 'messages';
const TABS: TabView[] = ['details', 'quotes', 'messages'];

export function RFQDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const quoteId = Number(params.quoteId);
    const productId = Number(params.productId);
    const fromScreen = params.from as string | undefined;

    const [activeTab, setActiveTab] = useState<TabView>(
        (params.initialTab as TabView) || 'details'
    );
    const [unreadCount, setUnreadCount] = useState(0);

    const { data: detailsData, loading: detailsLoading, refetch: refetchDetails } = useRFQDetails(quoteId, productId);
    const { data: quotesData, loading: quotesLoading, refetch: refetchQuotes } = useRFQQuotes(quoteId, productId);

    // Mirror the web app: messages are keyed by supplierFirstQuote.id, not supplierLastQuote.id
    const resolvedSupplierQuoteId = quotesData?.supplierFirstQuote?.id as number | undefined;
    const resolvedCustomerQuoteId = detailsData?.customerQuote?.id as number | undefined;

    // Use a ref so the socket callback always reads the current tab without stale closures
    const activeTabRef = useRef(activeTab);
    useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

    // Called directly from the socket when a customer message arrives —
    // mirrors the web's `@new-message` event emitted by the chat component.
    // Only increment badge if supplier is NOT already on the messages tab.
    const handleNewSocketMessage = useCallback(() => {
        if (activeTabRef.current !== 'messages') {
            setUnreadCount(c => c + 1);
        }
    }, []);

    const { messages, loading: messagesLoading, sendMessage, sending, leaveRoom } = useRFQMessages(
        quoteId,
        resolvedSupplierQuoteId,
        resolvedCustomerQuoteId,
        handleNewSocketMessage,
    );

    // Defined after hooks so leaveRoom is in scope
    const handleBack = () => {
        leaveRoom();
        if (fromScreen === 'notifications') {
            router.push('/(supplier-drawer)/notifications' as any);
        } else {
            router.back();
        }
    };

    const tabs = useMemo<Tab[]>(() =>
        TABS.map((tab) => ({
            id: tab,
            label: tab.charAt(0).toUpperCase() + tab.slice(1),
        })),
    []);

    const handleTabPress = useCallback((tabId: string) => {
        const tab = tabId as TabView;
        setActiveTab(tab);
        if (tab === 'messages') {
            setUnreadCount(0);
        }
    }, []);

    const handleSend = async (text: string) => {
        if (!text.trim()) return;
        await sendMessage(text);
    };

    const handleRefresh = () => {
        refetchDetails();
        refetchQuotes();
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>RFQ #{quoteId}</Text>
            </View>

            {/* Tab Bar */}
            <View style={styles.tabsWrapper}>
                <TabGroup
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabChange={handleTabPress}
                    containerStyle={styles.tabsContainer}
                    tabStyle={styles.tab}
                    activeTabStyle={styles.tabActive}
                    tabTextStyle={styles.tabText}
                    activeTabTextStyle={styles.tabTextActive}
                    renderTabBadge={(tab, isActive) =>
                        tab.id === 'messages' && unreadCount > 0 && !isActive ? (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </Text>
                            </View>
                        ) : null
                    }
                />
            </View>

            {/* Content */}
            <View style={styles.content}>
                {activeTab === 'details' && (
                    <RFQDetailsTab data={detailsData} loading={detailsLoading} />
                )}
                {activeTab === 'quotes' && (
                    <RFQQuotesTab
                        data={quotesData}
                        loading={quotesLoading}
                        productId={productId}
                        customerQuote={detailsData?.customerQuote}
                        onRefresh={handleRefresh}
                    />
                )}
                {activeTab === 'messages' && (
                    <RFQMessagesTab
                        messages={messages}
                        loading={messagesLoading}
                        sending={sending}
                        hasRequiredIds={!!(resolvedSupplierQuoteId && resolvedCustomerQuoteId)}
                        onSend={handleSend}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    backButton: { marginRight: 16 },
    headerTitle: { fontSize: 20, fontWeight: '700' },

    tabsWrapper: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: COLORS.background,
    },
    tabsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 4,
        minHeight: 42,
        backgroundColor: COLORS.white,
        borderRadius: 8,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 8,
        minHeight: 34,
        borderRadius: 4,
    },
    tabActive: {
        backgroundColor: '#00615E',
        borderWidth: 1,
        borderColor: '#00615E',
    },
    tabText: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 14,
        lineHeight: 18,
        includeFontPadding: false,
        textAlignVertical: 'center',
        color: '#000000',
    },
    tabTextActive: { color: '#FFFFFF' },

    badge: {
        backgroundColor: '#E53935',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        paddingHorizontal: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700',
        lineHeight: 12,
    },

    content: { flex: 1, backgroundColor: COLORS.background },
});
