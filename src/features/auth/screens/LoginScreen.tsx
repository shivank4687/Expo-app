import { Country } from '@/services/api/core.api';
import { Button } from '@/shared/components/Button';
import { CountryCodeDropdown } from '@/shared/components/CountryCodeDropdown';
import { Input } from '@/shared/components/Input';
import { TabGroup } from '@/shared/components';
import { useToast } from '@/shared/components/Toast';
import { validation } from '@/shared/utils/validation';
import { useAppDispatch } from '@/store/hooks';
import { loginThunk, setSelectedUserType } from '@/store/slices/authSlice';
import { supplierLoginThunk } from '@/store/slices/supplierAuthSlice';
import { socialLoginThunk } from '@/store/slices/authSlice';
import { GoogleSignin, statusCodes } from '@/services/googleAuth';
import { supplierTheme, theme } from '@/theme';


import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState, useEffect, useMemo } from 'react';
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
import { GoogleIcon } from '@/assets/icons/GoogleIcon';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '@/store/hooks';

export const LoginScreen: React.FC = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { showToast } = useToast();
    const params = useLocalSearchParams<{ type?: string }>();
    const { lastSelectedCountry } = useAppSelector(state => state.core);
    const selectedUserType = useAppSelector(state => state.auth.selectedUserType ?? 'customer');

    // Pre-select user type from params if provided
    useEffect(() => {
        if (params.type === 'supplier' || params.type === 'customer') {
            dispatch(setSelectedUserType(params.type));
        }
    }, [params.type]);

    const userTypeTabs = useMemo(
        () => [
            { id: 'customer', label: t('auth.customer', 'Customer') },
            { id: 'supplier', label: t('auth.supplier', 'Supplier') },
        ],
        [t],
    );

    const handleUserTypeChange = useCallback(
        (tabId: string) => {
            dispatch(setSelectedUserType(tabId as 'customer' | 'supplier'));
        },
        [dispatch],
    );

    const [emailOrPhone, setEmailOrPhone] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<{ emailOrPhone?: string; password?: string }>({});
    const [isPhoneInput, setIsPhoneInput] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState<Country | null>(lastSelectedCountry || null);
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    // Update selectedCountry if lastSelectedCountry changes (e.g. from another screen)
    useEffect(() => {
        if (lastSelectedCountry && !selectedCountry) {
            setSelectedCountry(lastSelectedCountry);
        }
    }, [lastSelectedCountry]);

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

            if (selectedUserType === 'supplier') {
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

    // Google Sign-In Configuration
    useEffect(() => {
        if (Platform.OS !== 'web') {
            GoogleSignin.configure({
                // Web Client ID from Google Cloud Console (synced with backend)
                webClientId: '196127222713-n8e0kegh0k7sdhf62osf5og3qc3ju6pd.apps.googleusercontent.com',

                offlineAccess: true,
                forceCodeForRefreshToken: true,
            });
        }
    }, []);

    const handleGoogleLogin = async () => {
        setIsLoggingIn(true);
        try {
            await GoogleSignin.hasPlayServices();
            const response = await GoogleSignin.signIn();
            const idToken = response.data?.idToken;

            if (idToken) {
                await dispatch(socialLoginThunk({
                    token: idToken,
                    provider: 'google',
                    user_type: selectedUserType,
                })).unwrap();

                showToast({
                    message: t('auth.loginSuccess', 'Login successful! Welcome back.'),
                    type: 'success',
                    duration: 3000,
                });

                // Navigate after short delay
                setTimeout(() => {
                    if (router.canGoBack()) {
                        router.dismissAll();
                    }
                    if (selectedUserType === 'supplier') {
                        router.replace('/(supplier-drawer)/(supplier-tabs)');
                    } else {
                        router.replace('/(drawer)/(tabs)');
                    }
                }, 500);
            }
        } catch (error: any) {
            console.log('Google Sign-In Error:', error);
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                // User cancelled the flow
            } else {
                showToast({
                    message: error.message || t('auth.socialLoginFailed', 'Social login failed. Please try again.'),
                    type: 'error',
                    duration: 4000,
                });
            }
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
                {/* <Text style={styles.topTitle}>{t('auth.signIn')}</Text> */}
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

                    <View style={styles.tabGroupWrapper}>
                        <TabGroup
                            tabs={userTypeTabs}
                            activeTab={selectedUserType}
                            onTabChange={handleUserTypeChange}
                        />
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
                                keyboardType="email-address"
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

                        <View style={styles.actionContainer}>
                            <Button
                                title={t('auth.signIn')}
                                onPress={handleLogin}
                                loading={isLoggingIn}
                                fullWidth
                                size="medium"
                                style={styles.signInButton}
                            />

                            <TouchableOpacity
                                style={styles.secondaryButton}
                                activeOpacity={0.7}
                                onPress={() => router.push('/forgot-password')}
                            >
                                <Text style={styles.secondaryButtonText}>{t('auth.forgotPassword')}</Text>
                            </TouchableOpacity>

                            {selectedUserType === 'customer' && (
                                <>
                                    <Text style={styles.orText}>{t('auth.or', 'or')}</Text>

                                    <TouchableOpacity
                                        style={styles.googleButton}
                                        activeOpacity={1}
                                        onPress={handleGoogleLogin}
                                        disabled={isLoggingIn}
                                    >
                                        <GoogleIcon width={18} height={18} />
                                        <Text style={styles.googleButtonText}>{t('auth.continueWithGoogle', 'Continue with Google')}</Text>
                                    </TouchableOpacity>
                                </>
                            )}

                        </View>

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

const supplierColors = supplierTheme.colors;
const primaryColor = supplierColors.primary[500];
const secondaryLightColor = supplierColors.secondary[100];
const borderLightColor = supplierColors.border.light;
const textPrimaryColor = supplierColors.text.primary;
const textSecondaryColor = supplierColors.text.secondary;
const textInverseColor = supplierColors.text.inverse;
const backgroundDefaultColor = supplierColors.background.default;
const whiteColor = supplierColors.white;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: primaryColor,
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
        color: textInverseColor,
        fontFamily: 'Inter',
    },
    bottomSheet: {
        flex: 1,
        backgroundColor: backgroundDefaultColor,
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
    tabGroupWrapper: {
        marginBottom: theme.spacing.lg,
        width: '100%',
    },
    title: {
        fontSize: 32,
        lineHeight: 38,
        fontWeight: '500',
        color: textPrimaryColor,
        marginBottom: theme.spacing.xs,
        fontFamily: 'Inter',
    },
    subtitle: {
        fontSize: 16,
        lineHeight: 26,
        fontWeight: '400',
        color: textPrimaryColor,
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
        backgroundColor: secondaryLightColor,
        borderWidth: 0,
        borderRadius: 8,
        minHeight: 40,
    },
    inputText: {
        color: textPrimaryColor,
        fontSize: 14,
        fontWeight: '500',
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: theme.spacing.md,
    },
    forgotPasswordText: {
        fontSize: 14,
        color: primaryColor,
        fontWeight: '500',
        fontFamily: 'Inter',
    },
    signInButton: {
        backgroundColor: primaryColor,
        borderRadius: 8,
        height: 40,
        paddingVertical: 0, // Ensure fixed height doesn't clip with Button's default padding
    },
    actionContainer: {
        marginTop: theme.spacing.md,
        paddingHorizontal: 24,
        gap: 10,
    },
    secondaryButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: borderLightColor,
        borderRadius: 8,
        height: 40,
        width: '100%',
    },
    secondaryButtonText: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 16,
        color: textPrimaryColor,
    },
    orText: {
        fontFamily: 'Inter',
        fontSize: 16,
        lineHeight: 26,
        textAlign: 'center',
        color: textSecondaryColor,
        marginVertical: 4,
    },
    googleButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
        backgroundColor: whiteColor,
        borderWidth: 1,
        borderColor: borderLightColor,
        borderRadius: 10,
        height: 48,
        width: '100%',
        gap: 10,
    },
    googleIcon: {
        marginRight: 10,
    },
    googleButtonText: {
        fontFamily: 'Inter',
        fontSize: 16,
        color: textPrimaryColor,
    },
    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: theme.spacing.lg,
    },
    signupText: {
        fontSize: 16,
        lineHeight: 26,
        color: textSecondaryColor,
        fontFamily: 'Inter',
    },
    signupLink: {
        fontSize: 16,
        lineHeight: 26,
        color: textPrimaryColor,
        fontWeight: '600',
        fontFamily: 'Inter',
    },
});

export default LoginScreen;
