import React, { useState, useCallback, useEffect } from 'react';
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
import { validation } from '@/shared/utils/validation';
import { theme } from '@/theme';
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
            });

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

                    <View style={styles.toggleContainer}>
                        <TouchableOpacity
                            style={[
                                styles.toggleButton,
                                selectedUserType === 'customer' && styles.toggleButtonActive,
                            ]}
                            onPress={() => dispatch(setSelectedUserType('customer'))}
                            activeOpacity={0.8}
                        >
                            <Text
                                style={[
                                    styles.toggleButtonText,
                                    selectedUserType === 'customer' && styles.toggleButtonTextActive,
                                ]}
                            >
                                {t('auth.customer', 'Customer')}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.toggleButton,
                                selectedUserType === 'supplier' && styles.toggleButtonActive,
                            ]}
                            onPress={() => dispatch(setSelectedUserType('supplier'))}
                            activeOpacity={0.8}
                        >
                            <Text
                                style={[
                                    styles.toggleButtonText,
                                    selectedUserType === 'supplier' && styles.toggleButtonTextActive,
                                ]}
                            >
                                {t('auth.supplier', 'Supplier')}
                            </Text>
                        </TouchableOpacity>
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
    countryPickerWrapper: {
        paddingRight: 4,
        borderRightWidth: 1,
        borderRightColor: '#EAECE1',
        marginRight: 4,
    },
    actionContainer: {
        marginTop: theme.spacing.md,
        paddingHorizontal: 24,
        gap: 10,
    },
    primaryButton: {
        backgroundColor: '#00615E',
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
        color: '#000000',
        fontWeight: '600',
        fontFamily: 'Inter',
    },
});

export default ForgotPasswordScreen;
