/**
 * CheckoutAuthModal Component
 * Bottom modal that prompts guest users to login or signup before checkout
 */

import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/Button';
import { theme } from '@/theme';

interface CheckoutAuthModalProps {
    visible: boolean;
    onClose: () => void;
}

export const CheckoutAuthModal: React.FC<CheckoutAuthModalProps> = ({ visible, onClose }) => {
    const router = useRouter();
    const { t } = useTranslation();

    const handleLogin = () => {
        onClose();
        router.push('/login');
    };

    const handleSignup = () => {
        onClose();
        router.push('/signup');
    };

    const handleGuestCheckout = () => {
        onClose();
        // TODO: Implement guest checkout flow
        // For now, just close the modal
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableOpacity 
                style={styles.overlay} 
                activeOpacity={1} 
                onPress={onClose}
            >
                <TouchableOpacity 
                    activeOpacity={1} 
                    style={styles.modalContainer}
                    onPress={(e) => e.stopPropagation()}
                >
                    {/* Close Button */}
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
                    </TouchableOpacity>

                    {/* Icon */}
                    <View style={styles.iconContainer}>
                        <Ionicons 
                            name="lock-closed-outline" 
                            size={60} 
                            color={theme.colors.primary[500]} 
                        />
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>{t('cart.loginToContinue')}</Text>
                    
                    {/* Description */}
                    <Text style={styles.description}>
                        {t('cart.loginPrompt')}
                    </Text>

                    {/* Buttons */}
                    <View style={styles.buttonsContainer}>
                        <Button
                            title={t('auth.login')}
                            onPress={handleLogin}
                            style={styles.button}
                        />
                        
                        <Button
                            title={t('auth.signup')}
                            onPress={handleSignup}
                            variant="outline"
                            style={styles.button}
                        />

                        {/* Optional: Guest Checkout */}
                        {/* <TouchableOpacity 
                            style={styles.guestButton}
                            onPress={handleGuestCheckout}
                        >
                            <Text style={styles.guestButtonText}>
                                Continue as Guest
                            </Text>
                        </TouchableOpacity> */}
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: theme.colors.white,
        borderTopLeftRadius: theme.borderRadius.xl,
        borderTopRightRadius: theme.borderRadius.xl,
        padding: theme.spacing.xl,
        paddingBottom: Platform.OS === 'ios' ? theme.spacing.xxl : theme.spacing.xl,
        ...theme.shadows.lg,
    },
    closeButton: {
        position: 'absolute',
        top: theme.spacing.md,
        right: theme.spacing.md,
        zIndex: 1,
        padding: theme.spacing.xs,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
        marginTop: theme.spacing.md,
    },
    title: {
        fontSize: theme.typography.fontSize.xxl,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        textAlign: 'center',
        marginBottom: theme.spacing.sm,
    },
    description: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        marginBottom: theme.spacing.xl,
        lineHeight: 22,
    },
    buttonsContainer: {
        gap: theme.spacing.md,
    },
    button: {
        width: '100%',
    },
    guestButton: {
        paddingVertical: theme.spacing.md,
        alignItems: 'center',
    },
    guestButtonText: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.primary[500],
        fontWeight: theme.typography.fontWeight.semiBold,
    },
});

