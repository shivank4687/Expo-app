import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../styles';

export interface IconButtonProps {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
    disabled?: boolean;
    size?: number;
    iconColor?: string;
    backgroundColor?: string;
    borderColor?: string;
    style?: ViewStyle;
}

export const IconButton: React.FC<IconButtonProps> = ({
    icon,
    onPress,
    disabled = false,
    size = 16,
    iconColor = COLORS.black,
    backgroundColor = COLORS.primaryLight,
    borderColor = COLORS.primary,
    style,
}) => {
    return (
        <TouchableOpacity
            style={[
                styles.button,
                { backgroundColor, borderColor },
                disabled && styles.disabled,
                style,
            ]}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.7}
        >
            <Ionicons name={icon} size={size} color={iconColor} />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        borderWidth: 1,
        borderRadius: 8,
    },
    disabled: {
        opacity: 0.5,
    },
});
