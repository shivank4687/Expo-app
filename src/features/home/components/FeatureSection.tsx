import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '@/theme';
import { useTranslation } from 'react-i18next';

interface FeatureSectionProps {
    title: string;
    subtitle?: string;
    onViewAll?: () => void;
    children: React.ReactNode;
    containerStyle?: any;
    showViewAll?: boolean;
}

export const FeatureSection: React.FC<FeatureSectionProps> = ({
    title,
    subtitle,
    onViewAll,
    children,
    containerStyle,
    showViewAll = true,
}) => {
    const { t } = useTranslation();

    return (
        <View style={[styles.container, containerStyle]}>
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>{title}</Text>
                    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                </View>
                {showViewAll && (
                    <TouchableOpacity onPress={onViewAll} activeOpacity={0.7}>
                        <Text style={styles.viewAll}>{t('common.viewAll', 'View All')}</Text>
                    </TouchableOpacity>
                )}
            </View>
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: theme.spacing.lg,
        backgroundColor: theme.colors.background.default,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },
    titleContainer: {
        flex: 1,
    },
    title: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
    },
    subtitle: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
        marginTop: 2,
    },
    viewAll: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.primary[500],
    },
    content: {
        // Content padding is usually handled by the children themselves (e.g. horizontal scroll contentContainerStyle)
    },
});
