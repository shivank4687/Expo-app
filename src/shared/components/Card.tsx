import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { theme } from '@/theme';

interface CardProps extends ViewProps {
    children: React.ReactNode;
    variant?: 'elevated' | 'outlined' | 'flat';
}

export const Card: React.FC<CardProps> = ({
    children,
    variant = 'elevated',
    style,
    ...props
}) => {
    return (
        <View
            style={[
                styles.card,
                variant === 'elevated' && styles.elevated,
                variant === 'outlined' && styles.outlined,
                variant === 'flat' && styles.flat,
                style,
            ]}
            {...props}
        >
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        backgroundColor: theme.colors.white,
    },
    elevated: {
        ...theme.shadows.md,
    },
    outlined: {
        borderWidth: 1,
        borderColor: theme.colors.border.light,
    },
    flat: {
        backgroundColor: theme.colors.background.paper,
    },
});

export default Card;
