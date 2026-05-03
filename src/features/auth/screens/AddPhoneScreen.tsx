import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { sendPhoneOtpThunk, verifyPhoneOtpThunk, logoutThunk } from '@/store/slices/authSlice';
import { sendSupplierPhoneOtpThunk, verifySupplierPhoneOtpThunk, supplierLogoutThunk } from '@/store/slices/supplierAuthSlice';
import { Button } from '@/shared/components/Button';
import { CountryCodeDropdown } from '@/shared/components/CountryCodeDropdown';
import { supplierTheme, theme } from '@/theme';
import { useToast } from '@/shared/components/Toast';
import { Country } from '@/services/api/core.api';
import { Input } from '@/shared/components/Input';

export const AddPhoneScreen: React.FC = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { showToast } = useToast();

    const { user, isAuthenticated: isCustomerAuthenticated, isLoading: isCustomerLoading } = useAppSelector((state) => state.auth);
    const { supplier, isAuthenticated: isSupplierAuthenticated, isLoading: isSupplierLoading } = useAppSelector((state) => state.supplierAuth);
    const { lastSelectedCountry } = useAppSelector((state) => state.core);

    const isSupplier = isSupplierAuthenticated;
    const isLoading = isCustomerLoading || isSupplierLoading;

    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [phone, setPhone] = useState('');
    const [selectedCountry, setSelectedCountry] = useState<Country | null>(lastSelectedCountry || null);
    
    // Update selectedCountry if lastSelectedCountry changes
    useEffect(() => {
        if (lastSelectedCountry && !selectedCountry) {
            setSelectedCountry(lastSelectedCountry);
        }
    }, [lastSelectedCountry]);
    
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [verificationToken, setVerificationToken] = useState('');
    const [maskedPhone, setMaskedPhone] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    
    const otpInputRefs = useRef<(TextInput | null)[]>([]);

    // Handle Send OTP
    const handleSendOtp = async () => {
        if (!phone || phone.length < 10) {
            showToast({
                message: t('auth.phoneInvalid', 'Please enter a valid 10-digit phone number'),
                type: 'error',
            });
            return;
        }

        if (!selectedCountry) {
            showToast({
                message: t('auth.countryRequired', 'Please select a country code'),
                type: 'error',
            });
            return;
        }

        try {
            const data = {
                phone,
                phone_country_id: Number(selectedCountry.id),
                dial_code: selectedCountry.dial_code,
            };

            const result = await dispatch(isSupplier ? sendSupplierPhoneOtpThunk(data) : sendPhoneOtpThunk(data)).unwrap();
            
            setVerificationToken(result.verification_token);
            setMaskedPhone(result.phone);
            setStep('otp');
            setResendCooldown(30);
            
            showToast({
                message: t('auth.otpSent', 'OTP has been sent to your phone number'),
                type: 'success',
            });
        } catch (err: any) {
            showToast({
                message: err || t('auth.failedToSendOtp', 'Failed to send OTP'),
                type: 'error',
            });
        }
    };

    // Handle Verify OTP
    const handleVerifyOtp = useCallback(async (otpValue?: string) => {
        const otpCode = otpValue || otp.join('');

        if (otpCode.length !== 6) {
            showToast({
                message: t('auth.otpRequired', 'Please enter the 6-digit OTP'),
                type: 'error',
            });
            return;
        }

        try {
            await dispatch(isSupplier ? verifySupplierPhoneOtpThunk({
                verification_token: verificationToken,
                otp: otpCode,
            }) : verifyPhoneOtpThunk({
                verification_token: verificationToken,
                otp: otpCode,
            })).unwrap();

            showToast({
                message: t('auth.phoneVerified', 'Phone number verified successfully!'),
                type: 'success',
            });

            // Redirect to appropriate dashboard
            setTimeout(() => {
                if (isSupplier) {
                    router.replace('/(supplier-drawer)/(supplier-tabs)');
                } else {
                    router.replace('/(drawer)/(tabs)');
                }
            }, 500);
        } catch (err: any) {
            showToast({
                message: err || t('auth.otpVerificationFailed', 'OTP verification failed'),
                type: 'error',
            });
            setOtp(['', '', '', '', '', '']);
            otpInputRefs.current[0]?.focus();
        }
    }, [dispatch, isSupplier, otp, router, showToast, t, verificationToken]);

    // Handle Logout
    const handleLogout = async () => {
        await dispatch(isSupplier ? supplierLogoutThunk() : logoutThunk());
        router.replace('/login');
    };

    // Resend OTP
    const handleResendOtp = async () => {
        if (resendCooldown > 0) return;
        handleSendOtp();
    };

    // Timer for resend cooldown
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    // Handle OTP input change
    const handleOtpChange = useCallback((index: number, value: string) => {
        // Extract only digits
        const digits = value.replace(/\D/g, '');

        // If multiple digits detected (autofill), handle it specially
        if (digits.length > 1) {
            const allDigits = digits.slice(0, 6);
            const newOtp = allDigits.split('');
            // Pad with empty strings if less than 6 digits
            while (newOtp.length < 6) {
                newOtp.push('');
            }
            setOtp(newOtp);

            // Auto-verify if we have 6 digits
            if (allDigits.length === 6) {
                setTimeout(() => {
                    handleVerifyOtp(allDigits);
                }, 100);
            }
            return;
        }

        // Single digit input (normal typing)
        if (value && !/^\d$/.test(value)) {
            return;
        }

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            otpInputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all 6 digits are entered
        if (newOtp.every(digit => digit !== '') && newOtp.length === 6) {
            handleVerifyOtp(newOtp.join(''));
        }
    }, [otp, handleVerifyOtp]);

    const handleKeyPress = (index: number, key: string) => {
        if (key === 'Backspace' && !otp[index] && index > 0) {
            otpInputRefs.current[index - 1]?.focus();
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
        >
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.header}>
                    <Text style={styles.title}>
                        {step === 'phone' ? t('auth.addPhone', 'Add Phone Number') : t('auth.verifyOtp', 'Verify OTP')}
                    </Text>
                    <Text style={styles.subtitle}>
                        {step === 'phone' 
                            ? t('auth.addPhoneSubtitle', 'Please add your phone number to continue.') 
                            : `${t('auth.otpSentTo', 'We sent a 6-digit code to')} ${maskedPhone}`}
                    </Text>
                </View>

                {step === 'phone' ? (
                    <View style={styles.form}>
                        <Input
                            label={t('auth.phone', 'Phone Number')}
                            placeholder={t('auth.enterPhone', 'Enter phone number')}
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            maxLength={10}
                            leftPrefix={
                                <View style={styles.countryPickerWrapper}>
                                    <CountryCodeDropdown
                                        onCountrySelect={setSelectedCountry}
                                        selectedCountry={selectedCountry}
                                    />
                                </View>
                            }
                            inputContainerStyle={styles.inputField}
                            style={styles.inputText}
                        />

                        <Button
                            title={t('auth.sendOtp', 'Send OTP')}
                            onPress={handleSendOtp}
                            loading={isLoading}
                            fullWidth
                            size="large"
                            style={styles.button}
                        />
                    </View>
                ) : (
                    <View style={styles.form}>
                        <View style={styles.otpContainer}>
                            {otp.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    ref={ref => otpInputRefs.current[index] = ref}
                                    style={styles.otpInput}
                                    value={digit}
                                    onChangeText={v => handleOtpChange(index, v)}
                                    onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                                    keyboardType="number-pad"
                                    maxLength={index === 0 ? 6 : 1}
                                    selectTextOnFocus
                                    textContentType={index === 0 ? 'oneTimeCode' : 'none'}
                                    autoComplete={index === 0 && Platform.OS === 'android' ? 'sms-otp' : 'off'}
                                />
                            ))}
                        </View>

                        <View style={styles.resendContainer}>
                            {resendCooldown > 0 ? (
                                <Text style={styles.resendText}>{t('auth.resendIn', 'Resend in')} {resendCooldown}s</Text>
                            ) : (
                                <TouchableOpacity onPress={handleResendOtp}>
                                    <Text style={styles.resendLink}>{t('auth.resendOtp', 'Resend OTP')}</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <Button
                            title={t('auth.verify', 'Verify')}
                            onPress={() => handleVerifyOtp()}
                            loading={isLoading}
                            fullWidth
                            size="large"
                            style={styles.button}
                        />
                        
                        <TouchableOpacity onPress={() => setStep('phone')} style={styles.backLink}>
                            <Text style={styles.backLinkText}>{t('auth.changePhoneNumber', 'Change Phone Number')}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <Text style={styles.logoutText}>{t('auth.logout', 'Logout')}</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const supplierColors = supplierTheme.colors;
const primaryColor = supplierColors.primary[500];
const textPrimaryColor = supplierColors.text.primary;
const textSecondaryColor = supplierColors.text.secondary;
const borderLightColor = supplierColors.border.light;
const backgroundDefaultColor = supplierColors.background.default;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: backgroundDefaultColor,
    },
    scrollContent: {
        padding: 24,
        flexGrow: 1,
    },
    header: {
        marginBottom: 32,
        marginTop: 60,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: textPrimaryColor,
        marginBottom: 12,
        fontFamily: 'Inter',
    },
    subtitle: {
        fontSize: 16,
        color: textSecondaryColor,
        lineHeight: 24,
        fontFamily: 'Inter',
    },
    form: {
        width: '100%',
    },
    inputField: {
        backgroundColor: theme.colors.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: borderLightColor,
        height: 56,
    },
    inputText: {
        fontSize: 16,
        color: textPrimaryColor,
    },
    countryPickerWrapper: {
        marginRight: 8,
    },
    button: {
        marginTop: 24,
        borderRadius: 12,
        backgroundColor: primaryColor,
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 32,
    },
    otpInput: {
        width: 48,
        height: 56,
        backgroundColor: theme.colors.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: borderLightColor,
        fontSize: 24,
        fontWeight: '600',
        textAlign: 'center',
        color: textPrimaryColor,
    },
    resendContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    resendText: {
        color: textSecondaryColor,
        fontSize: 14,
    },
    resendLink: {
        color: primaryColor,
        fontWeight: '600',
        fontSize: 14,
        textDecorationLine: 'underline',
    },
    backLink: {
        alignItems: 'center',
        marginTop: 16,
    },
    backLinkText: {
        color: textSecondaryColor,
        textDecorationLine: 'underline',
        fontSize: 14,
    },
    logoutButton: {
        marginTop: 'auto',
        paddingVertical: 24,
        alignItems: 'center',
    },
    logoutText: {
        color: theme.colors.error.main,
        fontWeight: '600',
        fontSize: 16,
    },
});

export default AddPhoneScreen;
