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
import { supplierLoginThunk } from '@/store/slices/supplierAuthSlice';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { CountryCodeDropdown } from '@/shared/components/CountryCodeDropdown';
import { validation } from '@/shared/utils/validation';
import { theme } from '@/theme';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/shared/components/Toast';
import { Country } from '@/services/api/core.api';

export const LoginScreen: React.FC = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { isLoading: authIsLoading } = useAppSelector((state) => state.auth);
    const { isLoading: supplierAuthIsLoading } = useAppSelector((state) => state.supplierAuth);
    const { showToast } = useToast();

    const [userType, setUserType] = useState<'customer' | 'supplier'>('customer');
    const [emailOrPhone, setEmailOrPhone] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<{ emailOrPhone?: string; password?: string }>({});
    const [isPhoneInput, setIsPhoneInput] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleEmailOrPhoneChange = useCallback((text: string) => {
        setEmailOrPhone(text);
        if (errors.emailOrPhone) {
            setErrors(prev => ({ ...prev, emailOrPhone: undefined }));
        }
        // Detect if input looks like a phone number (starts with digits)
        const phonePattern = /^[\d+\-\s()]*$/;
        setIsPhoneInput(phonePattern.test(text) && text.length > 0 && !text.includes('@'));
    }, [errors.emailOrPhone]);

    const handlePasswordChange = useCallback((text: string) => {
        setPassword(text);
        if (errors.password) {
            setErrors(prev => ({ ...prev, password: undefined }));
        }
    }, [errors.password]);

    const validateForm = (): boolean => {
        const newErrors: { emailOrPhone?: string; password?: string } = {};

        if (!validation.isRequired(emailOrPhone)) {
            newErrors.emailOrPhone = t('auth.emailOrPhoneRequired');
        } else if (!validation.isValidEmailOrPhone(emailOrPhone)) {
            newErrors.emailOrPhone = t('auth.emailOrPhoneInvalid');
        }

        if (!validation.isRequired(password)) {
            newErrors.password = t('auth.passwordRequired');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCountrySelect = useCallback((country: Country) => {
        setSelectedCountry(country);
    }, []);

    const handleLogin = async () => {
        if (!validateForm()) return;

        setIsLoggingIn(true);
        try {
            const loginPayload: any = {
                email_or_phone: emailOrPhone,
                password,
            };

            // Add phone_country_id if it's a phone number
            if (isPhoneInput && selectedCountry) {
                loginPayload.phone_country_id = selectedCountry.id;
            }

            if (userType === 'supplier') {
                // Supplier login
                await dispatch(supplierLoginThunk(loginPayload)).unwrap();

                showToast({
                    message: t('auth.loginSuccess', 'Login successful! Welcome back.'),
                    type: 'success',
                    duration: 3000,
                });

                // Navigate to supplier dashboard
                setTimeout(() => {
                    if (router.canGoBack()) {
                        router.dismissAll();
                    }
                    router.replace('/(supplier-drawer)/(supplier-tabs)');
                }, 500);
            } else {
                // Customer login
                await dispatch(loginThunk(loginPayload)).unwrap();

                showToast({
                    message: t('auth.loginSuccess', 'Login successful! Welcome back.'),
                    type: 'success',
                    duration: 3000,
                });

                // Navigate to customer home/drawer
                setTimeout(() => {
                    if (router.canGoBack()) {
                        router.dismissAll();
                    }
                    router.replace('/(drawer)/(tabs)');
                }, 500);
            }
        } catch (err: any) {
            showToast({
                message: err || t('auth.invalidCredentials'),
                type: 'error',
                duration: 4000,
            });
        } finally {
            setIsLoggingIn(false);
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

                {/* User Type Toggle */}
                <View style={styles.toggleContainer}>
                    <TouchableOpacity
                        style={[
                            styles.toggleButton,
                            userType === 'customer' && styles.toggleButtonActive,
                        ]}
                        onPress={() => setUserType('customer')}
                    >
                        <Text
                            style={[
                                styles.toggleButtonText,
                                userType === 'customer' && styles.toggleButtonTextActive,
                            ]}
                        >
                            {t('auth.customer', 'Customer')}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.toggleButton,
                            userType === 'supplier' && styles.toggleButtonActive,
                        ]}
                        onPress={() => setUserType('supplier')}
                    >
                        <Text
                            style={[
                                styles.toggleButtonText,
                                userType === 'supplier' && styles.toggleButtonTextActive,
                            ]}
                        >
                            {t('auth.supplier', 'Supplier')}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputWrapper}>
                        <Input
                            label={t('auth.emailOrPhone')}
                            placeholder={t('auth.enterYourEmailOrPhone')}
                            value={emailOrPhone}
                            onChangeText={handleEmailOrPhoneChange}
                            error={errors.emailOrPhone}
                            leftIcon={!isPhoneInput ? "mail" : undefined}
                            leftPrefix={
                                isPhoneInput ? (
                                    <CountryCodeDropdown
                                        onCountrySelect={handleCountrySelect}
                                        selectedCountry={selectedCountry}
                                    />
                                ) : undefined
                            }
                            keyboardType={isPhoneInput ? "phone-pad" : "email-address"}
                            autoCapitalize="none"
                            autoComplete={isPhoneInput ? "tel" : "email"}
                        />
                    </View>

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

                    <TouchableOpacity style={styles.forgotPassword} onPress={() => router.push('/forgot-password')}>
                        <Text style={styles.forgotPasswordText}>{t('auth.forgotPassword')}</Text>
                    </TouchableOpacity>

                    <Button
                        title={t('auth.signIn')}
                        onPress={handleLogin}
                        loading={isLoggingIn}
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
        marginBottom: theme.spacing.xl,
        alignItems: 'center',
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: theme.colors.background.paper,
        borderRadius: theme.borderRadius.md,
        padding: 4,
        marginBottom: theme.spacing.xl,
        borderWidth: 1,
        borderColor: theme.colors.border.light,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.borderRadius.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    toggleButtonActive: {
        backgroundColor: theme.colors.primary[500],
    },
    toggleButtonText: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.secondary,
    },
    toggleButtonTextActive: {
        color: theme.colors.white,
        fontWeight: theme.typography.fontWeight.semiBold,
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
    inputWrapper: {
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
