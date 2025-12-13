/**
 * PayPalSmartButtonWebView Component
 * Handles PayPal Smart Button payment flow in a WebView
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
import { paypalApi } from '@/services/api/paypal.api';
import { useToast } from '@/shared/components/Toast';

interface PaypalSmartButtonWebViewProps {
    visible: boolean;
    approvalUrl: string;
    paypalOrderId: string;
    onSuccess: (orderId: number) => void;
    onCancel: () => void;
    onError: (error: string) => void;
}

export const PaypalSmartButtonWebView: React.FC<PaypalSmartButtonWebViewProps> = ({
    visible,
    approvalUrl,
    paypalOrderId,
    onSuccess,
    onCancel,
    onError,
}) => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const webViewRef = useRef<WebView>(null);
    const processedOrderId = useRef<string | null>(null); // Track processed order IDs

    // Patterns to detect success/cancel URLs
    // PayPal redirects to return_url after approval (which we set in application_context)
    // The return_url will be our API endpoint: /api/v1/customer/paypal/smart-button/success
    // We MUST wait for PayPal to redirect to our success endpoint with a token parameter
    // This ensures the user has actually approved the payment
    const SUCCESS_URL_PATTERN = /\/api\/v1\/customer\/paypal\/smart-button\/success|paypal\/smart-button\/success/i;
    const CANCEL_URL_PATTERN = /\/api\/v1\/customer\/paypal\/smart-button\/cancel|paypal\/smart-button\/cancel/i;
    const TOKEN_PATTERN = /[?&]token=([^&#]+)/;
    const PAYER_ID_PATTERN = /[?&]PayerID=([^&#]+)/;

    const processPaypalApproval = async (url: string) => {
        // Extract token or PayerID from URL (PayPal returns these after approval)
        const tokenMatch = url.match(TOKEN_PATTERN);
        const payerIdMatch = url.match(PAYER_ID_PATTERN);
        const token = tokenMatch ? decodeURIComponent(tokenMatch[1]) : null;
        const payerId = payerIdMatch ? decodeURIComponent(payerIdMatch[1]) : null;

        // CRITICAL: Only process if PayPal has redirected to our success endpoint
        // AND we have a token or PayerID parameter (indicating approval)
        // This ensures the user has actually completed the approval process
        const isOurSuccessEndpoint = SUCCESS_URL_PATTERN.test(url);
        const hasApprovalToken = !!(token || payerId);
        
        // Only proceed if we're on our success endpoint AND have approval token
        if (!isOurSuccessEndpoint || !hasApprovalToken) {
            return false; // Not ready to process yet
        }
        
        // Prevent processing the same order ID multiple times
        if (processedOrderId.current === paypalOrderId) {
            console.log('[PaypalSmartButtonWebView] Order already processed, skipping:', paypalOrderId);
            return true; // Already processed
        }
        
        console.log('[PaypalSmartButtonWebView] Success URL detected with approval token:', { token, payerId, url });
        processedOrderId.current = paypalOrderId;
        setIsProcessing(true);
        
        try {
            // Wait a brief moment to ensure PayPal has fully processed the approval
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Call capture order API endpoint
            console.log('[PaypalSmartButtonWebView] Calling capture order API with order_id:', paypalOrderId);
            const response = await paypalApi.captureOrder(paypalOrderId);
            
            console.log('[PaypalSmartButtonWebView] Capture order API response:', JSON.stringify(response, null, 2));
            console.log('[PaypalSmartButtonWebView] Response validation:', {
                hasSuccess: 'success' in response,
                success: response.success,
                hasData: 'data' in response,
                hasOrder: !!(response.data?.order),
                orderId: response.data?.order?.id,
                message: response.message
            });

            // Check if response indicates success and has order data
            const orderId = response.data?.order?.id || response.order?.id || response.data?.id;
            const isSuccess = response.success === true || response.success === 'true' || (orderId && response.success !== false);
            
            if (isSuccess && orderId) {
                console.log('[PaypalSmartButtonWebView] Payment successful, order ID:', orderId);
                showToast({
                    message: response.message || t('checkout.paymentSuccess', 'Payment successful!'),
                    type: 'success',
                });
                onSuccess(orderId);
            } else {
                // Log detailed error information
                console.error('[PaypalSmartButtonWebView] Payment processing failed - Response structure:', {
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
            console.error('[PaypalSmartButtonWebView] Error processing approval:', error);
            console.error('[PaypalSmartButtonWebView] Error details:', {
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
        
        return true; // Processed (success or error)
    };

    const handleNavigationStateChange = async (navState: WebViewNavigation) => {
        const { url } = navState;
        
        console.log('[PaypalSmartButtonWebView] Navigation state changed:', url);

        // Check for cancel URL - must be our specific cancel endpoint
        if (CANCEL_URL_PATTERN.test(url)) {
            console.log('[PaypalSmartButtonWebView] Cancel URL detected:', url);
            showToast({
                message: t('checkout.paymentCancelled', 'Payment was cancelled'),
                type: 'info',
            });
            onCancel();
            return;
        }
        
        // Try to process PayPal approval
        try {
            await processPaypalApproval(url);
        } catch (error: any) {
            console.error('[PaypalSmartButtonWebView] Error processing approval:', error);
            console.error('[PaypalSmartButtonWebView] Error details:', {
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
        }
        
        // Log other URL changes for debugging (but don't process them)
        if (url.includes('paypal.com') && !SUCCESS_URL_PATTERN.test(url)) {
            console.log('[PaypalSmartButtonWebView] PayPal page navigation (not processing yet):', url);
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
                        {t('checkout.paypal.title', 'Complete PayPal Payment')}
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
                    source={{ uri: approvalUrl }}
                    style={styles.webView}
                    onNavigationStateChange={handleNavigationStateChange}
                    onShouldStartLoadWithRequest={(request) => {
                        const { url } = request;
                        
                        // Intercept navigation to our success endpoint - we'll handle it via API
                        if (SUCCESS_URL_PATTERN.test(url) && (url.includes('token=') || url.includes('PayerID='))) {
                            console.log('[PaypalSmartButtonWebView] Intercepting success URL navigation:', url);
                            // Process the approval asynchronously
                            processPaypalApproval(url).catch((error: any) => {
                                console.error('[PaypalSmartButtonWebView] Error in intercepted approval:', error);
                                const errorMessage = error.response?.data?.message || error.message || t('checkout.paymentError', 'Payment processing failed');
                                showToast({
                                    message: errorMessage,
                                    type: 'error',
                                });
                                onError(errorMessage);
                            });
                            return false; // Prevent WebView from loading this URL
                        }
                        
                        // Allow all other navigation
                        return true;
                    }}
                    onLoadStart={() => setIsLoading(true)}
                    onLoadEnd={() => setIsLoading(false)}
                    onError={(syntheticEvent) => {
                        const { nativeEvent } = syntheticEvent;
                        console.error('[PaypalSmartButtonWebView] WebView error:', nativeEvent);
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

