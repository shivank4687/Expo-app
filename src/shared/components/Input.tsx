import React, { useState, useCallback } from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    TextInputProps,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    leftIcon?: keyof typeof Ionicons.glyphMap;
    rightIcon?: keyof typeof Ionicons.glyphMap;
    onRightIconPress?: () => void;
    containerStyle?: any;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    leftIcon,
    rightIcon,
    onRightIconPress,
    containerStyle,
    style,
    secureTextEntry,
    ...props
}) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const isPassword = secureTextEntry;
    const actualSecureTextEntry = isPassword && !isPasswordVisible;

    const togglePasswordVisibility = useCallback(() => {
        setIsPasswordVisible(prev => !prev);
    }, []);

    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}

            <View
                style={[
                    styles.inputContainer,
                    error && styles.inputContainerError,
                ]}
            >
                {leftIcon && (
                    <Ionicons
                        name={leftIcon}
                        size={20}
                        color={theme.colors.neutral[400]}
                        style={styles.leftIcon}
                    />
                )}

                <TextInput
                    {...props}
                    style={[styles.input, style]}
                    placeholderTextColor={theme.colors.neutral[400]}
                    secureTextEntry={actualSecureTextEntry}
                />

                {isPassword && (
                    <TouchableOpacity
                        onPress={togglePasswordVisibility}
                        style={styles.rightIcon}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={isPasswordVisible ? 'eye-off' : 'eye'}
                            size={20}
                            color={theme.colors.neutral[400]}
                        />
                    </TouchableOpacity>
                )}

                {rightIcon && !isPassword && (
                    <TouchableOpacity
                        onPress={onRightIconPress}
                        style={styles.rightIcon}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={rightIcon}
                            size={20}
                            color={theme.colors.neutral[400]}
                        />
                    </TouchableOpacity>
                )}
            </View>

            {error && <Text style={styles.error}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: theme.spacing.md,
    },
    label: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border.main,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.white,
        paddingHorizontal: theme.spacing.md,
    },
    inputContainerError: {
        borderColor: theme.colors.error.main,
    },
    input: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.primary,
    },
    leftIcon: {
        marginRight: theme.spacing.sm,
    },
    rightIcon: {
        marginLeft: theme.spacing.sm,
        padding: theme.spacing.xs,
    },
    error: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.error.main,
        marginTop: theme.spacing.xs,
    },
});

export default Input;
