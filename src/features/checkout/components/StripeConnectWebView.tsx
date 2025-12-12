/**
 * StripeConnectWebView Component
 * Handles Stripe Checkout payment flow in a WebView
 */

import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { theme } from '@/theme';
import { stripeConnectApi } from '@/services/api/stripeconnect.api';
import { useToast } from '@/shared/components/Toast';

interface StripeConnectWebViewProps {
    visible: boolean;
    checkoutUrl: string;
    onSuccess: (orderId: number) => void;
    onCancel: () => void;
    onError: (error: string) => void;
}

export const StripeConnectWebView: React.FC<StripeConnectWebViewProps> = ({
    visible,
    checkoutUrl,
    onSuccess,
    onCancel,
    onError,
}) => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const webViewRef = useRef<WebView>(null);
    const processedSessionId = useRef<string | null>(null); // Track processed session IDs

    // Patterns to detect success/cancel URLs
    // Stripe redirects to: /stripe/success?session_id=cs_xxx (from route: stripeconnect.success)
    const SUCCESS_URL_PATTERN = /\/stripe\/success|stripeconnect.*success|stripe.*success/i;
    const CANCEL_URL_PATTERN = /stripeconnect.*cancel|stripe.*cancel/i;
    const SESSION_ID_PATTERN = /[?&]session_id=([^&#]+)/;

    const handleNavigationStateChange = async (navState: WebViewNavigation) => {
        const { url } = navState;
        
        console.log('[StripeConnectWebView] Navigation state changed:', url);

        // Extract session_id from URL first (it might be in success URL)
        const sessionIdMatch = url.match(SESSION_ID_PATTERN);
        const sessionId = sessionIdMatch ? decodeURIComponent(sessionIdMatch[1]) : null;

        // Check for success URL - look for session_id parameter or success in URL
        if (SUCCESS_URL_PATTERN.test(url) && sessionId) {
            // Prevent processing the same session ID multiple times
            if (processedSessionId.current === sessionId) {
                console.log('[StripeConnectWebView] Session already processed, skipping:', sessionId);
                return;
            }
            
            console.log('[StripeConnectWebView] Success URL detected with session_id:', sessionId);
            processedSessionId.current = sessionId;
            setIsProcessing(true);
            
            try {
                // Call success API endpoint
                console.log('[StripeConnectWebView] Calling success API with session_id:', sessionId);
                const response = await stripeConnectApi.processSuccess(sessionId);
                
                console.log('[StripeConnectWebView] Success API response:', JSON.stringify(response, null, 2));
                console.log('[StripeConnectWebView] Response validation:', {
                    hasSuccess: 'success' in response,
                    success: response.success,
                    hasData: 'data' in response,
                    hasOrder: !!(response.data?.order),
                    orderId: response.data?.order?.id,
                    message: response.message
                });

                // Check if response indicates success and has order data
                // Handle different response structures
                const orderId = response.data?.order?.id || response.order?.id || response.data?.id;
                const isSuccess = response.success === true || response.success === 'true' || (orderId && response.success !== false);
                
                if (isSuccess && orderId) {
                    console.log('[StripeConnectWebView] Payment successful, order ID:', orderId);
                    showToast({
                        message: response.message || t('checkout.paymentSuccess', 'Payment successful!'),
                        type: 'success',
                    });
                    onSuccess(orderId);
                } else {
                    // Log detailed error information
                    console.error('[StripeConnectWebView] Payment processing failed - Response structure:', {
                        fullResponse: response,
                        success: response.success,
                        successType: typeof response.success,
                        hasData: !!response.data,
                        hasOrder: !!response.data?.order,
                        orderId: response.data?.order?.id,
                        directOrderId: response.order?.id,
                        dataId: response.data?.id,
                        message: response.message,
                        allKeys: Object.keys(response || {})
                    });
                    const errorMsg = response.message || 'Payment processing failed - Invalid response structure';
                    throw new Error(errorMsg);
                }
            } catch (error: any) {
                console.error('[StripeConnectWebView] Error processing success:', error);
                console.error('[StripeConnectWebView] Error details:', {
                    message: error.message,
                    response: error.response?.data,
                    status: error.response?.status,
                    stack: error.stack
                });
                const errorMessage = error.response?.data?.message || error.message || t('checkout.paymentError', 'Payment processing failed');
                showToast({
                    message: errorMessage,
                    type: 'error',
                });
                onError(errorMessage);
            } finally {
                setIsProcessing(false);
            }
            return;
        }

        // Check for cancel URL
        if (CANCEL_URL_PATTERN.test(url)) {
            showToast({
                message: t('checkout.paymentCancelled', 'Payment was cancelled'),
                type: 'info',
            });
            onCancel();
            return;
        }
    };

    const handleClose = () => {
        if (isProcessing) {
            Alert.alert(
                t('checkout.paymentInProgress', 'Payment in Progress'),
                t('checkout.paymentInProgressMessage', 'Payment is being processed. Please wait...'),
                [{ text: t('common.ok', 'OK') }]
            );
            return;
        }

        Alert.alert(
            t('checkout.cancelPayment', 'Cancel Payment'),
            t('checkout.cancelPaymentConfirm', 'Are you sure you want to cancel the payment?'),
            [
                {
                    text: t('common.no', 'No'),
                    style: 'cancel',
                },
                {
                    text: t('common.yes', 'Yes'),
                    style: 'destructive',
                    onPress: onCancel,
                },
            ]
        );
    };

    if (!visible) {
        return null;
    }

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>
                        {t('checkout.stripeConnect.title', 'Complete Payment')}
                    </Text>
                    <TouchableOpacity
                        onPress={handleClose}
                        disabled={isProcessing}
                        style={styles.closeButton}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name="close"
                            size={24}
                            color={theme.colors.text.primary}
                        />
                    </TouchableOpacity>
                </View>

                {/* Processing Overlay */}
                {isProcessing && (
                    <View style={styles.processingOverlay}>
                        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
                        <Text style={styles.processingText}>
                            {t('checkout.processingPayment', 'Processing payment...')}
                        </Text>
                    </View>
                )}

                {/* WebView */}
                <WebView
                    ref={webViewRef}
                    source={{ uri: checkoutUrl }}
                    style={styles.webView}
                    onNavigationStateChange={handleNavigationStateChange}
                    onLoadStart={() => setIsLoading(true)}
                    onLoadEnd={() => setIsLoading(false)}
                    onError={(syntheticEvent) => {
                        const { nativeEvent } = syntheticEvent;
                        console.error('[StripeConnectWebView] WebView error:', nativeEvent);
                        onError(nativeEvent.description || t('checkout.webViewError', 'Failed to load payment page'));
                    }}
                    startInLoadingState={true}
                    renderLoading={() => (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={theme.colors.primary[500]} />
                            <Text style={styles.loadingText}>
                                {t('checkout.loadingPayment', 'Loading payment page...')}
                            </Text>
                        </View>
                    )}
                />

                {/* Loading Indicator */}
                {isLoading && !isProcessing && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color={theme.colors.primary[500]} />
                    </View>
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        paddingTop: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200],
        backgroundColor: theme.colors.white,
    },
    headerTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
    },
    closeButton: {
        padding: theme.spacing.xs,
    },
    webView: {
        flex: 1,
        backgroundColor: theme.colors.white,
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.white,
    },
    loadingText: {
        marginTop: theme.spacing.md,
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },
    processingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        zIndex: 1000,
    },
    processingText: {
        marginTop: theme.spacing.md,
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.primary,
        fontWeight: theme.typography.fontWeight.medium,
    },
});
