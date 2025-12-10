/**
 * OrderAddressCard Component
 * Displays shipping or billing address
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { OrderAddress } from '@/services/api/orders.api';

interface OrderAddressCardProps {
    address: OrderAddress;
    type: 'shipping' | 'billing';
}

export const OrderAddressCard: React.FC<OrderAddressCardProps> = ({ address, type }) => {
    const { t } = useTranslation();

    const addressLines = address.address1 || address.address || [];
    const addressArray = Array.isArray(addressLines) ? addressLines : [addressLines];

    const iconName = type === 'shipping' ? 'car-outline' : 'card-outline';
    const title = type === 'shipping' 
        ? t('orders.shippingAddress', 'Shipping Address')
        : t('orders.billingAddress', 'Billing Address');

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Ionicons name={iconName} size={20} color={theme.colors.primary[500]} />
                <Text style={styles.title}>{title}</Text>
            </View>

            <View style={styles.content}>
                {/* Name */}
                <Text style={styles.name}>
                    {address.first_name} {address.last_name}
                </Text>

                {/* Company */}
                {address.company_name && (
                    <Text style={styles.text}>{address.company_name}</Text>
                )}

                {/* Address Lines */}
                {addressArray.map((line, index) => (
                    <Text key={index} style={styles.text}>
                        {line}
                    </Text>
                ))}

                {/* Address 2 */}
                {address.address2 && (
                    <Text style={styles.text}>{address.address2}</Text>
                )}

                {/* City, State, Postcode */}
                <Text style={styles.text}>
                    {[address.city, address.state, address.postcode]
                        .filter(Boolean)
                        .join(', ')}
                </Text>

                {/* Country */}
                {(address.country_name || address.country) && (
                    <Text style={styles.text}>
                        {address.country_name || address.country}
                    </Text>
                )}

                {/* Phone */}
                {address.phone && (
                    <View style={styles.phoneRow}>
                        <Ionicons 
                            name="call-outline" 
                            size={16} 
                            color={theme.colors.text.secondary} 
                        />
                        <Text style={styles.phone}>{address.phone}</Text>
                    </View>
                )}

                {/* Email */}
                {address.email && (
                    <View style={styles.emailRow}>
                        <Ionicons 
                            name="mail-outline" 
                            size={16} 
                            color={theme.colors.text.secondary} 
                        />
                        <Text style={styles.email}>{address.email}</Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.md,
        marginHorizontal: theme.spacing.md,
        marginVertical: theme.spacing.sm,
        padding: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.gray[200],
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.md,
        paddingBottom: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200],
    },
    title: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
    },
    content: {
        gap: theme.spacing.xs,
    },
    name: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    text: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        lineHeight: 20,
    },
    phoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
        marginTop: theme.spacing.xs,
    },
    phone: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
    },
    emailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
    },
    email: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
    },
});

