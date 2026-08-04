import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { signupThunk, setSelectedUserType, socialLoginThunk } from '@/store/slices/authSlice';
import { GoogleSignin, statusCodes } from '@/services/googleAuth';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { CountryCodeDropdown } from '@/shared/components/CountryCodeDropdown';
import { TabGroup } from '@/shared/components';
import { validation } from '@/shared/utils/validation';
import { supplierTheme, theme } from '@/theme';
import { useToast } from '@/shared/components/Toast';
import { Country } from '@/services/api/core.api';
import { authApi } from '@/services/api/auth.api';
import { GoogleIcon } from '@/assets/icons/GoogleIcon';
import { CustomerGroup, getPublicCustomerGroups } from '@/features/account/api/customer-tax-profile.api';

// ─── Inline Customer Type Dropdown ────────────────────────────────────────────
// Mirrors the InlineDrop component from CustomerTypeTaxScreen

interface DropdownOption { value: string; label: string; }

const InlineDrop: React.FC<{
    label: string;
    options: DropdownOption[];
    value: string | null;
    onSelect: (v: string) => void;
    placeholder?: string;
    error?: string;
    zIndex?: number;
}> = ({ label, options, value, onSelect, placeholder = 'Select...', error, zIndex = 10 }) => {
    const [open, setOpen] = useState(false);
    const selected = options.find((o) => o.value === value);
    return (
        <View style={{ overflow: 'visible', zIndex: open ? 9999 : zIndex, marginBottom: 4 }}>
            <View style={dropStyles.row}>
                <Text style={dropStyles.label}>{label}</Text>
                <TouchableOpacity
                    style={dropStyles.trigger}
                    onPress={() => setOpen((p) => !p)}
                    activeOpacity={0.7}
                >
                    <Text style={[dropStyles.triggerText, !selected && dropStyles.placeholder]} numberOfLines={1}>
                        {selected ? selected.label : placeholder}
                    </Text>
                    <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color="#0A292D" />
                </TouchableOpacity>
            </View>
            {error ? <Text style={dropStyles.errorText}>{error}</Text> : null}
            {open && (
                <>
                    <TouchableOpacity
                        style={dropStyles.overlay}
                        activeOpacity={1}
                        onPress={() => setOpen(false)}
                    />
                    <View style={dropStyles.menu}>
                        {options.map((item) => {
                            const isActive = item.value === value;
                            return (
                                <TouchableOpacity
                                    key={item.value}
                                    style={[dropStyles.option, isActive && dropStyles.optionActive]}
                                    onPress={() => { onSelect(item.value); setOpen(false); }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[dropStyles.optionText, isActive && dropStyles.optionTextActive]}>
                                        {item.label}
                                    </Text>
                                    {isActive && <Ionicons name="checkmark-circle" size={16} color="#00615E" />}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </>
            )}
        </View>
    );
};

const dropStyles = StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
    label: { fontFamily: 'Inter', fontWeight: '500', fontSize: 14, color: '#4B5563', width: 110, flexShrink: 0 },
    trigger: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderWidth: 1, borderColor: '#E1D9CF', borderRadius: 8,
        backgroundColor: '#FAF9F6', paddingHorizontal: 12, paddingVertical: 10,
    },
    triggerText: { flex: 1, fontFamily: 'Inter', fontSize: 14, color: '#0A292D', marginRight: 6 },
    placeholder: { color: '#7D8A8C' },
    overlay: { position: 'absolute', top: -1000, left: -1000, right: -1000, bottom: -1000, zIndex: 1 },
    menu: {
        position: 'absolute', top: 44, left: 122, right: 0,
        backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E1D9CF',
        borderRadius: 10, paddingVertical: 4, zIndex: 9999,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12 },
            android: { elevation: 20 },
        }),
    },
    option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, marginHorizontal: 4 },
    optionActive: { backgroundColor: '#F0FCF8' },
    optionText: { fontFamily: 'Inter', fontSize: 14, color: '#0A292D', flex: 1 },
    optionTextActive: { color: '#00615E', fontWeight: '600' },
    errorText: { fontFamily: 'Inter', fontSize: 12, color: '#DC2626', marginTop: 2, marginLeft: 122 },
});


export const SignupScreen: React.FC = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const params = useLocalSearchParams<{ redirect?: string }>();
    const dispatch = useAppDispatch();
    const { lastSelectedCountry } = useAppSelector(state => state.core);
    const { isLoading } = useAppSelector((state) => state.auth);
    const { showToast } = useToast();
    const selectedUserType = useAppSelector(state => state.auth.selectedUserType ?? 'customer');

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

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        company_name: '',
        url: '',
    });

    const [errors, setErrors] = useState<{
        first_name?: string;
        last_name?: string;
        email?: string;
        phone?: string;
        password?: string;
        confirmPassword?: string;
        company_name?: string;
        url?: string;
        customer_group?: string;
    }>({});

    const [selectedCountry, setSelectedCountry] = useState<Country | null>(lastSelectedCountry || null);

    // ── Customer group dropdown state (customer tab only) ────────────────────
    const [groups, setGroups] = useState<CustomerGroup[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [groupsLoading, setGroupsLoading] = useState(false);

    // Update selectedCountry if lastSelectedCountry changes
    useEffect(() => {
        if (lastSelectedCountry && !selectedCountry) {
            setSelectedCountry(lastSelectedCountry);
        }
    }, [lastSelectedCountry]);

    // Fetch customer groups when customer tab is active
    useEffect(() => {
        if (selectedUserType === 'customer') {
            setGroupsLoading(true);
            getPublicCustomerGroups()
                .then(setGroups)
                .catch(() => {})
                .finally(() => setGroupsLoading(false));
        }
    }, [selectedUserType]);

    const [validating, setValidating] = useState<{
        email?: boolean;
        phone?: boolean;
        url?: boolean;
    }>({});
    const validationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
            }, selectedUserType);

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
    }, [t, selectedUserType]);

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
            }, selectedUserType);

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
    }, [t, selectedUserType]);

    // Validate URL
    const validateUrl = useCallback(async (url: string) => {
        if (!url) {
            setErrors(prev => ({
                ...prev,
                url: t('auth.urlRequired', 'Shop URL is required'),
            }));
            return;
        }

        // Check if URL exists
        setValidating(prev => ({ ...prev, url: true }));
        try {
            const response = await authApi.checkDuplicate({
                type: 'url',
                value: url,
            }, 'supplier');

            if (!response.available) {
                setErrors(prev => ({
                    ...prev,
                    url: response.message || t('auth.urlAlreadyExists', 'This shop URL is already taken'),
                }));
            } else {
                setErrors(prev => ({ ...prev, url: undefined }));
            }
        } catch (error: any) {
            console.error('URL validation error:', error);
        } finally {
            setValidating(prev => ({ ...prev, url: false }));
        }
    }, [t]);

    const handleCountrySelect = useCallback((country: Country) => {
        setSelectedCountry(country);
        // Validate phone when country changes if phone is already entered
        if (formData.phone && /^[0-9]{10}$/.test(formData.phone)) {
            // Clear previous phone error
            setErrors(prev => ({ ...prev, phone: undefined }));
            // Validate phone with new country immediately (no debounce)
            validatePhone(formData.phone, Number(country.id));
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
                validatePhone(formData.phone, Number(selectedCountry?.id));
            }, 500);
        }
    }, [formData.phone, selectedCountry, validatePhone]);

    // Handle URL blur
    const handleUrlBlur = useCallback(() => {
        if (formData.url && selectedUserType === 'supplier') {
            if (validationTimeoutRef.current) {
                clearTimeout(validationTimeoutRef.current);
            }
            validationTimeoutRef.current = setTimeout(() => {
                validateUrl(formData.url);
            }, 500);
        }
    }, [formData.url, selectedUserType, validateUrl]);

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

        if (selectedUserType === 'supplier') {
            if (!validation.isRequired(formData.company_name)) {
                newErrors.company_name = t('auth.companyNameRequired', 'Company name is required');
            }
        }

        if (selectedUserType === 'customer' && !selectedGroupId) {
            newErrors.customer_group = t('auth.customerTypeRequired', 'Please select your customer type');
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
                }, selectedUserType);
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
                    phone_country_id: Number(selectedCountry.id),
                }, selectedUserType);
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

        // // Validate URL if supplier
        // if (selectedUserType === 'supplier' && formData.url && /^[a-z0-9-]+$/.test(formData.url)) {
        //     try {
        //         const urlResponse = await authApi.checkDuplicate({
        //             type: 'url',
        //             value: formData.url,
        //         }, 'supplier');
        //         if (!urlResponse.available) {
        //             setErrors(prev => ({
        //                 ...prev,
        //                 url: urlResponse.message || t('auth.urlAlreadyExists', 'This URL is already taken. Please choose another.'),
        //             }));
        //             hasDuplicateErrors = true;
        //         }
        //     } catch (error) {
        //         console.error('URL validation error:', error);
        //     }
        // }

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

            // Add supplier fields
            if (selectedUserType === 'supplier') {
                signupPayload.company_name = formData.company_name;
            }

            // Add customer group for customer signup
            if (selectedUserType === 'customer' && selectedGroupId) {
                signupPayload.customer_group_id = Number(selectedGroupId);
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
                        type: selectedUserType,
                        // Forward redirect only for customer type
                        ...(selectedUserType === 'customer' && params.redirect ? { redirect: params.redirect } : {}),
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

            // Navigate to home or add-phone after successful signup
            setTimeout(() => {
                if (router.canGoBack()) {
                    router.dismissAll();
                }

                if (result.user && !result.user.phone) {
                    router.replace('/add-phone');
                } else {
                    // Only redirect to cart for customer type
                    if (selectedUserType === 'customer' && params.redirect === 'cart') {
                        router.replace('/(drawer)/(tabs)/cart');
                    } else {
                        router.replace('/(drawer)/(tabs)');
                    }
                }
            }, 500);
        } catch (err: any) {
            showToast({
                message: err || t('auth.unableToCreateAccount'),
                type: 'error',
                duration: 4000,
            });
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

    const handleGoogleSignup = async () => {
        try {
            await GoogleSignin.hasPlayServices();
            const response = await GoogleSignin.signIn();
            const idToken = response.data?.idToken;

            if (idToken) {
                const result = await dispatch(socialLoginThunk({
                    token: idToken,
                    provider: 'google',
                    user_type: selectedUserType,
                })).unwrap();

                showToast({
                    message: t('auth.signupSuccess', 'Account created successfully! Welcome aboard.'),
                    type: 'success',
                    duration: 3000,
                });

                // Navigate after successful login
                setTimeout(() => {
                    if (router.canGoBack()) {
                        router.dismissAll();
                    }

                    if (result.user && !result.user.phone) {
                        router.replace('/add-phone');
                        return;
                    }

                    if (selectedUserType === 'supplier') {
                        router.replace('/(supplier-drawer)/(supplier-tabs)');
                    } else {
                        // Only redirect to cart for customer type
                        if (params.redirect === 'cart') {
                            router.replace('/(drawer)/(tabs)/cart');
                        } else {
                            router.replace('/(drawer)/(tabs)');
                        }
                    }
                }, 500);
            }
        } catch (error: any) {
            console.log('Google Sign-Up Error:', error);
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                // User cancelled
            } else {
                showToast({
                    message: error.message || t('auth.socialSignupFailed', 'Social signup failed. Please try again.'),
                    type: 'error',
                });
            }
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
            <View style={styles.topPanel}>
                {/* <Text style={styles.topTitle}>{t('auth.signUp')}</Text>  */}
            </View>

            <View style={styles.bottomSheet}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.header}>
                        <Text style={styles.title}>{t('auth.createAccount')}</Text>
                        <Text style={styles.subtitle}>{t('auth.signUpToGetStarted')}</Text>
                    </View>

                    <View style={styles.tabGroupWrapper}>
                        <TabGroup
                            tabs={userTypeTabs}
                            activeTab={selectedUserType}
                            onTabChange={handleUserTypeChange}
                        />
                    </View>

                    <View style={styles.form}>
                        <View style={styles.row}>
                            <View style={styles.flex1}>
                                <Input
                                    label={t('auth.firstName')}
                                    placeholder={t('auth.enterFirstName')}
                                    value={formData.first_name}
                                    onChangeText={(text) => updateField('first_name', text)}
                                    error={errors.first_name}
                                    inputContainerStyle={styles.inputField}
                                    style={styles.inputText}
                                    labelStyle={styles.inputLabel}
                                />
                            </View>
                            <View style={styles.spacingHorizontal} />
                            <View style={styles.flex1}>
                                <Input
                                    label={t('auth.lastName')}
                                    placeholder={t('auth.enterLastName')}
                                    value={formData.last_name}
                                    onChangeText={(text) => updateField('last_name', text)}
                                    error={errors.last_name}
                                    inputContainerStyle={styles.inputField}
                                    style={styles.inputText}
                                    labelStyle={styles.inputLabel}
                                />
                            </View>
                        </View>

                        <View style={styles.inputWrapper}>
                            <Input
                                label={t('auth.phone')}
                                placeholder={t('auth.enterPhone')}
                                value={formData.phone}
                                onChangeText={(text) => updateField('phone', text)}
                                onBlur={handlePhoneBlur}
                                error={errors.phone}
                                leftPrefix={
                                    <View style={styles.countryPickerWrapper}>
                                        <CountryCodeDropdown
                                            onCountrySelect={handleCountrySelect}
                                            selectedCountry={selectedCountry}
                                        />
                                    </View>
                                }
                                keyboardType="phone-pad"
                                autoCapitalize="none"
                                autoComplete="tel"
                                editable={!validating.phone}
                                inputContainerStyle={styles.inputField}
                                style={styles.inputText}
                                labelStyle={styles.inputLabel}
                            />
                        </View>

                        <Input
                            label={`${t('auth.email')} ${t('common.optional')}`}
                            placeholder={t('auth.enterYourEmail')}
                            value={formData.email}
                            onChangeText={(text) => updateField('email', text)}
                            onBlur={handleEmailBlur}
                            error={errors.email}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoComplete="email"
                            editable={!validating.email}
                            inputContainerStyle={styles.inputField}
                            style={styles.inputText}
                            labelStyle={styles.inputLabel}
                        />

                        <Input
                            label={t('auth.password')}
                            placeholder={t('auth.createAPassword')}
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
                            label={t('auth.confirmPassword')}
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

                        {selectedUserType === 'customer' && (
                            <View style={styles.customerTypeWrapper}>
                                {groupsLoading ? (
                                    <ActivityIndicator size="small" color={primaryColor} style={{ marginVertical: 8 }} />
                                ) : (
                                    <InlineDrop
                                        label={`${t('auth.customerType', 'Customer Type')} *`}
                                        options={groups.map(g => ({ value: String(g.id), label: g.name }))}
                                        value={selectedGroupId}
                                        onSelect={setSelectedGroupId}
                                        placeholder={t('auth.selectCustomerType', 'Select customer type')}
                                        error={errors.customer_group}
                                        zIndex={100}
                                    />
                                )}
                            </View>
                        )}

                        {selectedUserType === 'supplier' && (
                            <>
                                <Input
                                    label={t('auth.companyName', 'Company Name')}
                                    placeholder={t('auth.enterCompanyName', 'Enter your company name')}
                                    value={formData.company_name}
                                    onChangeText={(text) => updateField('company_name', text)}
                                    error={errors.company_name}
                                    inputContainerStyle={styles.inputField}
                                    style={styles.inputText}
                                    labelStyle={styles.inputLabel}
                                />

                                {/* Shop URL hidden from mobile signup */}
                                {/* <Input
                                    label={t('auth.shopUrl', 'Shop URL')}
                                    placeholder={t('auth.enterShopUrl', 'Enter your shop URL (e.g. my-shop)')}
                                    value={formData.url}
                                    onChangeText={(text) => updateField('url', text.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                                    onBlur={handleUrlBlur}
                                    error={errors.url}
                                    autoCapitalize="none"
                                    editable={!validating.url}
                                    inputContainerStyle={styles.inputField}
                                    style={styles.inputText}
                                    labelStyle={styles.inputLabel}
                                /> */}
                            </>
                        )}

                        <View style={styles.actionContainer}>
                            <Button
                                title={t('auth.signUp')}
                                onPress={handleSignup}
                                loading={isLoading}
                                fullWidth
                                size="medium"
                                style={styles.signUpButton}
                            />

                                    <Text style={styles.orText}>{t('auth.or', 'or')}</Text>

                                    <TouchableOpacity
                                        style={styles.googleButton}
                                        activeOpacity={1}
                                        onPress={handleGoogleSignup}
                                    >
                                        <GoogleIcon width={18} height={18} />
                                        <Text style={styles.googleButtonText}>{t('auth.continueWithGoogle', 'Continue with Google')}</Text>
                                    </TouchableOpacity>


                            <View style={styles.loginContainer}>
                                <Text style={styles.loginText}>{t('auth.alreadyHaveAccount')} </Text>
                                <TouchableOpacity onPress={handleLoginPress}>
                                    <Text style={styles.loginLink}>{t('auth.signIn')}</Text>
                                </TouchableOpacity>
                            </View>
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
        paddingBottom: theme.spacing.md,
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
        paddingTop: theme.spacing.md,
        paddingBottom: theme.spacing['5xl'],
    },
    header: {
        marginBottom: theme.spacing.lg,
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
    row: {
        flexDirection: 'row',
        width: '100%',
    },
    flex1: {
        flex: 1,
    },
    spacingHorizontal: {
        width: theme.spacing.md,
    },
    inputWrapper: {
        width: '100%',
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
    inputLabel: {
        color: textSecondaryColor,
        fontSize: 14,
        marginBottom: 4,
        fontFamily: 'Inter',
    },
    countryPickerWrapper: {
        paddingRight: 4,
        borderRightWidth: 1,
        borderRightColor: borderLightColor,
        marginRight: 4,
    },
    customerTypeWrapper: {
        overflow: 'visible',
        zIndex: 200,
        marginBottom: theme.spacing.md,
    },
    actionContainer: {
        marginTop: theme.spacing.md,
        paddingHorizontal: 24,
        gap: 10,
    },
    signUpButton: {
        backgroundColor: primaryColor,
        borderRadius: 8,
        height: 40,
        paddingVertical: 0,
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
    googleButtonText: {
        fontFamily: 'Inter',
        fontSize: 16,
        color: textPrimaryColor,
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: theme.spacing.lg,
    },

    loginText: {
        fontSize: 16,
        lineHeight: 26,
        color: textSecondaryColor,
        fontFamily: 'Inter',
    },
    loginLink: {
        fontSize: 16,
        lineHeight: 26,
        color: textPrimaryColor,
        fontWeight: '600',
        fontFamily: 'Inter',
    },
});

export default SignupScreen;
