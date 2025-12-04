/**
 * EmptyCart Component
 * Displays when cart is empty with motivational message
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/Button';
import { theme } from '@/theme';

export const EmptyCart: React.FC = () => {
    const router = useRouter();
    const { t } = useTranslation();

    const handleContinueShopping = () => {
        router.push('/(drawer)/(tabs)');
    };

    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <Ionicons 
                    name="cart-outline" 
                    size={120} 
                    color={theme.colors.gray[300]} 
                />
            </View>
            
            <Text style={styles.title}>{t('cart.emptyCart')}</Text>
            
            <Text style={styles.message}>
                {t('cart.emptyCartMessage')}
            </Text>
            
            <Text style={styles.subMessage}>
                {t('cart.emptyCartSubMessage')}
            </Text>

            <Button
                title={t('cart.continueShopping')}
                onPress={handleContinueShopping}
                style={styles.button}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.xl,
        backgroundColor: theme.colors.background.default,
    },
    iconContainer: {
        marginBottom: theme.spacing.xl,
    },
    title: {
        fontSize: theme.typography.fontSize.xxl,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
        textAlign: 'center',
    },
    message: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        marginBottom: theme.spacing.sm,
        lineHeight: 24,
    },
    subMessage: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        marginBottom: theme.spacing.xxl * 2,
        lineHeight: 20,
    },
    button: {
        minWidth: 200,
        marginTop: theme.spacing.lg,
    },
});

