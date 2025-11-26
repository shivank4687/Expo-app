import React, { useState } from 'react';
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
import { useAuth } from '../context/AuthContext';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { validation } from '@/shared/utils/validation';
import { theme } from '@/theme';

export const SignupScreen: React.FC = () => {
    const router = useRouter();
    const { signup } = useAuth();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });

    const [errors, setErrors] = useState<{
        name?: string;
        email?: string;
        password?: string;
        confirmPassword?: string;
    }>({});

    const [isLoading, setIsLoading] = useState(false);

    const updateField = (field: keyof typeof formData, value: string) => {
        setFormData({ ...formData, [field]: value });
        if (errors[field]) {
            setErrors({ ...errors, [field]: undefined });
        }
    };

    const validateForm = (): boolean => {
        const newErrors: typeof errors = {};

        if (!validation.isRequired(formData.name)) {
            newErrors.name = 'Name is required';
        } else if (!validation.minLength(formData.name, 2)) {
            newErrors.name = 'Name must be at least 2 characters';
        }

        if (!validation.isRequired(formData.email)) {
            newErrors.email = 'Email is required';
        } else if (!validation.isValidEmail(formData.email)) {
            newErrors.email = 'Please enter a valid email';
        }

        if (!validation.isRequired(formData.password)) {
            newErrors.password = 'Password is required';
        } else if (!validation.isValidPassword(formData.password)) {
            newErrors.password = validation.getPasswordStrengthMessage(formData.password);
        }

        if (!validation.isRequired(formData.confirmPassword)) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSignup = async () => {
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            await signup({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                password_confirmation: formData.confirmPassword,
            });
            // Navigation will be handled by AuthContext/Navigator
        } catch (error: any) {
            Alert.alert(
                'Signup Failed',
                error.response?.data?.message || 'Unable to create account. Please try again.'
            );
        } finally {
            setIsLoading(false);
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
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Sign up to get started</Text>
                </View>

                <View style={styles.form}>
                    <Input
                        label="Full Name"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChangeText={(text) => updateField('name', text)}
                        error={errors.name}
                        leftIcon="person"
                        autoComplete="name"
                    />

                    <Input
                        label="Email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChangeText={(text) => updateField('email', text)}
                        error={errors.email}
                        leftIcon="mail"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                    />

                    <Input
                        label="Password"
                        placeholder="Create a password"
                        value={formData.password}
                        onChangeText={(text) => updateField('password', text)}
                        error={errors.password}
                        leftIcon="lock-closed"
                        secureTextEntry
                        autoComplete="password-new"
                    />

                    <Input
                        label="Confirm Password"
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChangeText={(text) => updateField('confirmPassword', text)}
                        error={errors.confirmPassword}
                        leftIcon="lock-closed"
                        secureTextEntry
                        autoComplete="password-new"
                    />

                    <Text style={styles.termsText}>
                        By signing up, you agree to our{' '}
                        <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                        <Text style={styles.termsLink}>Privacy Policy</Text>
                    </Text>

                    <Button
                        title="Sign Up"
                        onPress={handleSignup}
                        loading={isLoading}
                        fullWidth
                        size="large"
                    />

                    <View style={styles.loginContainer}>
                        <Text style={styles.loginText}>Already have an account? </Text>
                        <TouchableOpacity onPress={handleLoginPress}>
                            <Text style={styles.loginLink}>Sign In</Text>
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
