import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { signupThunk } from '@/store/slices/authSlice';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { validation } from '@/shared/utils/validation';
import { theme } from '@/theme';
import { useToast } from '@/shared/components/Toast';

export const SignupScreen: React.FC = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { isLoading } = useAppSelector((state) => state.auth);
    const { showToast } = useToast();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const [errors, setErrors] = useState<{
        name?: string;
        email?: string;
        password?: string;
        confirmPassword?: string;
    }>({});

    const updateField = useCallback((field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setErrors(prev => ({ ...prev, [field]: undefined }));
    }, []);

    const validateForm = (): boolean => {
        const newErrors: typeof errors = {};

        if (!validation.isRequired(formData.name)) {
            newErrors.name = t('auth.nameRequired');
        } else if (!validation.minLength(formData.name, 2)) {
            newErrors.name = t('auth.nameMinLength');
        }

        if (!validation.isRequired(formData.email)) {
            newErrors.email = t('auth.emailRequired');
        } else if (!validation.isValidEmail(formData.email)) {
            newErrors.email = t('auth.emailInvalid');
        }

        if (!validation.isRequired(formData.password)) {
            newErrors.password = t('auth.passwordRequired');
        } else if (!validation.isValidPassword(formData.password)) {
            newErrors.password = validation.getPasswordStrengthMessage(formData.password);
        }

        if (!validation.isRequired(formData.confirmPassword)) {
            newErrors.confirmPassword = t('auth.confirmPasswordRequired');
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = t('auth.passwordsDoNotMatch');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSignup = async () => {
        if (!validateForm()) return;

        try {
            await dispatch(signupThunk({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                password_confirmation: formData.confirmPassword,
            })).unwrap();

            // Show success toast
            showToast({
                message: t('auth.signupSuccess', 'Account created successfully! Welcome aboard.'),
                type: 'success',
                duration: 3000,
            });

            // Navigate to home after successful signup
            setTimeout(() => {
                if (router.canGoBack()) {
                    router.dismissAll();
                }
                router.replace('/(drawer)/(tabs)');
            }, 500);
        } catch (err: any) {
            showToast({
                message: err || t('auth.unableToCreateAccount'),
                type: 'error',
                duration: 4000,
            });
        }
    };

    const handleLoginPress = () => {
        router.back();
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
                    <Text style={styles.title}>{t('auth.createAccount')}</Text>
                    <Text style={styles.subtitle}>{t('auth.signUpToGetStarted')}</Text>
                </View>

                <View style={styles.form}>
                    <Input
                        label={t('auth.fullName')}
                        placeholder={t('auth.enterYourFullName')}
                        value={formData.name}
                        onChangeText={(text) => updateField('name', text)}
                        error={errors.name}
                        leftIcon="person"
                        autoComplete="name"
                    />

                    <Input
                        label={t('auth.email')}
                        placeholder={t('auth.enterYourEmail')}
                        value={formData.email}
                        onChangeText={(text) => updateField('email', text)}
                        error={errors.email}
                        leftIcon="mail"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                    />

                    <Input
                        label={t('auth.password')}
                        placeholder={t('auth.createAPassword')}
                        value={formData.password}
                        onChangeText={(text) => updateField('password', text)}
                        error={errors.password}
                        leftIcon="lock-closed"
                        secureTextEntry
                        autoComplete="password-new"
                    />

                    <Input
                        label={t('auth.confirmPassword')}
                        placeholder={t('auth.confirmYourPassword')}
                        value={formData.confirmPassword}
                        onChangeText={(text) => updateField('confirmPassword', text)}
                        error={errors.confirmPassword}
                        leftIcon="lock-closed"
                        secureTextEntry
                        autoComplete="password-new"
                    />

                    <Text style={styles.termsText}>
                        {t('auth.termsAgreement')}{' '}
                        <Text style={styles.termsLink}>{t('auth.termsOfService')}</Text> {t('auth.and')}{' '}
                        <Text style={styles.termsLink}>{t('auth.privacyPolicy')}</Text>
                    </Text>

                    <Button
                        title={t('auth.signUp')}
                        onPress={handleSignup}
                        loading={isLoading}
                        fullWidth
                        size="large"
                    />

                    <View style={styles.loginContainer}>
                        <Text style={styles.loginText}>{t('auth.alreadyHaveAccount')} </Text>
                        <TouchableOpacity onPress={handleLoginPress}>
                            <Text style={styles.loginLink}>{t('auth.signIn')}</Text>
                        </TouchableOpacity>
                    </View>
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
    },
    form: {
        width: '100%',
    },
    termsText: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        marginBottom: theme.spacing.lg,
        lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.xs,
    },
    termsLink: {
        color: theme.colors.primary[500],
        fontWeight: theme.typography.fontWeight.medium,
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: theme.spacing.xl,
    },
    loginText: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.secondary,
    },
    loginLink: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.primary[500],
        fontWeight: theme.typography.fontWeight.semiBold,
    },
});

export default SignupScreen;
