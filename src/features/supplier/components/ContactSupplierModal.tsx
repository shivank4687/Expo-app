import React, { useState, useEffect } from 'react';
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
import { suppliersApi } from '@/services/api/suppliers.api';
import { useAppSelector } from '@/store/hooks';

interface ContactSupplierModalProps {
    visible: boolean;
    supplierUrl: string;
    supplierCompanyName: string;
    onClose: () => void;
    onSuccess?: () => void;
}

export const ContactSupplierModal: React.FC<ContactSupplierModalProps> = ({
    visible,
    supplierUrl,
    supplierCompanyName,
    onClose,
    onSuccess,
}) => {
    const { user } = useAppSelector((state) => state.auth);
    
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [query, setQuery] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Pre-fill user data if authenticated
    useEffect(() => {
        if (user && visible) {
            if (user.first_name && user.last_name) {
                setName(`${user.first_name} ${user.last_name}`);
            } else if (user.name) {
                setName(user.name);
            }
            if (user.email) {
                setEmail(user.email);
            }
        }
    }, [user, visible]);

    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!subject.trim()) {
            newErrors.subject = 'Subject is required';
        }

        if (!query.trim()) {
            newErrors.query = 'Query is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setErrors({});

        try {
            await suppliersApi.contactSupplier(supplierUrl, {
                name: name.trim(),
                email: email.trim(),
                subject: subject.trim(),
                query: query.trim(),
            });

            // Reset form
            setName('');
            setEmail('');
            setSubject('');
            setQuery('');
            setErrors({});
            
            // Close modal and call success callback
            onClose();
            if (onSuccess) {
                onSuccess();
            }
        } catch (err: any) {
            // Handle validation errors
            if (err.response?.status === 422 && err.response?.data?.errors) {
                const validationErrors: { [key: string]: string } = {};
                Object.keys(err.response.data.errors).forEach((key) => {
                    validationErrors[key] = err.response.data.errors[key][0];
                });
                setErrors(validationErrors);
            } else {
                setErrors({ general: err.message || 'Failed to send message. Please try again.' });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setErrors({});
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
                        style={styles.modalWrapper}
                    >
                        <View style={styles.modalContent}>
                            {/* Header */}
                            <View style={styles.header}>
                                <View style={styles.headerTitleContainer}>
                                    <Text style={styles.headerTitle}>
                                        Contact Supplier
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
                                contentContainerStyle={styles.contentContainer}
                                keyboardShouldPersistTaps="handled"
                                showsVerticalScrollIndicator={false}
                            >
                                {errors.general && (
                                    <View style={styles.errorContainer}>
                                        <Text style={styles.errorText}>{errors.general}</Text>
                                    </View>
                                )}

                                {/* Name Input */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>
                                        Name <Text style={styles.required}>*</Text>
                                    </Text>
                                    <TextInput
                                        style={[
                                            styles.textInput,
                                            errors.name && styles.textInputError,
                                        ]}
                                        placeholder="Enter your name"
                                        placeholderTextColor={theme.colors.text.secondary}
                                        value={name}
                                        onChangeText={(text) => {
                                            setName(text);
                                            if (errors.name) {
                                                setErrors({ ...errors, name: '' });
                                            }
                                        }}
                                        editable={!isSubmitting}
                                    />
                                    {errors.name && (
                                        <Text style={styles.errorText}>{errors.name}</Text>
                                    )}
                                </View>

                                {/* Email Input */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>
                                        Email <Text style={styles.required}>*</Text>
                                    </Text>
                                    <TextInput
                                        style={[
                                            styles.textInput,
                                            errors.email && styles.textInputError,
                                        ]}
                                        placeholder="Enter your email"
                                        placeholderTextColor={theme.colors.text.secondary}
                                        value={email}
                                        onChangeText={(text) => {
                                            setEmail(text);
                                            if (errors.email) {
                                                setErrors({ ...errors, email: '' });
                                            }
                                        }}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        editable={!isSubmitting}
                                    />
                                    {errors.email && (
                                        <Text style={styles.errorText}>{errors.email}</Text>
                                    )}
                                </View>

                                {/* Subject Input */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>
                                        Subject <Text style={styles.required}>*</Text>
                                    </Text>
                                    <TextInput
                                        style={[
                                            styles.textInput,
                                            errors.subject && styles.textInputError,
                                        ]}
                                        placeholder="Enter subject"
                                        placeholderTextColor={theme.colors.text.secondary}
                                        value={subject}
                                        onChangeText={(text) => {
                                            setSubject(text);
                                            if (errors.subject) {
                                                setErrors({ ...errors, subject: '' });
                                            }
                                        }}
                                        editable={!isSubmitting}
                                    />
                                    {errors.subject && (
                                        <Text style={styles.errorText}>{errors.subject}</Text>
                                    )}
                                </View>

                                {/* Query Input */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>
                                        Query <Text style={styles.required}>*</Text>
                                    </Text>
                                    <TextInput
                                        style={[
                                            styles.textArea,
                                            errors.query && styles.textInputError,
                                        ]}
                                        placeholder="Enter your message/query"
                                        placeholderTextColor={theme.colors.text.secondary}
                                        multiline
                                        numberOfLines={6}
                                        value={query}
                                        onChangeText={(text) => {
                                            setQuery(text);
                                            if (errors.query) {
                                                setErrors({ ...errors, query: '' });
                                            }
                                        }}
                                        editable={!isSubmitting}
                                        textAlignVertical="top"
                                    />
                                    {errors.query && (
                                        <Text style={styles.errorText}>{errors.query}</Text>
                                    )}
                                </View>
                            </ScrollView>

                            {/* Footer - Fixed at bottom */}
                            <View style={styles.footer}>
                                <Button
                                    title={isSubmitting ? 'Submitting...' : 'Submit'}
                                    onPress={handleSubmit}
                                    disabled={isSubmitting || !name.trim() || !email.trim() || !subject.trim() || !query.trim()}
                                    loading={isSubmitting}
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
    modalWrapper: {
        width: '100%',
        height: '95%',
    },
    modalContent: {
        flex: 1,
        backgroundColor: theme.colors.white,
        borderTopLeftRadius: theme.borderRadius.xl,
        borderTopRightRadius: theme.borderRadius.xl,
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
    },
    contentContainer: {
        padding: theme.spacing.lg,
        paddingBottom: theme.spacing.xl,
    },
    errorContainer: {
        backgroundColor: theme.colors.error.light || '#FEE2E2',
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        marginBottom: theme.spacing.md,
    },
    inputContainer: {
        marginBottom: theme.spacing.lg,
    },
    label: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.sm,
    },
    required: {
        color: theme.colors.error.main,
    },
    textInput: {
        borderWidth: 1,
        borderColor: theme.colors.border.main,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.primary,
        backgroundColor: theme.colors.background.paper || theme.colors.white,
    },
    textArea: {
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
        backgroundColor: theme.colors.white,
    },
    submitButton: {
        width: '100%',
    },
});

export default ContactSupplierModal;

