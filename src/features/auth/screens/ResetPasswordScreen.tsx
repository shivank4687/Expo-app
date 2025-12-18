import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { validation } from '@/shared/utils/validation';
import { theme } from '@/theme';
import { useToast } from '@/shared/components/Toast';
import { authApi } from '@/services/api/auth.api';

interface ResetPasswordParams {
    verificationToken: string;
    otp: string;
}

export const ResetPasswordScreen: React.FC = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const params = useLocalSearchParams();
    const { showToast } = useToast();

    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: '',
    });

    const [errors, setErrors] = useState<{
        password?: string;
        confirmPassword?: string;
    }>({});

    const [isLoading, setIsLoading] = useState(false);

    const updateField = useCallback((field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setErrors(prev => ({ ...prev, [field]: undefined }));
    }, []);

    const validateForm = (): boolean => {
        const newErrors: typeof errors = {};

        if (!validation.isRequired(formData.password)) {
            newErrors.password = t('auth.newPasswordRequired');
        } else if (formData.password.length < 6) {
            newErrors.password = t('auth.passwordMinLength');
        }

        if (!validation.isRequired(formData.confirmPassword)) {
            newErrors.confirmPassword = t('auth.confirmPasswordRequired');
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = t('auth.passwordsDoNotMatch');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleResetPassword = async () => {
        if (!validateForm()) return;

        const verificationToken = params.verificationToken as string;
        const otp = params.otp as string;

        if (!verificationToken || !otp) {
            showToast({
                message: t('auth.invalidVerificationToken', 'Invalid verification. Please try again.'),
                type: 'error',
                duration: 4000,
            });
            router.back();
            return;
        }

        setIsLoading(true);
        try {
            const response = await authApi.resetPassword({
                verification_token: verificationToken,
                otp: otp,
                password: formData.password,
                password_confirmation: formData.confirmPassword,
            });

            showToast({
                message: response.message || t('auth.passwordResetSuccess'),
                type: 'success',
                duration: 4000,
            });

            // Navigate back to login screen
            setTimeout(() => {
                if (router.canGoBack()) {
                    router.dismissAll();
                }
                router.replace('/login');
            }, 1000);
        } catch (err: any) {
            // Extract error message from different possible error structures
            let errorMessage = t('auth.unableToCreateAccount', 'Failed to reset password. Please try again.');

            if (err?.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err?.message) {
                errorMessage = err.message;
            } else if (typeof err === 'string') {
                errorMessage = err;
            }

            showToast({
                message: errorMessage,
                type: 'error',
                duration: 4000,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.header}>
                    <Text style={styles.title}>{t('auth.resetPasswordTitle')}</Text>
                    <Text style={styles.subtitle}>{t('auth.resetPasswordSubtitle')}</Text>
                </View>

                <View style={styles.form}>
                    <Input
                        label={t('auth.newPassword')}
                        placeholder={t('auth.enterNewPassword')}
                        value={formData.password}
                        onChangeText={(text) => updateField('password', text)}
                        error={errors.password}
                        leftIcon="lock-closed"
                        secureTextEntry
                        autoComplete="password-new"
                    />

                    <Input
                        label={t('auth.confirmNewPassword')}
                        placeholder={t('auth.confirmYourPassword')}
                        value={formData.confirmPassword}
                        onChangeText={(text) => updateField('confirmPassword', text)}
                        error={errors.confirmPassword}
                        leftIcon="lock-closed"
                        secureTextEntry
                        autoComplete="password-new"
                    />

                    <Button
                        title={t('auth.resetPassword')}
                        onPress={handleResetPassword}
                        loading={isLoading}
                        fullWidth
                        size="large"
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.default,
    },
    scrollContent: {
        flexGrow: 1,
        padding: theme.spacing.xl,
        justifyContent: 'center',
    },
    header: {
        marginBottom: theme.spacing['2xl'],
        alignItems: 'center',
    },
    title: {
        fontSize: theme.typography.fontSize['3xl'],
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.sm,
    },
    subtitle: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.secondary,
        textAlign: 'center',
    },
    form: {
        width: '100%',
    },
});

export default ResetPasswordScreen;
