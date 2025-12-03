import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCoreConfig, setCurrency } from '@/store/slices/coreSlice';
import { Currency } from '@/services/api/core.api';
import { useTranslation } from 'react-i18next';

export const CurrencySelectionScreen: React.FC = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { currencies, selectedCurrency, isLoading } = useAppSelector((state) => state.core);
    const [isChanging, setIsChanging] = useState(false);

    useEffect(() => {
        // Fetch currencies if not already loaded
        if (currencies.length === 0) {
            dispatch(fetchCoreConfig());
        }
    }, []);

    const handleSelect = async (currency: Currency) => {
        if (isChanging || currency.code === selectedCurrency?.code) return;

        try {
            setIsChanging(true);
            await dispatch(setCurrency(currency)).unwrap();
            
            Alert.alert(
                t('settings.currencyChanged'),
                t('settings.currencyChangeMessage', { currency: currency.name, code: currency.code }),
                [
                    {
                        text: t('common.ok'),
                        onPress: () => {
                            router.back();
                        },
                    },
                ]
            );
        } catch (error) {
            console.error('Error changing currency:', error);
            Alert.alert(t('common.error'), t('settings.changeCurrencyError'));
        } finally {
            setIsChanging(false);
        }
    };

    if (isLoading) {
        return (
            <>
                <Stack.Screen options={{ title: t('settings.selectCurrency'), headerBackTitle: t('common.back') }} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary[500]} />
                    <Text style={styles.loadingText}>{t('settings.loadingCurrencies')}</Text>
                </View>
            </>
        );
    }

    return (
        <>
            <Stack.Screen options={{ title: t('settings.selectCurrency'), headerBackTitle: t('common.back') }} />
            <ScrollView style={styles.container}>
                {currencies.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="cash-outline" size={48} color={theme.colors.gray[400]} />
                        <Text style={styles.emptyText}>{t('settings.noCurrencies')}</Text>
                    </View>
                ) : (
                    currencies.map((currency) => (
                        <TouchableOpacity
                            key={currency.id}
                            style={[
                                styles.option,
                                selectedCurrency?.code === currency.code && styles.selectedOption,
                            ]}
                            onPress={() => handleSelect(currency)}
                            disabled={isChanging}
                        >
                            <View style={styles.optionContent}>
                                <Text
                                    style={[
                                        styles.optionText,
                                        selectedCurrency?.code === currency.code && styles.selectedText,
                                    ]}
                                >
                                    {currency.name}
                                </Text>
                                <Text style={styles.optionSubtext}>
                                    {currency.code} ({currency.symbol})
                                </Text>
                            </View>
                            {selectedCurrency?.code === currency.code && (
                                <Ionicons
                                    name="checkmark-circle"
                                    size={24}
                                    color={theme.colors.primary[500]}
                                />
                            )}
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.default,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background.default,
    },
    loadingText: {
        marginTop: theme.spacing.md,
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text.secondary,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl,
        marginTop: 100,
    },
    emptyText: {
        marginTop: theme.spacing.md,
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text.secondary,
        textAlign: 'center',
    },
    option: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.white,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[100],
    },
    selectedOption: {
        backgroundColor: theme.colors.primary[50],
    },
    optionContent: {
        flex: 1,
    },
    optionText: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text.primary,
        fontWeight: theme.typography.fontWeight.medium,
        marginBottom: 2,
    },
    selectedText: {
        color: theme.colors.primary[500],
        fontWeight: theme.typography.fontWeight.bold,
    },
    optionSubtext: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
    },
});

export default CurrencySelectionScreen;
