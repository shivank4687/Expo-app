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

const INPUT_ICON_COLOR = '#7D8A8C';

interface InputProps extends TextInputProps {
    label?: string;
    labelStyle?: any;
    error?: string;
    leftIcon?: keyof typeof Ionicons.glyphMap;
    rightIcon?: keyof typeof Ionicons.glyphMap;
    onRightIconPress?: () => void;
    containerStyle?: any;
    inputContainerStyle?: any;
    leftPrefix?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
    label,
    labelStyle,
    error,
    leftIcon,
    rightIcon,
    onRightIconPress,
    containerStyle,
    inputContainerStyle,
    style,
    secureTextEntry,
    leftPrefix,
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
            {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}

            <View
                style={[
                    styles.inputContainer,
                    inputContainerStyle,
                    error && styles.inputContainerError,
                ]}
            >
                {leftPrefix ? (
                    leftPrefix
                ) : leftIcon ? (
                    <Ionicons
                        name={leftIcon}
                        size={20}
                        color={INPUT_ICON_COLOR}
                        style={styles.leftIcon}
                    />
                ) : null}

                <TextInput
                    {...props}
                    style={[styles.input, style]}
                placeholderTextColor="#7D8A8C"
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
                        color={INPUT_ICON_COLOR}
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
                        color={INPUT_ICON_COLOR}
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
        color: '#0A292D',
        marginBottom: theme.spacing.xs,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E1D9CF',
        borderRadius: theme.borderRadius.md,
        backgroundColor: '#FAF9F6',
        paddingHorizontal: theme.spacing.md,
    },
    inputContainerError: {
        borderColor: theme.colors.error.main,
    },
    input: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        fontSize: theme.typography.fontSize.base,
        color: '#0A292D',
        fontFamily: 'Inter',
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
