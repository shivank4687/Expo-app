import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { subscriptionApi } from '@/services/api/subscription.api';
import { theme } from '@/theme';
import { Input } from '@/shared/components/Input';
import { Button } from '@/shared/components/Button';
import { useToast } from '@/shared/components/Toast';
import { useTranslation } from 'react-i18next';

export const NewsletterSubscription = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { showToast } = useToast();
    const { t } = useTranslation();

    const handleSubscribe = async () => {
        setError('');
        if (!email) {
            setError(t('newsletter.emailRequired'));
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError(t('newsletter.emailInvalid'));
            return;
        }

        setIsLoading(true);
        try {
            const response = await subscriptionApi.subscribe(email);
            showToast({
                message: response.message || t('newsletter.subscribeSuccess'),
                type: 'success',
            });
            setEmail('');
        } catch (error: any) {
            showToast({
                message: error.message || t('newsletter.subscribeFailed'),
                type: 'error',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.heading} role="heading" aria-level="2">
                {t('newsletter.heading')}
            </Text>

            <Text style={styles.subtext}>
                {t('newsletter.subtext')}
            </Text>

            <View style={styles.formContainer}>
                <Input
                    placeholder={t('newsletter.emailPlaceholder')}
                    value={email}
                    onChangeText={(text) => {
                        setEmail(text);
                        if (error) setError('');
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                    error={error}
                    containerStyle={styles.inputContainer}
                />

                <Button
                    title={t('newsletter.subscribeButton')}
                    onPress={handleSubscribe}
                    loading={isLoading}
                    style={styles.button}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.xl,
        gap: 10,
    },
    heading: {
        fontFamily: theme.typography.fontFamily.regular,
        fontSize: 30, // Approx 3xl
        lineHeight: 45,
        fontStyle: 'italic',
        color: '#1e3a8a', // navyBlue approximate
        maxWidth: 288,
        textAlign: 'center',
        alignSelf: 'center',
    },
    subtext: {
        fontSize: 12, // text-xs
        color: theme.colors.text.primary,
        textAlign: 'center',
    },
    formContainer: {
        marginTop: 10,
        width: '100%',
        maxWidth: 420,
        alignSelf: 'center',
    },
    inputContainer: {
        marginBottom: 10,
    },
    button: {
        marginTop: 0,
        alignSelf: 'center',
        paddingHorizontal: 40,
    },
});
