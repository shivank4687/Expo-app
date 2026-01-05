import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { COLORS } from '../../styles';

export interface PrimaryButtonProps {
    title: string;
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
    size?: 'small' | 'medium' | 'large';
    fullWidth?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
    title,
    onPress,
    disabled = false,
    loading = false,
    size = 'medium',
    fullWidth = false,
    style,
    textStyle,
}) => {
    const isDisabled = disabled || loading;

    return (
        <TouchableOpacity
            style={[
                styles.button,
                styles[size],
                fullWidth && styles.fullWidth,
                isDisabled && styles.disabled,
                style,
            ]}
            onPress={onPress}
            disabled={isDisabled}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
                <Text style={[styles.text, styles[`text${capitalize(size)}`], textStyle]}>
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
};

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: 8,
    },
    small: {
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    medium: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    large: {
        paddingVertical: 16,
        paddingHorizontal: 24,
    },
    fullWidth: {
        width: '100%',
    },
    disabled: {
        backgroundColor: COLORS.textSecondary,
        opacity: 0.5,
    },
    text: {
        fontFamily: 'Inter',
        fontWeight: '500',
        color: COLORS.white,
    },
    textSmall: {
        fontSize: 12,
    },
    textMedium: {
        fontSize: 14,
    },
    textLarge: {
        fontSize: 16,
    },
});
