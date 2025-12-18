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
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { CountryCodeDropdown } from '@/shared/components/CountryCodeDropdown';
import { validation } from '@/shared/utils/validation';
import { theme } from '@/theme';
import { useToast } from '@/shared/components/Toast';
import { Country } from '@/services/api/core.api';
import { authApi } from '@/services/api/auth.api';

export const ForgotPasswordScreen: React.FC = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const { showToast } = useToast();

    const [phone, setPhone] = useState('');
    const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
    const [error, setError] = useState<string | undefined>();
    const [isLoading, setIsLoading] = useState(false);

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
                phone_country_id: selectedCountry!.id,
                dial_code: selectedCountry!.dial_code,
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
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.header}>
                    <Text style={styles.title}>{t('auth.forgotPasswordTitle')}</Text>
                    <Text style={styles.subtitle}>{t('auth.forgotPasswordSubtitle')}</Text>
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
                                <CountryCodeDropdown
                                    onCountrySelect={handleCountrySelect}
                                    selectedCountry={selectedCountry}
                                />
                            }
                            keyboardType="phone-pad"
                            autoCapitalize="none"
                            autoComplete="tel"
                        />
                    </View>

                    <Button
                        title={t('auth.sendOtp')}
                        onPress={handleSendOtp}
                        loading={isLoading}
                        fullWidth
                        size="large"
                    />

                    <View style={styles.backToLoginContainer}>
                        <TouchableOpacity onPress={handleBackToLogin}>
                            <Text style={styles.backToLoginText}>{t('auth.backToLogin')}</Text>
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
    title: {
        fontSize: theme.typography.fontSize['3xl'],
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.sm,
    },
    subtitle: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.secondary,
        textAlign: 'center',
    },
    form: {
        width: '100%',
    },
    inputWrapper: {
        width: '100%',
        marginBottom: theme.spacing.lg,
    },
    backToLoginContainer: {
        alignItems: 'center',
        marginTop: theme.spacing.xl,
    },
    backToLoginText: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.primary[500],
        fontWeight: theme.typography.fontWeight.semiBold,
    },
});

export default ForgotPasswordScreen;
