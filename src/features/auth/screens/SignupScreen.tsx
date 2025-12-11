import React, { useState, useCallback, useRef, useEffect } from 'react';
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
import { CountryCodeDropdown } from '@/shared/components/CountryCodeDropdown';
import { validation } from '@/shared/utils/validation';
import { theme } from '@/theme';
import { useToast } from '@/shared/components/Toast';
import { Country } from '@/services/api/core.api';
import { authApi } from '@/services/api/auth.api';

export const SignupScreen: React.FC = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { isLoading } = useAppSelector((state) => state.auth);
    const { showToast } = useToast();

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });

    const [errors, setErrors] = useState<{
        first_name?: string;
        last_name?: string;
        email?: string;
        phone?: string;
        password?: string;
        confirmPassword?: string;
    }>({});

    const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
    const [validating, setValidating] = useState<{
        email?: boolean;
        phone?: boolean;
    }>({});
    const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const updateField = useCallback((field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setErrors(prev => ({ ...prev, [field]: undefined }));
    }, []);

    // Validate email
    const validateEmail = useCallback(async (email: string) => {
        if (!email) {
            return; // Email is optional
        }

        // Basic email format validation
        if (!validation.isValidEmail(email)) {
            setErrors(prev => ({
                ...prev,
                email: t('auth.emailInvalid', 'Please enter a valid email address'),
            }));
            return;
        }

        // Check if email exists
        setValidating(prev => ({ ...prev, email: true }));
        try {
            const response = await authApi.checkDuplicate({
                type: 'email',
                value: email,
            });

            if (!response.available) {
                setErrors(prev => ({
                    ...prev,
                    email: response.message || t('auth.emailAlreadyExists', 'This email is already registered. Please login instead.'),
                }));
            } else {
                setErrors(prev => ({ ...prev, email: undefined }));
            }
        } catch (error: any) {
            console.error('Email validation error:', error);
            // Don't show error for validation failures, just log
        } finally {
            setValidating(prev => ({ ...prev, email: false }));
        }
    }, [t]);

    // Validate phone
    const validatePhone = useCallback(async (phone: string, countryId?: number) => {
        if (!phone) {
            setErrors(prev => ({
                ...prev,
                phone: t('auth.phoneRequired', 'Phone number is required'),
            }));
            return;
        }

        // Basic phone format validation
        if (!/^[0-9]{10}$/.test(phone)) {
            setErrors(prev => ({
                ...prev,
                phone: t('auth.phoneInvalid', 'Please enter a valid 10-digit phone number'),
            }));
            return;
        }

        if (!countryId) {
            setErrors(prev => ({
                ...prev,
                phone: t('auth.countryRequired', 'Please select a country code'),
            }));
            return;
        }

        // Check if phone exists
        setValidating(prev => ({ ...prev, phone: true }));
        try {
            const response = await authApi.checkDuplicate({
                type: 'phone',
                value: phone,
                phone_country_id: countryId,
            });

            if (!response.available) {
                setErrors(prev => ({
                    ...prev,
                    phone: response.message || t('auth.phoneAlreadyExists', 'This phone number is already registered. Please login instead.'),
                }));
            } else {
                setErrors(prev => ({ ...prev, phone: undefined }));
            }
        } catch (error: any) {
            console.error('Phone validation error:', error);
            // Don't show error for validation failures, just log
        } finally {
            setValidating(prev => ({ ...prev, phone: false }));
        }
    }, [t]);

    const handleCountrySelect = useCallback((country: Country) => {
        setSelectedCountry(country);
        // Validate phone when country changes if phone is already entered
        if (formData.phone && /^[0-9]{10}$/.test(formData.phone)) {
            // Clear previous phone error
            setErrors(prev => ({ ...prev, phone: undefined }));
            // Validate phone with new country immediately (no debounce)
            validatePhone(formData.phone, country.id);
        } else if (formData.phone) {
            // If phone format is invalid, just clear the country-related error
            setErrors(prev => {
                const newErrors = { ...prev };
                if (newErrors.phone?.includes('country')) {
                    delete newErrors.phone;
                }
                return newErrors;
            });
        }
    }, [formData.phone, validatePhone]);

    // Handle email blur
    const handleEmailBlur = useCallback(() => {
        if (formData.email) {
            // Clear any existing timeout
            if (validationTimeoutRef.current) {
                clearTimeout(validationTimeoutRef.current);
            }
            // Debounce validation by 500ms
            validationTimeoutRef.current = setTimeout(() => {
                validateEmail(formData.email);
            }, 500);
        }
    }, [formData.email, validateEmail]);

    // Handle phone blur
    const handlePhoneBlur = useCallback(() => {
        if (formData.phone) {
            // Clear any existing timeout
            if (validationTimeoutRef.current) {
                clearTimeout(validationTimeoutRef.current);
            }
            // Debounce validation by 500ms
            validationTimeoutRef.current = setTimeout(() => {
                validatePhone(formData.phone, selectedCountry?.id);
            }, 500);
        }
    }, [formData.phone, selectedCountry, validatePhone]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (validationTimeoutRef.current) {
                clearTimeout(validationTimeoutRef.current);
            }
        };
    }, []);

    const validateForm = (): boolean => {
        const newErrors: typeof errors = {};

        if (!validation.isRequired(formData.first_name)) {
            newErrors.first_name = t('auth.firstNameRequired', 'First name is required');
        } else if (!validation.minLength(formData.first_name, 2)) {
            newErrors.first_name = t('auth.nameMinLength');
        }

        if (!validation.isRequired(formData.last_name)) {
            newErrors.last_name = t('auth.lastNameRequired', 'Last name is required');
        } else if (!validation.minLength(formData.last_name, 2)) {
            newErrors.last_name = t('auth.nameMinLength');
        }

        // Email is optional, but if provided, must be valid
        if (formData.email && !validation.isValidEmail(formData.email)) {
            newErrors.email = t('auth.emailInvalid');
        } else if (formData.email && errors.email) {
            // Preserve existing "already exists" error if present
            newErrors.email = errors.email;
        }

        // Phone is required
        if (!validation.isRequired(formData.phone)) {
            newErrors.phone = t('auth.phoneRequired', 'Phone number is required');
        } else if (!/^[0-9]{10}$/.test(formData.phone)) {
            newErrors.phone = t('auth.phoneInvalid', 'Please enter a valid 10-digit phone number');
        } else if (!selectedCountry) {
            newErrors.phone = t('auth.countryRequired', 'Please select a country code');
        } else if (errors.phone && (
            errors.phone.includes('already registered') || 
            errors.phone.includes('already exists')
        )) {
            // Preserve existing "already exists" error if present
            newErrors.phone = errors.phone;
        }

        if (!validation.isRequired(formData.password)) {
            newErrors.password = t('auth.passwordRequired');
        } else if (formData.password.length < 6) {
            newErrors.password = t('auth.passwordMinLength', 'Password must be at least 6 characters');
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
        // First validate basic form fields
        if (!validateForm()) return;

        // Re-validate email and phone to ensure they don't exist
        let hasDuplicateErrors = false;

        // Validate email if provided
        if (formData.email && validation.isValidEmail(formData.email)) {
            try {
                const emailResponse = await authApi.checkDuplicate({
                    type: 'email',
                    value: formData.email,
                });
                if (!emailResponse.available) {
                    setErrors(prev => ({
                        ...prev,
                        email: emailResponse.message || t('auth.emailAlreadyExists', 'This email is already registered. Please login instead.'),
                    }));
                    hasDuplicateErrors = true;
                }
            } catch (error) {
                console.error('Email validation error:', error);
            }
        }

        // Validate phone
        if (formData.phone && /^[0-9]{10}$/.test(formData.phone) && selectedCountry) {
            try {
                const phoneResponse = await authApi.checkDuplicate({
                    type: 'phone',
                    value: formData.phone,
                    phone_country_id: selectedCountry.id,
                });
                if (!phoneResponse.available) {
                    setErrors(prev => ({
                        ...prev,
                        phone: phoneResponse.message || t('auth.phoneAlreadyExists', 'This phone number is already registered. Please login instead.'),
                    }));
                    hasDuplicateErrors = true;
                }
            } catch (error) {
                console.error('Phone validation error:', error);
            }
        }

        // If duplicate errors found, stop submission
        if (hasDuplicateErrors) {
            return;
        }

        try {
            // Prepare signup payload
            const signupPayload: any = {
                first_name: formData.first_name,
                last_name: formData.last_name,
                phone: formData.phone,
                password: formData.password,
                password_confirmation: formData.confirmPassword,
            };

            // Add email if provided (optional)
            if (formData.email) {
                signupPayload.email = formData.email;
            }

            // Add phone country info (required with phone)
            if (selectedCountry) {
                signupPayload.phone_country_id = selectedCountry.id;
                signupPayload.dial_code = selectedCountry.dial_code;
            }

            const result = await dispatch(signupThunk(signupPayload)).unwrap();

            // Check if OTP verification is required
            if (result.requiresOtp && result.verificationToken) {
                // Navigate to OTP verification screen
                const phoneWithCode = selectedCountry 
                    ? `${selectedCountry.dial_code}${formData.phone}`
                    : formData.phone;

                router.push({
                    pathname: '/otp-verification',
                    params: {
                        verificationToken: result.verificationToken,
                        phone: phoneWithCode,
                    },
                });
                return;
            }

            // Direct registration successful (email-only or no OTP required)
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
                        label={t('auth.firstName')}
                        placeholder={t('auth.enterFirstName', 'Enter your first name')}
                        value={formData.first_name}
                        onChangeText={(text) => updateField('first_name', text)}
                        error={errors.first_name}
                        leftIcon="person"
                        autoComplete="given-name"
                    />

                    <Input
                        label={t('auth.lastName')}
                        placeholder={t('auth.enterLastName', 'Enter your last name')}
                        value={formData.last_name}
                        onChangeText={(text) => updateField('last_name', text)}
                        error={errors.last_name}
                        leftIcon="person"
                        autoComplete="family-name"
                    />

                    <View style={styles.inputWrapper}>
                        <Input
                            label={t('auth.phone')}
                            placeholder={t('auth.enterPhone', 'Enter your phone number')}
                            value={formData.phone}
                            onChangeText={(text) => updateField('phone', text)}
                            onBlur={handlePhoneBlur}
                            error={errors.phone}
                            leftPrefix={
                                <CountryCodeDropdown
                                    onCountrySelect={handleCountrySelect}
                                    selectedCountry={selectedCountry}
                                />
                            }
                            keyboardType="phone-pad"
                            autoCapitalize="none"
                            autoComplete="tel"
                            editable={!validating.phone}
                        />
                    </View>

                    <Input
                        label={`${t('auth.email')} ${t('common.optional')}`}
                        placeholder={t('auth.enterYourEmail')}
                        value={formData.email}
                        onChangeText={(text) => updateField('email', text)}
                        onBlur={handleEmailBlur}
                        error={errors.email}
                        leftIcon="mail"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        editable={!validating.email}
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

                    {/* <Text style={styles.termsText}>
                        {t('auth.termsAgreement')}{' '}
                        <Text style={styles.termsLink}>{t('auth.termsOfService')}</Text> {t('auth.and')}{' '}
                        <Text style={styles.termsLink}>{t('auth.privacyPolicy')}</Text>
                    </Text> */}

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
    inputWrapper: {
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
