import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { theme } from '@/theme';
import { useAppSelector } from '@/store/hooks';
import { TopHeader } from '@/shared/components/TopHeader';

export const PreferencesScreen: React.FC = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const { selectedLocale, selectedCurrency } = useAppSelector((state) => state.core);

    const preferences = [
        {
            id: 'language',
            title: t('drawer.language'),
            subtitle: t('settings.languageDescription', 'Manage your app language'),
            icon: 'language-outline',
            value: selectedLocale?.name || 'English',
            route: '/language-selection',
        },
        {
            id: 'currency',
            title: t('drawer.currency'),
            subtitle: t('settings.currencyDescription', 'Manage your preferred currency'),
            icon: 'cash-outline',
            value: selectedCurrency?.code || 'USD',
            route: '/currency-selection',
        },
    ];

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <TopHeader title={t('drawer.preferences')} onBack={() => router.back()} />
            
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <View style={styles.listContainer}>
                    {preferences.map((item) => (
                        <TouchableOpacity 
                            key={item.id} 
                            style={styles.listItem} 
                            onPress={() => router.push(item.route as any)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.iconContainer}>
                                <Ionicons name={item.icon as any} size={20} color={theme.colors.primary[500]} />
                            </View>
                            <View style={styles.itemTextContainer}>
                                <Text style={styles.itemTitle}>{item.title}</Text>
                                <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                            </View>
                            <View style={styles.rightContent}>
                                <Text style={styles.valueText}>{item.value}</Text>
                                <Ionicons name="chevron-forward" size={16} color={theme.colors.text.secondary} />
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.default,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
    listContainer: {
        gap: 12,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 12,
        backgroundColor: theme.colors.background.paper,
        borderWidth: 1,
        borderColor: theme.colors.gray[200],
        borderRadius: 12,
        width: '100%',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.colors.primary[50],
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemTextContainer: {
        flex: 1,
        gap: 2,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text.primary,
    },
    itemSubtitle: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        opacity: 0.8,
    },
    rightContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    valueText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.primary[500],
    },
});

export default PreferencesScreen;
