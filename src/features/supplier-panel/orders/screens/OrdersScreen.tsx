import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, FlatList, Text, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../../styles/colors';
import { TabGroup, type Tab } from '../../components';
import { OrdersHeader, OrderCard, NewOrderCard } from '../components';
import { useOrdersList } from '../hooks/useOrdersList';
import { Order } from '../api/orders.api';

/**
 * Orders Screen
 * Displays orders with tabs for Pending, Shipped, and Issues
 */
const OrdersScreen: React.FC = () => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'pending' | 'shipped' | 'issues'>('pending');

    const tabs: Tab[] = [
        { id: 'pending', label: 'New' },
        { id: 'shipped', label: 'Shipped' },
        { id: 'issues', label: 'Dispute' },
    ];

    const { orders, loading, error, refetch, loadMore, hasMore } = useOrdersList(activeTab);

    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId as 'pending' | 'shipped' | 'issues');
    };

    const handleOrderPress = (order: Order) => {
        // Navigate to order details screen
        router.push('/(supplier-drawer)/order-details');
    };

    const handleAcceptOrder = (order: Order) => {
        // Navigate to order details screen
        router.push('/(supplier-drawer)/order-details');
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
            <View style={styles.header}>
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
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
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
