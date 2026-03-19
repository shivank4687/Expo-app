import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { CountryCodeDropdown } from '@/shared/components/CountryCodeDropdown';
import { TabGroup } from '@/shared/components';
import { validation } from '@/shared/utils/validation';
import { supplierTheme, theme } from '@/theme';
import { useToast } from '@/shared/components/Toast';
import { Country } from '@/services/api/core.api';
import { authApi } from '@/services/api/auth.api';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setSelectedUserType } from '@/store/slices/authSlice';

export const ForgotPasswordScreen: React.FC = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const { showToast } = useToast();
    const dispatch = useAppDispatch();
    const { lastSelectedCountry } = useAppSelector(state => state.core);
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

    const [phone, setPhone] = useState('');
    const [selectedCountry, setSelectedCountry] = useState<Country | null>(lastSelectedCountry || null);
    const [error, setError] = useState<string | undefined>();
    const [isLoading, setIsLoading] = useState(false);

    // Update selectedCountry if lastSelectedCountry changes
    useEffect(() => {
        if (lastSelectedCountry && !selectedCountry) {
            setSelectedCountry(lastSelectedCountry);
        }
    }, [lastSelectedCountry]);

    const handlePhoneChange = useCallback((text: string) => {
        setPhone(text);
        if (error) {
            setError(undefined);
        }
    }, [error]);

    const handleCountrySelect = useCallback((country: Country) => {
        setSelectedCountry(country);
        if (error) {
            setError(undefined);
        }
    }, [error]);

    const validateForm = (): boolean => {
        if (!validation.isRequired(phone)) {
            setError(t('auth.phoneRequired'));
            return false;
        }

        if (!/^[0-9]{10}$/.test(phone)) {
            setError(t('auth.phoneInvalid'));
            return false;
        }

        if (!selectedCountry) {
            setError(t('auth.countryRequired'));
            return false;
        }

        return true;
    };

    const handleSendOtp = async () => {
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            const response = await authApi.forgotPasswordPhone({
                phone,
                phone_country_id: Number(selectedCountry!.id),
                dial_code: selectedCountry!.dial_code || '',
            }, selectedUserType);

            showToast({
                message: response.message || t('auth.otpSentForPasswordReset'),
                type: 'success',
                duration: 3000,
            });

            // Navigate to OTP verification screen
            const phoneWithCode = `${selectedCountry!.dial_code}${phone}`;
            router.push({
                pathname: '/otp-verification',
                params: {
                    verificationToken: response.verification_token,
                    phone: phoneWithCode,
                    type: 'password_reset',
                    userType: selectedUserType,
                },
            } as any);
        } catch (err: any) {
            // Extract error message from different possible error structures
            let errorMessage = t('auth.phoneNotFound');

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

    const handleBackToLogin = () => {
        router.back();
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.topPanel}>
                {/* <Text style={styles.topTitle}>{t('auth.forgotPasswordTitle')}</Text> */}
            </View>

            <View style={styles.bottomSheet}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.header}>
                        <Text style={styles.title}>{t('auth.forgotPasswordTitle')}</Text>
                        <Text style={styles.subtitle}>{t('auth.forgotPasswordSubtitle')}</Text>
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
                                label={t('auth.phone')}
                                placeholder={t('auth.enterPhone')}
                                value={phone}
                                onChangeText={handlePhoneChange}
                                error={error}
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
                                inputContainerStyle={styles.inputField}
                                style={styles.inputText}
                                labelStyle={styles.inputLabel}
                            />
                        </View>

                        <View style={styles.actionContainer}>
                            <Button
                                title={t('auth.sendOtp')}
                                onPress={handleSendOtp}
                                loading={isLoading}
                                fullWidth
                                size="medium"
                                style={styles.primaryButton}
                            />

                            <View style={styles.backToLoginContainer}>
                                <TouchableOpacity onPress={handleBackToLogin}>
                                    <Text style={styles.backToLoginText}>{t('auth.backToLogin')}</Text>
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
    actionContainer: {
        marginTop: theme.spacing.md,
        paddingHorizontal: 24,
        gap: 10,
    },
    primaryButton: {
        backgroundColor: primaryColor,
        borderRadius: 8,
        height: 40,
        paddingVertical: 0,
    },
    backToLoginContainer: {
        alignItems: 'center',
        marginTop: theme.spacing.lg,
    },
    backToLoginText: {
        fontSize: 16,
        lineHeight: 26,
        color: textPrimaryColor,
        fontWeight: '600',
        fontFamily: 'Inter',
    },
});

export default ForgotPasswordScreen;
