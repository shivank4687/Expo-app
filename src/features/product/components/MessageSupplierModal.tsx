import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { Button } from '@/shared/components/Button';

interface MessageSupplierModalProps {
    visible: boolean;
    supplierId: number;
    supplierCompanyName: string;
    onClose: () => void;
    onSuccess?: () => void;
}

export const MessageSupplierModal: React.FC<MessageSupplierModalProps> = ({
    visible,
    supplierId,
    supplierCompanyName,
    onClose,
    onSuccess,
}) => {
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        // Validate message
        if (!message.trim()) {
            setError('Please enter a message');
            return;
        }

        if (message.trim().length < 3) {
            setError('Message must be at least 3 characters');
            return;
        }

        setError(null);
        setIsSubmitting(true);

        try {
            // Import API dynamically to avoid circular dependencies
            const { suppliersApi } = await import('@/services/api/suppliers.api');
            
            await suppliersApi.sendMessageToSupplier({
                supplier_id: supplierId,
                message: message.trim(),
            });

            // Reset form
            setMessage('');
            setError(null);
            
            // Close modal and call success callback
            onClose();
            if (onSuccess) {
                onSuccess();
            }
        } catch (err: any) {
            setError(err.message || 'Failed to send message. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setMessage('');
            setError(null);
            onClose();
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <TouchableOpacity
                    style={styles.overlay}
                    activeOpacity={1}
                    onPress={handleClose}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <View style={styles.modalContent}>
                            {/* Header */}
                            <View style={styles.header}>
                                <View style={styles.headerTitleContainer}>
                                    <Text style={styles.headerTitle}>
                                        Message Supplier
                                    </Text>
                                    <Text style={styles.headerSubtitle} numberOfLines={1}>
                                        {supplierCompanyName}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={handleClose}
                                    disabled={isSubmitting}
                                    style={styles.closeButton}
                                >
                                    <Ionicons
                                        name="close"
                                        size={24}
                                        color={theme.colors.text.primary}
                                    />
                                </TouchableOpacity>
                            </View>

                            {/* Content */}
                            <ScrollView
                                style={styles.content}
                                keyboardShouldPersistTaps="handled"
                                showsVerticalScrollIndicator={false}
                            >
                                {/* Message Input */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>
                                        Write Message
                                    </Text>
                                    <TextInput
                                        style={[
                                            styles.textInput,
                                            error && styles.textInputError,
                                        ]}
                                        placeholder="Type your message here..."
                                        placeholderTextColor={theme.colors.text.secondary}
                                        multiline
                                        numberOfLines={6}
                                        value={message}
                                        onChangeText={(text) => {
                                            setMessage(text);
                                            setError(null);
                                        }}
                                        editable={!isSubmitting}
                                        textAlignVertical="top"
                                    />
                                    {error && (
                                        <Text style={styles.errorText}>{error}</Text>
                                    )}
                                </View>
                            </ScrollView>

                            {/* Footer */}
                            <View style={styles.footer}>
                                <Button
                                    title={isSubmitting ? 'Sending...' : 'Send Message'}
                                    onPress={handleSubmit}
                                    disabled={isSubmitting || !message.trim()}
                                    style={styles.submitButton}
                                />
                            </View>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: theme.colors.white,
        borderTopLeftRadius: theme.borderRadius.xl,
        borderTopRightRadius: theme.borderRadius.xl,
        maxHeight: '90%',
        minHeight: '50%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.main,
    },
    headerTitleContainer: {
        flex: 1,
        marginRight: theme.spacing.md,
    },
    headerTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    headerSubtitle: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
    },
    closeButton: {
        padding: theme.spacing.xs,
    },
    content: {
        flex: 1,
        padding: theme.spacing.lg,
    },
    inputContainer: {
        marginBottom: theme.spacing.md,
    },
    label: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.sm,
    },
    textInput: {
        borderWidth: 1,
        borderColor: theme.colors.border.main,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.primary,
        minHeight: 120,
        maxHeight: 200,
        backgroundColor: theme.colors.background.paper || theme.colors.white,
    },
    textInputError: {
        borderColor: theme.colors.error.main,
    },
    errorText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.error.main,
        marginTop: theme.spacing.xs,
    },
    footer: {
        padding: theme.spacing.lg,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border.main,
    },
    submitButton: {
        width: '100%',
    },
});

export default MessageSupplierModal;

