import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { CartAddress } from '../types/cart.types';
import { useTranslation } from 'react-i18next';

interface CartAddressBarProps {
    address: CartAddress | null;
    onPressChange: () => void;
    onPressAdd: () => void;
    isAuthenticated: boolean;
}

export const CartAddressBar: React.FC<CartAddressBarProps> = ({
    address,
    onPressChange,
    onPressAdd,
    isAuthenticated,
}) => {
    const { t } = useTranslation();

    if (!isAuthenticated) {
        return null;
    }

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Ionicons name="location-outline" size={20} color={theme.colors.primary[500]} />
                {address ? (
                    <Text style={styles.addressText} numberOfLines={1}>
                        {t('cart.deliverTo', 'Deliver to')}: <Text style={styles.boldText}>{address.first_name} {address.last_name}</Text>, {address.address1}, {address.city}
                    </Text>
                ) : (
                    <Text style={styles.noAddressText} numberOfLines={1}>
                        {t('cart.noAddressSelected', 'Select a delivery address')}
                    </Text>
                )}
            </View>
            {address ? (
                <TouchableOpacity
                    onPress={onPressChange}
                    style={styles.actionButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Text style={styles.actionText}>{t('common.change', 'Change')}</Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    onPress={onPressAdd}
                    style={styles.actionButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Text style={styles.actionText}>{t('checkout.addAddress', 'Add')}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.xs,
        paddingVertical: theme.spacing.sm,
        backgroundColor: theme.colors.primary[50],
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200],
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: theme.spacing.sm,
        gap: theme.spacing.xs,
    },
    addressText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.primary,
        flex: 1,
    },
    boldText: {
        fontWeight: theme.typography.fontWeight.bold,
    },
    noAddressText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        fontStyle: 'italic',
        flex: 1,
    },
    actionButton: {
        backgroundColor: theme.colors.primary[500],
        borderRadius: theme.borderRadius.sm,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
