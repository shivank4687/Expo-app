import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { theme } from '@/theme';

const STATIC_PAGES: Record<string, { title: string; content: string }> = {
    'about-us': {
        title: 'About Us',
        content: 'Learn more about our company and mission...',
    },
    'return-policy': {
        title: 'Return Policy',
        content: 'Our return policy details...',
    },
    'terms-conditions': {
        title: 'Terms & Conditions',
        content: 'Terms and conditions of use...',
    },
    'terms-of-use': {
        title: 'Terms of Use',
        content: 'Terms of use for our services...',
    },
    'contact-us': {
        title: 'Contact Us',
        content: 'Get in touch with us...',
    },
    'customer-service': {
        title: 'Customer Service',
        content: 'Customer service information...',
    },
    'whats-new': {
        title: "What's New",
        content: 'Latest updates and features...',
    },
    'payment-policy': {
        title: 'Payment Policy',
        content: 'Payment policy details...',
    },
    'shipping-policy': {
        title: 'Shipping Policy',
        content: 'Shipping policy information...',
    },
    'privacy-policy': {
        title: 'Privacy Policy',
        content: 'Privacy policy details...',
    },
};

export const StaticPageScreen: React.FC = () => {
    const { page } = useLocalSearchParams<{ page: string }>();
    const pageData = page ? STATIC_PAGES[page] : null;

    if (!pageData) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Page not found</Text>
            </View>
        );
    }

    return (
        <>
            <Stack.Screen options={{ title: pageData.title, headerBackTitle: 'Back' }} />
            <ScrollView style={styles.container}>
                <View style={styles.content}>
                    <Text style={styles.title}>{pageData.title}</Text>
                    <Text style={styles.text}>{pageData.content}</Text>
                </View>
            </ScrollView>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.default,
    },
    content: {
        padding: theme.spacing.xl,
        backgroundColor: theme.colors.white,
    },
    title: {
        fontSize: theme.typography.fontSize['2xl'],
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.lg,
    },
    text: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.secondary,
        lineHeight: 24,
    },
    errorText: {
        fontSize: theme.typography.fontSize.lg,
        color: theme.colors.error.main,
        textAlign: 'center',
        marginTop: theme.spacing.xl,
    },
});

export default StaticPageScreen;
