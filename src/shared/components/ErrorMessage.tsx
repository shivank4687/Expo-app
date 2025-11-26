import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';

interface ErrorMessageProps {
    message: string;
    onRetry?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
    return (
        <View style={styles.container}>
            <Ionicons
                name="alert-circle"
                size={48}
                color={theme.colors.error.main}
            />
            <Text style={styles.message}>{message}</Text>
            {onRetry && (
                <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                    <Text style={styles.retryText}>Try Again</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    message: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.lg,
    },
    retryButton: {
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.md,
        backgroundColor: theme.colors.primary[500],
        borderRadius: theme.borderRadius.md,
    },
    retryText: {
        color: theme.colors.white,
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.semiBold,
    },
});

export default ErrorMessage;
