import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ActivityIndicator, FlatList, Platform, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabGroup, type Tab } from '../../components';
import { COLORS } from '../../styles/colors';
import { Order } from '../api/orders.api';
import { NewOrderCard, OrderCard, OrdersHeader } from '../components';
import { useOrdersList } from '../hooks/useOrdersList';

/**
 * Orders Screen
 * Displays orders with tabs for Pending, Shipped, and Issues
 */
const OrdersScreen: React.FC = () => {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'pending' | 'shipped' | 'issues'>('pending');

    const tabs: Tab[] = [
        { id: 'pending', label: 'New' },
        { id: 'shipped', label: 'Shipped' },
        { id: 'issues', label: 'Dispute' },
    ];

    const { orders, loading, error, refetch, loadMore, hasMore } = useOrdersList(activeTab);

    // Keep a stable ref to always point at the latest refetch.
    // This prevents useFocusEffect from re-firing when refetch identity
    // changes on tab switch (filter → fetchOrders → refetch all recreate).
    const refetchRef = useRef(refetch);
    useEffect(() => {
        refetchRef.current = refetch;
    }, [refetch]);

    const hasMountedRef = useRef(false);
    useFocusEffect(
        useCallback(() => {
            // Skip the very first focus — hook's useEffect handles initial load.
            // Empty deps means this only fires on real screen focus/blur, never
            // when refetch identity changes due to a tab switch.
            if (!hasMountedRef.current) {
                hasMountedRef.current = true;
                return;
            }
            refetchRef.current();
        }, []) // intentionally empty — refetchRef is always up-to-date via useEffect above
    );

    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId as 'pending' | 'shipped' | 'issues');
    };

    const handleOrderPress = (order: Order) => {
        // Navigate to order details screen with order ID
        router.push(`/(supplier-drawer)/order-details?orderId=${order.id}`);
    };

    const handleAcceptOrder = (order: Order) => {
        // Navigate to order details screen with order ID
        router.push(`/(supplier-drawer)/order-details?orderId=${order.id}`);
    };

    const handleEditOrder = (order: Order) => {
        // TODO: Implement edit order logic
        console.log('Edit order:', order.id);
    };

    const renderOrderCard = ({ item }: { item: Order }) => {
        // Use NewOrderCard for 'pending' (New) tab, regular OrderCard for others
        if (activeTab === 'pending') {
            return (
                <NewOrderCard
                    order={item}
                    onPress={handleOrderPress}
                    onAccept={handleAcceptOrder}
                    onEdit={handleEditOrder}
                />
            );
        }

        return <OrderCard order={item} onPress={handleOrderPress} />;
    };

    const renderEmptyState = () => {
        if (loading) {
            return null;
        }

        return (
            <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                    {error ? error : `No ${activeTab} orders found`}
                </Text>
            </View>
        );
    };

    const renderFooter = () => {
        if (loading && orders.length > 0) {
            return (
                <View style={styles.footer}>
                    <ActivityIndicator size="small" color={COLORS.primary} />
                </View>
            );
        }

        if (!hasMore) {
            return null;
        }

        return null;
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 0) }]}>
                {/* Header */}
                <OrdersHeader />

                {/* Tabs */}
                <TabGroup tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />
            </View>

            {/* Orders List */}
            {loading && orders.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Loading orders...</Text>
                </View>
            ) : (
                <FlatList
                    data={orders}
                    renderItem={renderOrderCard}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={renderEmptyState}
                    ListFooterComponent={renderFooter}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                    refreshControl={
                        <RefreshControl
                            refreshing={false}
                            onRefresh={refetch}
                            colors={[COLORS.primary]}
                            tintColor={COLORS.primary}
                        />
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 60,
        paddingBottom: 16,
        gap: 16,
        backgroundColor: COLORS.background,
    },
    listContent: {
        padding: 16,
        paddingTop: 0,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    loadingText: {
        fontFamily: 'Inter',
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyStateText: {
        fontFamily: 'Inter',
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    footer: {
        paddingVertical: 20,
        alignItems: 'center',
    },
});

export default OrdersScreen;
