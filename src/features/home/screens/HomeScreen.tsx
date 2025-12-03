import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    RefreshControl,
} from 'react-native';
import { themeApi } from '@/services/api/theme.api';
import { ThemeCustomization as ThemeCustomizationType } from '@/types/theme.types';
import { ThemeCustomization } from '../components/ThemeCustomization';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { ErrorMessage } from '@/shared/components/ErrorMessage';
import { theme } from '@/theme';
import { useAppSelector } from '@/store/hooks';

/**
 * HomeScreen Component
 * Displays theme customizations (carousels, static content, etc.)
 * Automatically reloads when locale changes
 */
export const HomeScreen: React.FC = () => {
    const { selectedLocale } = useAppSelector((state) => state.core);
    const [customizations, setCustomizations] = useState<ThemeCustomizationType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        if (!selectedLocale?.code) return;

        try {
            setError(null);
            const customizationsData = await themeApi.getCustomizations();
            setCustomizations(customizationsData);
        } catch (err: any) {
            console.error('[HomeScreen] Error loading customizations:', err);
            setError(err.message || 'Failed to load page content');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [selectedLocale?.code]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleRefresh = useCallback(() => {
        setIsRefreshing(true);
        loadData();
    }, [loadData]);

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <ErrorMessage message={error} onRetry={loadData} />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            refreshControl={
                <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
            }
        >
            {customizations.map((customization) => (
                <ThemeCustomization
                    key={customization.id}
                    customization={customization}
                />
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    contentContainer: {
        paddingTop: theme.spacing.xs,
        paddingBottom: theme.spacing.xl * 2,
    },
    errorContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
});

export default HomeScreen;
