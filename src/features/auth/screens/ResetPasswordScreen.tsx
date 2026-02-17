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
            <View style={styles.topPanel} />

            <View style={styles.bottomSheet}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
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
                            secureTextEntry
                            autoComplete="password"
                            textContentType="none"
                            inputContainerStyle={styles.inputField}
                            style={styles.inputText}
                            labelStyle={styles.inputLabel}
                        />

                        <Input
                            label={t('auth.confirmNewPassword')}
                            placeholder={t('auth.confirmYourPassword')}
                            value={formData.confirmPassword}
                            onChangeText={(text) => updateField('confirmPassword', text)}
                            error={errors.confirmPassword}
                            secureTextEntry
                            autoComplete="password"
                            textContentType="none"
                            inputContainerStyle={styles.inputField}
                            style={styles.inputText}
                            labelStyle={styles.inputLabel}
                        />

                        <View style={styles.actionContainer}>
                            <Button
                                title={t('auth.resetPassword')}
                                onPress={handleResetPassword}
                                loading={isLoading}
                                fullWidth
                                size="medium"
                                style={styles.resetButton}
                            />
                        </View>
                    </View>
                </ScrollView>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#00615E',
    },
    topPanel: {
        paddingTop: Platform.OS === 'ios' ? theme.spacing['3xl'] : theme.spacing.xl,
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.md,
        alignItems: 'center',
    },
    bottomSheet: {
        flex: 1,
        backgroundColor: '#FFFDF4',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        overflow: 'hidden',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.md,
        paddingBottom: theme.spacing.xl,
    },
    header: {
        marginBottom: theme.spacing.lg,
        alignItems: 'flex-start',
    },
    title: {
        fontSize: 32,
        lineHeight: 38,
        fontWeight: '500',
        color: '#000000',
        marginBottom: theme.spacing.xs,
        fontFamily: 'Inter',
    },
    subtitle: {
        fontSize: 16,
        lineHeight: 26,
        fontWeight: '400',
        color: '#090A0A',
        fontFamily: 'Inter',
    },
    form: {
        width: '100%',
    },
    inputField: {
        backgroundColor: '#F3F0E7',
        borderWidth: 0,
        borderRadius: 8,
        minHeight: 40,
    },
    inputText: {
        color: '#0A292D',
        fontSize: 14,
        fontWeight: '500',
    },
    inputLabel: {
        color: '#72777A',
        fontSize: 14,
        marginBottom: 4,
        fontFamily: 'Inter',
    },
    actionContainer: {
        marginTop: theme.spacing.md,
        paddingHorizontal: 24,
        gap: 10,
    },
    resetButton: {
        backgroundColor: '#00615E',
        borderRadius: 8,
        height: 40,
        paddingVertical: 0,
    },
});

export default ResetPasswordScreen;
