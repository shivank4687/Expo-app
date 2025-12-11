import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { verifyOtpThunk, resendOtpThunk, clearVerification } from '@/store/slices/authSlice';
import { Button } from '@/shared/components/Button';
import { theme } from '@/theme';
import { useToast } from '@/shared/components/Toast';

interface OtpVerificationParams {
    verificationToken: string;
    phone: string;
}

export const OtpVerificationScreen: React.FC = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const params = useLocalSearchParams<OtpVerificationParams>();
    const dispatch = useAppDispatch();
    const { isLoading, verificationToken, error } = useAppSelector((state) => state.auth);
    const { showToast } = useToast();

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [resendCooldown, setResendCooldown] = useState(0);
    const otpInputRefs = useRef<(TextInput | null)[]>([]);
    const autofillInputRef = useRef<TextInput | null>(null);

    // Get verification token from params or Redux state
    const token = params.verificationToken || verificationToken || '';
    const phone = params.phone || '';

    // Mask phone number for display
    const maskedPhone = phone ? phone.replace(/(\d{3})\d{4}(\d+)/, '$1****$2') : '';

    // Verify OTP
    const handleVerify = useCallback(async (otpValue?: string) => {
        const otpCode = otpValue || otp.join('');
        
        if (otpCode.length !== 6) {
            showToast({
                message: t('auth.otpRequired', 'Please enter the 6-digit OTP'),
                type: 'error',
                duration: 3000,
            });
            return;
        }

        if (!token) {
            showToast({
                message: t('auth.invalidVerificationToken', 'Invalid verification token. Please try signing up again.'),
                type: 'error',
                duration: 4000,
            });
            router.back();
            return;
        }

        try {
            await dispatch(verifyOtpThunk({
                verification_token: token,
                otp: otpCode,
                type: 'customer',
                device_name: 'mobile_app',
            })).unwrap();

            showToast({
                message: t('auth.signupSuccess', 'Account created successfully! Welcome aboard.'),
                type: 'success',
                duration: 3000,
            });

            // Navigate to home after successful verification
            setTimeout(() => {
                if (router.canGoBack()) {
                    router.dismissAll();
                }
                router.replace('/(drawer)/(tabs)');
            }, 500);
        } catch (err: any) {
            showToast({
                message: err || t('auth.otpVerificationFailed', 'OTP verification failed. Please try again.'),
                type: 'error',
                duration: 4000,
            });
            // Clear OTP on error
            setOtp(['', '', '', '', '', '']);
            otpInputRefs.current[0]?.focus();
        }
    }, [otp, token, dispatch, router, showToast, t]);

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
                    handleVerify(allDigits);
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
            handleVerify(newOtp.join(''));
        }
    }, [otp, handleVerify]);

    // Handle backspace
    const handleKeyPress = useCallback((index: number, key: string) => {
        if (key === 'Backspace' && !otp[index] && index > 0) {
            otpInputRefs.current[index - 1]?.focus();
        }
    }, [otp]);

    // Handle OTP autofill from SMS
    const handleOtpAutofill = useCallback((value: string) => {
        // Extract only digits from the autofilled value
        const digits = value.replace(/\D/g, '').slice(0, 6);
        
        if (digits.length === 6) {
            // Split into array and update all OTP inputs
            const newOtp = digits.split('');
            setOtp(newOtp);
            
            // Auto-verify after a short delay to ensure state is updated
            setTimeout(() => {
                handleVerify(digits);
            }, 100);
        } else if (digits.length > 0) {
            // If partial autofill, fill what we have
            const newOtp = [...otp];
            digits.split('').forEach((digit, idx) => {
                if (idx < 6) {
                    newOtp[idx] = digit;
                }
            });
            setOtp(newOtp);
        }
    }, [otp, handleVerify]);

    // Resend OTP
    const handleResendOtp = useCallback(async () => {
        if (resendCooldown > 0) {
            return;
        }

        if (!token) {
            showToast({
                message: t('auth.invalidVerificationToken', 'Invalid verification token. Please try signing up again.'),
                type: 'error',
                duration: 4000,
            });
            router.back();
            return;
        }

        try {
            await dispatch(resendOtpThunk({
                verification_token: token,
                type: 'customer',
            })).unwrap();

            showToast({
                message: t('auth.otpResent', 'OTP has been resent to your phone number'),
                type: 'success',
                duration: 3000,
            });

            // Set cooldown (30 seconds)
            setResendCooldown(30);
        } catch (err: any) {
            showToast({
                message: err || t('auth.resendOtpFailed', 'Failed to resend OTP. Please try again.'),
                type: 'error',
                duration: 4000,
            });
        }
    }, [token, dispatch, router, showToast, t, resendCooldown]);

    // Cooldown timer
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => {
                setResendCooldown(resendCooldown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    // Focus first input on mount
    useEffect(() => {
        const timer = setTimeout(() => {
            otpInputRefs.current[0]?.focus();
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            dispatch(clearVerification());
        };
    }, [dispatch]);

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
                    <Text style={styles.title}>{t('auth.verifyOtp', 'Verify OTP')}</Text>
                    <Text style={styles.subtitle}>
                        {t('auth.otpSentTo', 'We sent a 6-digit code to')} {maskedPhone || phone}
                    </Text>
                </View>

                <View style={styles.form}>
                    {/* Hidden input for SMS autofill */}
                    <TextInput
                        ref={autofillInputRef}
                        style={styles.hiddenInput}
                        value=""
                        onChangeText={handleOtpAutofill}
                        keyboardType="number-pad"
                        textContentType="oneTimeCode"
                        autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'off'}
                        maxLength={6}
                        editable={!isLoading}
                    />
                    
                    <View style={styles.otpContainer}>
                        {otp.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={(ref) => (otpInputRefs.current[index] = ref)}
                                style={[
                                    styles.otpInput,
                                    digit ? styles.otpInputFilled : null,
                                    isLoading ? styles.otpInputDisabled : null,
                                ]}
                                value={digit}
                                onChangeText={(value) => handleOtpChange(index, value)}
                                onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                                keyboardType="number-pad"
                                maxLength={index === 0 ? 6 : 1}
                                selectTextOnFocus
                                editable={!isLoading}
                                textContentType={index === 0 ? 'oneTimeCode' : 'none'}
                                autoComplete={index === 0 && Platform.OS === 'android' ? 'sms-otp' : 'off'}
                            />
                        ))}
                    </View>

                    {error && (
                        <Text style={styles.errorText}>{error}</Text>
                    )}

                    <Button
                        title={t('auth.verify', 'Verify')}
                        onPress={() => handleVerify()}
                        loading={isLoading}
                        fullWidth
                        size="large"
                        style={styles.verifyButton}
                    />

                    <View style={styles.resendContainer}>
                        <Text style={styles.resendText}>
                            {t('auth.didntReceiveCode', "Didn't receive the code?")}{' '}
                        </Text>
                        {resendCooldown > 0 ? (
                            <Text style={styles.cooldownText}>
                                {t('auth.resendIn', 'Resend in')} {resendCooldown}s
                            </Text>
                        ) : (
                            <TouchableOpacity 
                                onPress={handleResendOtp} 
                                disabled={isLoading}
                                style={isLoading ? styles.resendDisabled : undefined}
                            >
                                <Text style={[
                                    styles.resendLink,
                                    isLoading ? styles.resendLinkDisabled : null,
                                ]}>
                                    {t('auth.resendOtp', 'Resend OTP')}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                        disabled={isLoading}
                    >
                        <Text style={[
                            styles.backButtonText,
                            isLoading ? styles.backButtonTextDisabled : null,
                        ]}>
                            {t('auth.backToSignup', 'Back to Sign Up')}
                        </Text>
                    </TouchableOpacity>
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
        textAlign: 'center',
    },
    form: {
        width: '100%',
    },
    hiddenInput: {
        position: 'absolute',
        opacity: 0,
        width: 0,
        height: 0,
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.xl,
    },
    otpInput: {
        width: 50,
        height: 60,
        borderWidth: 2,
        borderColor: theme.colors.border.light,
        borderRadius: theme.borderRadius.md,
        fontSize: theme.typography.fontSize['2xl'],
        fontWeight: theme.typography.fontWeight.bold,
        textAlign: 'center',
        color: theme.colors.text.primary,
        backgroundColor: theme.colors.background.paper,
    },
    otpInputFilled: {
        borderColor: theme.colors.primary[500],
        backgroundColor: theme.colors.primary[50],
    },
    otpInputDisabled: {
        opacity: 0.6,
        backgroundColor: theme.colors.background.default,
    },
    errorText: {
        color: theme.colors.error[500],
        fontSize: theme.typography.fontSize.sm,
        marginBottom: theme.spacing.md,
        textAlign: 'center',
    },
    verifyButton: {
        marginBottom: theme.spacing.lg,
    },
    resendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    resendText: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.secondary,
    },
    resendLink: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.primary[500],
        fontWeight: theme.typography.fontWeight.semiBold,
    },
    resendLinkDisabled: {
        opacity: 0.5,
        color: theme.colors.text.secondary,
    },
    resendDisabled: {
        opacity: 0.5,
    },
    cooldownText: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.secondary,
        fontWeight: theme.typography.fontWeight.medium,
    },
    backButton: {
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
    },
    backButtonText: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.secondary,
    },
    backButtonTextDisabled: {
        opacity: 0.5,
    },
});

export default OtpVerificationScreen;
