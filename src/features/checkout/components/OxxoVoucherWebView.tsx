/**
 * OxxoVoucherWebView Component
 * Displays OXXO payment voucher in a WebView modal
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { theme } from '@/theme';

interface OxxoVoucherWebViewProps {
    visible: boolean;
    voucherUrl: string;
    onClose: () => void;
}

export const OxxoVoucherWebView: React.FC<OxxoVoucherWebViewProps> = ({
    visible,
    voucherUrl,
    onClose,
}) => {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(true);

    if (!visible) {
        return null;
    }

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>
                        {t('checkout.oxxo.voucherTitle', 'OXXO Payment Voucher')}
                    </Text>
                    <TouchableOpacity
                        onPress={onClose}
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

                {/* WebView */}
                <WebView
                    source={{ uri: voucherUrl }}
                    style={styles.webView}
                    onLoadStart={() => setIsLoading(true)}
                    onLoadEnd={() => setIsLoading(false)}
                    onError={(syntheticEvent) => {
                        const { nativeEvent } = syntheticEvent;
                        console.error('[OxxoVoucherWebView] WebView error:', nativeEvent);
                        setIsLoading(false);
                    }}
                    startInLoadingState={true}
                    renderLoading={() => (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={theme.colors.primary[500]} />
                            <Text style={styles.loadingText}>
                                {t('checkout.loadingVoucher', 'Loading voucher...')}
                            </Text>
                        </View>
                    )}
                />

                {/* Loading Indicator */}
                {isLoading && (
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
});

