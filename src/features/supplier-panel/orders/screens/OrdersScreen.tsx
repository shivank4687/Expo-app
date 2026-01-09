import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, FlatList, Text, ActivityIndicator, RefreshControl } from 'react-native';
import { COLORS } from '../../styles/colors';
import { TabGroup, type Tab } from '../../components';
import { OrdersHeader, OrderCard } from '../components';
import { useOrdersList } from '../hooks/useOrdersList';
import { Order } from '../api/orders.api';

/**
 * Orders Screen
 * Displays orders with tabs for Pending, Shipped, and Issues
 */
const OrdersScreen: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'pending' | 'shipped' | 'issues'>('pending');

    const tabs: Tab[] = [
        { id: 'pending', label: 'Pending' },
        { id: 'shipped', label: 'Shipped' },
        { id: 'issues', label: 'Issues' },
    ];

    const { orders, loading, error, refetch, loadMore, hasMore } = useOrdersList(activeTab);

    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId as 'pending' | 'shipped' | 'issues');
    };

    const handleOrderPress = (order: Order) => {
        // TODO: Navigate to order details screen
        console.log('Order pressed:', order.id);
    };

    const renderOrderCard = ({ item }: { item: Order }) => (
        <OrderCard order={item} onPress={handleOrderPress} />
    );

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
        if (!hasMore || loading) {
            return null;
        }

        return (
            <View style={styles.footer}>
                <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
        );
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
                            refreshing={loading && orders.length > 0}
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
        paddingTop: 16,
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
