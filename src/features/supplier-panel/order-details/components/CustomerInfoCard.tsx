import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../styles/colors';
import { OrderDetailsResponse } from '../../orders/api/orders.api';

interface CustomerInfoCardProps {
    order: OrderDetailsResponse['data'];
}

export const CustomerInfoCard = ({ order }: CustomerInfoCardProps) => {
    const { customer_first_name, customer_last_name, customer_email, billing_address } = order;
    const fullName = `${customer_first_name || ''} ${customer_last_name || ''}`.trim();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Customer</Text>

            <View style={styles.content}>
                <View style={styles.infoRow}>
                    <Text style={styles.label}>Full Name</Text>
                    <Text style={styles.value}>{fullName || 'Guest'}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.label}>Email</Text>
                    <Text style={styles.value}>{customer_email || 'N/A'}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.label}>Phone</Text>
                    <Text style={styles.value}>{billing_address?.phone || 'N/A'}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Text style={styles.label}>Group</Text>
                    <Text style={styles.value}>{order.customer_group_name || 'General'}</Text>
                </View>
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
    content: {
        gap: 12,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 14,
        color: '#6B7280',
    },
    value: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 14,
        color: '#000000',
    },
});
