import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../styles';

export interface InfoCardProps {
    icon?: keyof typeof Ionicons.glyphMap;
    iconSize?: number;
    iconColor?: string;
    title: string;
    description: string;
    imagePlaceholder?: boolean;
    style?: ViewStyle;
    children?: ReactNode;
}

export const InfoCard: React.FC<InfoCardProps> = ({
    icon,
    iconSize = 40,
    iconColor = COLORS.textTertiary,
    title,
    description,
    imagePlaceholder = false,
    style,
    children,
}) => {
    return (
        <View style={[styles.card, style]}>
            {imagePlaceholder ? (
                <View style={styles.imagePlaceholder}>
                    <Ionicons name="image-outline" size={iconSize} color={iconColor} />
                </View>
            ) : icon ? (
                <View style={styles.iconContainer}>
                    <Ionicons name={icon} size={iconSize} color={iconColor} />
                </View>
            ) : null}

            <View style={styles.textContent}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.description}>{description}</Text>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 16,
        width: '100%',
        backgroundColor: COLORS.white,
        borderRadius: 16,
        shadowColor: COLORS.shadow,
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
    },
    imagePlaceholder: {
        width: 104,
        backgroundColor: '#E2E2E2',
        borderRadius: 8,
        alignSelf: 'stretch',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContent: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        gap: 8,
        flex: 1,
    },
    title: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: COLORS.textPrimary,
    },
    description: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 14,
        lineHeight: 20,
        color: COLORS.textSecondary,
    },
});
