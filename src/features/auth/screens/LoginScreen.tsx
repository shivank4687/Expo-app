import { Country } from '@/services/api/core.api';
import { Button } from '@/shared/components/Button';
import { CountryCodeDropdown } from '@/shared/components/CountryCodeDropdown';
import { Input } from '@/shared/components/Input';
import { useToast } from '@/shared/components/Toast';
import { validation } from '@/shared/utils/validation';
import { useAppDispatch } from '@/store/hooks';
import { loginThunk } from '@/store/slices/authSlice';
import { supplierLoginThunk } from '@/store/slices/supplierAuthSlice';
import { theme } from '@/theme';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export const LoginScreen: React.FC = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const dispatch = useAppDispatch();
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
            <View style={styles.topPanel}>
                <Text style={styles.topTitle}>{t('auth.signIn')}</Text>
            </View>

            <View style={styles.bottomSheet}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.header}>
                        <Text style={styles.title}>{t('auth.welcomeBack')}</Text>
                        <Text style={styles.subtitle}>{t('auth.signInToContinue')}</Text>
                    </View>

                    <View style={styles.toggleContainer}>
                        <TouchableOpacity
                            style={[
                                styles.toggleButton,
                                userType === 'customer' && styles.toggleButtonActive,
                            ]}
                            onPress={() => setUserType('customer')}
                            activeOpacity={0.8}
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
                            activeOpacity={0.8}
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
                                containerStyle={styles.inputContainer}
                                inputContainerStyle={styles.inputField}
                                style={styles.inputText}
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
                            containerStyle={styles.inputContainer}
                            inputContainerStyle={styles.inputField}
                            style={styles.inputText}
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
                            style={styles.signInButton}
                        />

                        <View style={styles.signupContainer}>
                            <Text style={styles.signupText}>{t('auth.dontHaveAccount')} </Text>
                            <TouchableOpacity onPress={handleSignupPress}>
                                <Text style={styles.signupLink}>{t('auth.signup')}</Text>
                            </TouchableOpacity>
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
        paddingBottom: theme.spacing.xl,
        alignItems: 'center',
    },
    topTitle: {
        fontSize: 24,
        lineHeight: 29,
        fontWeight: '500',
        color: '#FFFFFF',
        fontFamily: 'Inter',
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
        paddingTop: theme.spacing.lg,
        paddingBottom: theme.spacing.xl,
    },
    header: {
        marginBottom: theme.spacing.xl,
        alignItems: 'flex-start',
    },
    toggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 4,
        marginBottom: theme.spacing.lg,
    },
    toggleButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
        borderRadius: 4,
        height: 34,
    },
    toggleButtonActive: {
        backgroundColor: '#00615E',
        borderWidth: 1,
        borderColor: '#00615E',
    },
    toggleButtonText: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 14,
        lineHeight: 18,
        color: '#000000',
    },
    toggleButtonTextActive: {
        color: '#FFFFFF',
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
    inputWrapper: {
        width: '100%',
    },
    inputContainer: {
        marginBottom: theme.spacing.sm,
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
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: theme.spacing.md,
    },
    forgotPasswordText: {
        fontSize: 14,
        color: '#00615E',
        fontWeight: '500',
        fontFamily: 'Inter',
    },
    signInButton: {
        backgroundColor: '#00615E',
        borderRadius: 8,
    },
    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: theme.spacing.lg,
    },
    signupText: {
        fontSize: 16,
        lineHeight: 26,
        color: '#72777A',
        fontFamily: 'Inter',
    },
    signupLink: {
        fontSize: 16,
        lineHeight: 26,
        color: '#000000',
        fontWeight: '600',
        fontFamily: 'Inter',
    },
});

export default LoginScreen;
