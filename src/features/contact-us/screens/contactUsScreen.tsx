import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { theme } from '@/theme';
import { Button } from '@/shared/components/Button';
import { useAppSelector } from '@/store/hooks';
import { contactApi } from '@/services/api/contact.api';
import { Stack } from 'expo-router';
import { useToast } from '@/shared/components/Toast';
import { useTranslation } from 'react-i18next';

export const ContactUsScreen = () => {
    const { user } = useAppSelector((state) => state.auth);
    const { showToast } = useToast();
    const { t } = useTranslation();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [contact, setContact] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Pre-fill user data if authenticated
    useEffect(() => {
        if (user) {
            if (user.first_name && user.last_name) {
                setName(`${user.first_name} ${user.last_name}`);
            } else if (user.name) {
                setName(user.name);
            }
            if (user.email) {
                setEmail(user.email);
            }
        }
    }, [user]);

    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!name.trim()) {
            newErrors.name = t('contact.nameRequired');
        }

        if (!email.trim()) {
            newErrors.email = t('contact.emailRequired');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = t('contact.emailInvalid');
        }

        // Phone is optional but if provided should be valid-ish
        // Bagisto uses regex rules validation, we'll keep it simple for now or mirror if strictly needed

        if (!message.trim()) {
            newErrors.message = t('contact.messageRequired');
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
            await contactApi.contactUs({
                name: name.trim(),
                email: email.trim(),
                contact: contact.trim(),
                message: message.trim(),
            });

            showToast({
                message: t('contact.successMessage'),
                type: 'success'
            });

            // Reset form but keep user details if logged in
            if (!user) {
                setName('');
                setEmail('');
            }
            setContact('');
            setMessage('');
        } catch (err: any) {
            if (err.response?.status === 422 && err.response?.data?.errors) {
                const validationErrors: { [key: string]: string } = {};
                Object.keys(err.response.data.errors).forEach((key) => {
                    validationErrors[key] = err.response.data.errors[key][0];
                });
                setErrors(validationErrors);
            } else {
                showToast({
                    message: err.response?.data?.message || t('contact.errorMessage'),
                    type: 'error'
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: t('contact.title'), headerBackTitle: t('common.back') }} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.contentContainer}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.header}>
                        <Text style={styles.title}>{t('contact.title')}</Text>
                        <Text style={styles.subtitle}>
                            {t('contact.subtitle')}
                        </Text>
                    </View>

                    <View style={styles.form}>
                        {/* Name Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>
                                {t('contact.name')} <Text style={styles.required}>*</Text>
                            </Text>
                            <TextInput
                                style={[
                                    styles.textInput,
                                    errors.name && styles.textInputError,
                                ]}
                                placeholder={t('contact.enterName')}
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
                                {t('contact.email')} <Text style={styles.required}>*</Text>
                            </Text>
                            <TextInput
                                style={[
                                    styles.textInput,
                                    errors.email && styles.textInputError,
                                ]}
                                placeholder={t('contact.enterEmail')}
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

                        {/* Phone Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>
                                {t('contact.phoneNumber')}
                            </Text>
                            <TextInput
                                style={[
                                    styles.textInput,
                                    errors.contact && styles.textInputError,
                                ]}
                                placeholder={t('contact.enterPhone')}
                                placeholderTextColor={theme.colors.text.secondary}
                                value={contact}
                                onChangeText={(text) => {
                                    setContact(text);
                                    if (errors.contact) {
                                        setErrors({ ...errors, contact: '' });
                                    }
                                }}
                                keyboardType="phone-pad"
                                editable={!isSubmitting}
                            />
                            {errors.contact && (
                                <Text style={styles.errorText}>{errors.contact}</Text>
                            )}
                        </View>

                        {/* Message Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>
                                {t('contact.message')} <Text style={styles.required}>*</Text>
                            </Text>
                            <TextInput
                                style={[
                                    styles.textArea,
                                    errors.message && styles.textInputError,
                                ]}
                                placeholder={t('contact.enterMessage')}
                                placeholderTextColor={theme.colors.text.secondary}
                                multiline
                                numberOfLines={6}
                                value={message}
                                onChangeText={(text) => {
                                    setMessage(text);
                                    if (errors.message) {
                                        setErrors({ ...errors, message: '' });
                                    }
                                }}
                                editable={!isSubmitting}
                                textAlignVertical="top"
                            />
                            {errors.message && (
                                <Text style={styles.errorText}>{errors.message}</Text>
                            )}
                        </View>

                        <Button
                            title={isSubmitting ? t('contact.sending') : t('contact.sendMessage')}
                            onPress={handleSubmit}
                            disabled={isSubmitting}
                            loading={isSubmitting}
                            style={styles.submitButton}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.default,
    },
    keyboardView: {
        flex: 1,
    },
    contentContainer: {
        padding: theme.spacing.lg,
    },
    header: {
        marginBottom: theme.spacing.xl,
    },
    title: {
        fontSize: theme.typography.fontSize['2xl'],
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.sm,
    },
    subtitle: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.secondary,
        lineHeight: 24,
    },
    form: {
        backgroundColor: theme.colors.white,
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.lg,
        shadowColor: theme.colors.black,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 2,
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
        backgroundColor: theme.colors.white,
    },
    textArea: {
        borderWidth: 1,
        borderColor: theme.colors.border.main,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.primary,
        minHeight: 120,
        backgroundColor: theme.colors.white,
    },
    textInputError: {
        borderColor: theme.colors.error.main,
    },
    errorText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.error.main,
        marginTop: theme.spacing.xs,
    },
    submitButton: {
        marginTop: theme.spacing.sm,
    },
});