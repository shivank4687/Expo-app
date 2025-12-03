import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCoreConfig, setLocale } from '@/store/slices/coreSlice';
import { Locale } from '@/services/api/core.api';
import { useTranslation } from 'react-i18next';

export const LanguageSelectionScreen: React.FC = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { locales, selectedLocale, isLoading } = useAppSelector((state) => state.core);
    const [isChanging, setIsChanging] = useState(false);

    useEffect(() => {
        // Fetch locales if not already loaded
        if (locales.length === 0) {
            dispatch(fetchCoreConfig());
        }
    }, []);

    const handleSelect = async (locale: Locale) => {
        if (isChanging || locale.code === selectedLocale?.code) return;

        try {
            setIsChanging(true);
            await dispatch(setLocale(locale)).unwrap();
            
            Alert.alert(
                t('settings.languageChanged'),
                t('settings.languageChangeMessage', { language: locale.name }),
                [
                    {
                        text: t('common.ok'),
                        onPress: () => {
                            // Navigate back and optionally reload the app
                            router.back();
                        },
                    },
                ]
            );
        } catch (error) {
            console.error('Error changing language:', error);
            Alert.alert(t('common.error'), t('settings.changeLanguageError'));
        } finally {
            setIsChanging(false);
        }
    };

    if (isLoading) {
        return (
            <>
                <Stack.Screen options={{ title: t('settings.selectLanguage'), headerBackTitle: t('common.back') }} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary[500]} />
                    <Text style={styles.loadingText}>{t('settings.loadingLanguages')}</Text>
                </View>
            </>
        );
    }

    return (
        <>
            <Stack.Screen options={{ title: t('settings.selectLanguage'), headerBackTitle: t('common.back') }} />
            <ScrollView style={styles.container}>
                {locales.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="language-outline" size={48} color={theme.colors.gray[400]} />
                        <Text style={styles.emptyText}>{t('settings.noLanguages')}</Text>
                    </View>
                ) : (
                    locales.map((locale) => (
                        <TouchableOpacity
                            key={locale.id}
                            style={[
                                styles.option,
                                selectedLocale?.code === locale.code && styles.selectedOption,
                            ]}
                            onPress={() => handleSelect(locale)}
                            disabled={isChanging}
                        >
                            <View style={styles.optionContent}>
                                <Text
                                    style={[
                                        styles.optionText,
                                        selectedLocale?.code === locale.code && styles.selectedText,
                                    ]}
                                >
                                    {locale.name}
                                </Text>
                                <Text style={styles.optionSubtext}>{locale.code.toUpperCase()}</Text>
                            </View>
                            {selectedLocale?.code === locale.code && (
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
    },
    selectedText: {
        color: theme.colors.primary[500],
        fontWeight: theme.typography.fontWeight.bold,
    },
    optionSubtext: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
});

export default LanguageSelectionScreen;
