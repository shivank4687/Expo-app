import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/features/supplier-panel/styles';

interface InputModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (value: string) => Promise<void>;
    title: string;
    placeholder?: string;
    submitButtonText?: string;
    isLoading?: boolean;
}

export const InputModal: React.FC<InputModalProps> = ({
    visible,
    onClose,
    onSubmit,
    title,
    placeholder = 'Enter value...',
    submitButtonText = 'Add',
    isLoading = false,
}) => {
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState('');

    // Reset input when modal opens
    useEffect(() => {
        if (visible) {
            setInputValue('');
            setError('');
        }
    }, [visible]);

    const handleSubmit = async () => {
        const trimmedValue = inputValue.trim();

        if (!trimmedValue) {
            setError('This field cannot be empty');
            return;
        }

        try {
            await onSubmit(trimmedValue);
            setInputValue('');
            setError('');
            onClose();
        } catch (err) {
            setError('Failed to add. Please try again.');
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            setInputValue('');
            setError('');
            onClose();
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={handleClose}
                disabled={isLoading}
            >
                <View style={styles.container}>
                    <TouchableOpacity activeOpacity={1}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.title}>{title}</Text>
                            <TouchableOpacity
                                onPress={handleClose}
                                style={styles.closeButton}
                                disabled={isLoading}
                            >
                                <Ionicons name="close" size={24} color="#000000" />
                            </TouchableOpacity>
                        </View>

                        {/* Content */}
                        <View style={styles.content}>
                            <TextInput
                                style={[styles.input, error && styles.inputError]}
                                placeholder={placeholder}
                                placeholderTextColor="#666666"
                                value={inputValue}
                                onChangeText={(text) => {
                                    setInputValue(text);
                                    if (error) setError('');
                                }}
                                autoFocus
                                editable={!isLoading}
                            />
                            {error ? (
                                <Text style={styles.errorText}>{error}</Text>
                            ) : null}
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton]}
                                onPress={handleClose}
                                disabled={isLoading}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, styles.submitButton, isLoading && styles.disabledButton]}
                                onPress={handleSubmit}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.submitButtonText}>{submitButtonText}</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000000',
        fontFamily: 'Inter',
    },
    closeButton: {
        padding: 4,
    },
    content: {
        padding: 16,
        gap: 8,
    },
    input: {
        width: '100%',
        height: 48,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#000000',
        fontFamily: 'Inter',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    inputError: {
        borderColor: '#DC2626',
        borderWidth: 2,
    },
    errorText: {
        fontSize: 14,
        color: '#DC2626',
        fontFamily: 'Inter',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    button: {
        flex: 1,
        height: 44,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#000000',
        fontFamily: 'Inter',
    },
    submitButton: {
        backgroundColor: COLORS.primary,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#FFFFFF',
        fontFamily: 'Inter',
    },
    disabledButton: {
        opacity: 0.6,
    },
});
