import React from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { OrderInfoCard } from './OrderInfoCard';
import { CustomerInfoCard } from './CustomerInfoCard';
import { ShippingInfoCard } from './ShippingInfoCard';
import { OrderDetailsResponse } from '../../orders/api/orders.api';

interface OrderDetailsTabProps {
    order?: OrderDetailsResponse['data'];
    onVoucherRegenerated?: (newPaymentData: any) => void;
    onRefundPress?: () => void;
}

import { PaymentInfoCard } from './PaymentInfoCard';

export const OrderDetailsTab = ({ order, onVoucherRegenerated, onRefundPress }: OrderDetailsTabProps) => {
    if (!order) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Loading details...</Text>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
            <OrderInfoCard order={order} onRefundPress={onRefundPress} />
            <CustomerInfoCard order={order} />
            <ShippingInfoCard order={order} />
            <PaymentInfoCard order={order} onVoucherRegenerated={onVoucherRegenerated} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 16,
        gap: 16,
    },
    loadingText: {
        textAlign: 'center',
        padding: 20,
        color: '#6B7280',
        fontFamily: 'Inter',
    },
});
