import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
    TouchableOpacityProps,
} from 'react-native';
import { theme } from '@/theme';

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: 'primary' | 'secondary' | 'outline';
    size?: 'small' | 'medium' | 'large';
    loading?: boolean;
    fullWidth?: boolean;
    icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    variant = 'primary',
    size = 'medium',
    loading = false,
    fullWidth = false,
    icon,
    disabled,
    style,
    ...props
}) => {
    const buttonStyles: ViewStyle[] = [
        styles.button,
        styles[variant],
        styles[`${size}Button`],
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
    ];

    const textStyles: TextStyle[] = [
        styles.text,
        styles[`${variant}Text`],
        styles[`${size}Text`],
        disabled && styles.disabledText,
    ];

    return (
        <TouchableOpacity
            style={buttonStyles}
            disabled={disabled || loading}
            activeOpacity={0.7}
            {...props}
        >
            {loading ? (
                <ActivityIndicator
                    color={variant === 'outline' ? theme.colors.primary[500] : theme.colors.white}
                />
            ) : (
                <>
                    {icon}
                    <Text style={textStyles}>{title}</Text>
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.borderRadius.md,
        gap: theme.spacing.sm,
    },

    // Variants
    primary: {
        backgroundColor: theme.colors.primary[500],
    },
    secondary: {
        backgroundColor: theme.colors.secondary[500],
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.colors.primary[500],
    },

    // Sizes
    smallButton: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
    },
    mediumButton: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
    },
    largeButton: {
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.lg,
    },

    // Text styles
    text: {
        fontWeight: theme.typography.fontWeight.semiBold,
    },
    primaryText: {
        color: theme.colors.white,
    },
    secondaryText: {
        color: theme.colors.white,
    },
    outlineText: {
        color: theme.colors.primary[500],
    },

    // Text sizes
    smallText: {
        fontSize: theme.typography.fontSize.sm,
    },
    mediumText: {
        fontSize: theme.typography.fontSize.base,
    },
    largeText: {
        fontSize: theme.typography.fontSize.lg,
    },

    // States
    fullWidth: {
        width: '100%',
    },
    disabled: {
        opacity: 0.5,
    },
    disabledText: {
        opacity: 0.7,
    },
});

export default Button;
