import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '../../styles';

export interface SectionCardProps {
    title: string;
    subtitle?: string;
    children: ReactNode;
    style?: ViewStyle;
}

export const SectionCard: React.FC<SectionCardProps> = ({
    title,
    subtitle,
    children,
    style,
}) => {
    return (
        <View style={[styles.card, style]}>
            <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: 16,
        gap: 16,
        width: '100%',
        backgroundColor: COLORS.white,
        borderRadius: 16,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
    },
    header: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 4,
        alignSelf: 'stretch',
    },
    title: {
        fontFamily: 'Inter',
        fontWeight: '700',
        fontSize: 24,
        lineHeight: 24,
        color: COLORS.textPrimary,
        alignSelf: 'stretch',
    },
    subtitle: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 14,
        lineHeight: 20,
        color: COLORS.textSecondary,
        alignSelf: 'stretch',
    },
});
