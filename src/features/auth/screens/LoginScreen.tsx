import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loginThunk } from '@/store/slices/authSlice';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { validation } from '@/shared/utils/validation';
import { theme } from '@/theme';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/shared/components/Toast';

export const LoginScreen: React.FC = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { isLoading } = useAppSelector((state) => state.auth);
    const { showToast } = useToast();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    const handleEmailChange = useCallback((text: string) => {
        setEmail(text);
        if (errors.email) {
            setErrors(prev => ({ ...prev, email: undefined }));
        }
    }, [errors.email]);

    const handlePasswordChange = useCallback((text: string) => {
        setPassword(text);
        if (errors.password) {
            setErrors(prev => ({ ...prev, password: undefined }));
        }
    }, [errors.password]);

    const validateForm = (): boolean => {
        const newErrors: { email?: string; password?: string } = {};

        if (!validation.isRequired(email)) {
            newErrors.email = t('auth.emailRequired');
        } else if (!validation.isValidEmail(email)) {
            newErrors.email = t('auth.emailInvalid');
        }

        if (!validation.isRequired(password)) {
            newErrors.password = t('auth.passwordRequired');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async () => {
        if (!validateForm()) return;

        try {
            const result = await dispatch(loginThunk({ email, password })).unwrap();
            
            // Show success toast
            showToast({
                message: t('auth.loginSuccess', 'Login successful! Welcome back.'),
                type: 'success',
                duration: 3000,
            });
            
            // Navigate to home/drawer after successful login
            setTimeout(() => {
                if (router.canGoBack()) {
                    router.dismissAll();
                }
                router.replace('/(drawer)/(tabs)');
            }, 500);
        } catch (err: any) {
            showToast({
                message: err || t('auth.invalidCredentials'),
                type: 'error',
                duration: 4000,
            });
        }
    };

    const handleSignupPress = () => {
        router.push('/signup');
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
                    <Text style={styles.title}>{t('auth.welcomeBack')}</Text>
                    <Text style={styles.subtitle}>{t('auth.signInToContinue')}</Text>
                </View>

                <View style={styles.form}>
                    <Input
                        label={t('auth.email')}
                        placeholder={t('auth.enterYourEmail')}
                        value={email}
                        onChangeText={handleEmailChange}
                        error={errors.email}
                        leftIcon="mail"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                    />

                    <Input
                        label={t('auth.password')}
                        placeholder={t('auth.enterYourPassword')}
                        value={password}
                        onChangeText={handlePasswordChange}
                        error={errors.password}
                        leftIcon="lock-closed"
                        secureTextEntry
                        autoComplete="password"
                    />

                    <TouchableOpacity style={styles.forgotPassword}>
                        <Text style={styles.forgotPasswordText}>{t('auth.forgotPassword')}</Text>
                    </TouchableOpacity>

                    <Button
                        title={t('auth.signIn')}
                        onPress={handleLogin}
                        loading={isLoading}
                        fullWidth
                        size="large"
                    />

                    <View style={styles.signupContainer}>
                        <Text style={styles.signupText}>{t('auth.dontHaveAccount')} </Text>
                        <TouchableOpacity onPress={handleSignupPress}>
                            <Text style={styles.signupLink}>{t('auth.signup')}</Text>
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
        marginBottom: theme.spacing['3xl'],
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
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: theme.spacing.lg,
    },
    forgotPasswordText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.primary[500],
        fontWeight: theme.typography.fontWeight.medium,
    },
    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: theme.spacing.xl,
    },
    signupText: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.secondary,
    },
    signupLink: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.primary[500],
        fontWeight: theme.typography.fontWeight.semiBold,
    },
});

export default LoginScreen;
