import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ServicesContentOptions } from '@/types/theme.types';
import { theme } from '@/theme';

interface ServicesContentProps {
    options: ServicesContentOptions;
}

// Mapping from Bagisto icon classes to Ionicons
// Based on common default icons in Bagisto themes
const ICON_MAPPING: Record<string, keyof typeof Ionicons.glyphMap> = {
    'icon-truck': 'car-outline',     // Free Shipping
    'icon-support': 'headset-outline', // Support 24/7
    'icon-dollar': 'cash-outline',     // Money Back
    'icon-card': 'card-outline',       // Payment Secure
    'icon-return': 'refresh-outline',  // Return
    'icon-shield': 'shield-checkmark-outline', // Secure
    'icon-cube': 'cube-outline',
};

export const ServicesContent: React.FC<ServicesContentProps> = ({ options }) => {
    if (!options?.services || options.services.length === 0) {
        return null;
    }

    const getIconName = (iconClass: string): keyof typeof Ionicons.glyphMap => {
        // Simple mapping attempt
        // Remove 'icon-' prefix to match looser keys if needed
        const cleanClass = iconClass.replace('icon-', '');

        if (ICON_MAPPING[iconClass]) return ICON_MAPPING[iconClass];

        // Try to guess based on class name keywords
        if (cleanClass.includes('shipping') || cleanClass.includes('truck')) return 'car-outline';
        if (cleanClass.includes('support') || cleanClass.includes('help')) return 'headset-outline';
        if (cleanClass.includes('money') || cleanClass.includes('dollar') || cleanClass.includes('payment')) return 'card-outline';
        if (cleanClass.includes('return') || cleanClass.includes('exchange')) return 'refresh-outline';

        return 'star-outline'; // Default fallback
    };

    return (
        <View style={styles.container}>
            <View style={styles.servicesGrid}>
                {options.services.map((service, index) => (
                    <View key={index} style={styles.serviceItem}>
                        <View style={styles.iconContainer}>
                            <Ionicons
                                name={getIconName(service.service_icon)}
                                size={24}
                                color={theme.colors.text.primary}
                            />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.title}>{service.title}</Text>
                            <Text style={styles.description}>{service.description}</Text>
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: theme.spacing.xl,
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.lg,
    },
    servicesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: theme.spacing.lg,
    },
    serviceItem: {
        width: '48%', // Ensure 2 items per row
        alignItems: 'center',
        marginBottom: theme.spacing.md,
        backgroundColor: '#FFFFFF',
        gap: theme.spacing.sm,
        paddingHorizontal: theme.spacing.xs,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: theme.colors.text.primary,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        marginBottom: theme.spacing.xs,
    },
    textContainer: {
        alignItems: 'center',
        width: '100%',
    },
    title: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
        marginBottom: 4,
        textAlign: 'center',
    },
    description: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
        lineHeight: 16,
        textAlign: 'center',
    },
});
