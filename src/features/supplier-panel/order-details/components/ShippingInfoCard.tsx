import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../styles/colors';
import { OrderDetailsResponse } from '../../orders/api/orders.api';

interface ShippingInfoCardProps {
    order: OrderDetailsResponse['data'];
}

export const ShippingInfoCard = ({ order }: ShippingInfoCardProps) => {
    const { shipping_address, billing_address, shipping_method, payment_method } = order;

    const renderAddress = (title: string, address: typeof shipping_address) => {
        if (!address) return null;
        return (
            <View style={styles.section}>
                <Text style={styles.subtitle}>{title}</Text>
                <View style={styles.addressBox}>
                    <Text style={styles.addressText}>
                        {address.first_name} {address.last_name}
                    </Text>
                    <Text style={styles.addressText}>{address.address1}</Text>
                    <Text style={styles.addressText}>
                        {address.city}, {address.state} {address.postcode}
                    </Text>
                    <Text style={styles.addressText}>{address.country}</Text>
                    {address.phone && <Text style={styles.addressText}>{address.phone}</Text>}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Shipping & Payment</Text>

            {renderAddress('Shipping Address', shipping_address)}
            {renderAddress('Billing Address', billing_address)}

            <View style={styles.section}>
                <Text style={styles.subtitle}>Shipping Method</Text>
                <Text style={styles.value}>{shipping_method || 'N/A'}</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.subtitle}>Payment Method</Text>
                <Text style={styles.value}>{payment_method || 'N/A'}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 8,
        padding: 16,
        gap: 16,
    },
    title: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 16,
        color: '#000000',
    },
    section: {
        gap: 8,
    },
    subtitle: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 14,
        color: '#6B7280',
    },
    addressBox: {
        gap: 2,
    },
    addressText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 14,
        lineHeight: 20,
        color: '#000000',
    },
    value: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 14,
        color: '#000000',
    },
});
