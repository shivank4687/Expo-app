import { stripeConnectApi } from '@/services/api/stripeconnect.api';
import { supplierPaymentAccountApi } from '@/services/api/supplierPaymentAccount.api';
import { useToast } from '@/shared/components/Toast';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { WebView } from 'react-native-webview';

interface StripeConnectCardProps {
    expanded: boolean;
    onToggle: () => void;
    onStatusChange?: (completed: boolean) => void;
    onReady?: () => void;
}

interface StripeDetails {
    stripe_user_id: string;
    stripe_account_id: string;
    created_at: string;
    connected_at: string | null;
    charges_enabled: boolean;
    payouts_enabled: boolean;
    details_submitted: boolean;
    is_fully_connected: boolean;
}

const benefitHighlights = [
    'Receive payments directly in your Stripe account',
    'Fast, secure payment processing',
    'Automatic payout scheduling',
    'Detailed transaction reporting',
];

const formatDate = (value?: string | null) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
    });
};

export default function StripeConnectCard({ expanded, onToggle, onStatusChange, onReady }: StripeConnectCardProps) {
    const [loading, setLoading] = useState(true);
    const [connected, setConnected] = useState(false);
    const [stripeDetails, setStripeDetails] = useState<StripeDetails | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [authUrl, setAuthUrl] = useState<string | null>(null);
    const [paypalEmail, setPaypalEmail] = useState('');
    const [paypalLoading, setPaypalLoading] = useState(true);
    const [paypalSaving, setPaypalSaving] = useState(false);
    const [hasSignaledReady, setHasSignaledReady] = useState(false);
    const { showToast } = useToast();
    useEffect(() => {
        const stripeConnected = Boolean(stripeDetails?.is_fully_connected);
        const payPalConfigured = Boolean(paypalEmail.trim());
        const completed = stripeConnected && payPalConfigured;

        onStatusChange?.(completed);
    }, [stripeDetails, paypalEmail]);
    const hasLoadedStripeData = useRef(false);

    useEffect(() => {
        if (!hasLoadedStripeData.current) {
            hasLoadedStripeData.current = true;
            fetchDetails();
            fetchPayPalEmail();
        }
    }, []);

    const prevModalState = useRef(modalVisible);
    useEffect(() => {
        if (prevModalState.current && !modalVisible) {
            fetchDetails();
            fetchPayPalEmail();
        }
        prevModalState.current = modalVisible;
    }, [modalVisible]);

    useEffect(() => {
        if (
            !hasSignaledReady &&
            hasLoadedStripeData.current &&
            !loading &&
            !paypalLoading
        ) {
            setHasSignaledReady(true);
            onReady?.();
        }
    }, [hasSignaledReady, loading, paypalLoading, onReady]);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const response = await stripeConnectApi.getDetails();
            if (response.success) {
                setConnected(response.connected);
                setStripeDetails(response.details || null);
            }
        } catch (error) {
            console.error('Failed to fetch Stripe details:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPayPalEmail = async () => {
        setPaypalLoading(true);

        try {
            const response = await supplierPaymentAccountApi.getPayPal();
            if (response.success) {
                setPaypalEmail(response.data?.paypal_email ?? '');
            }
        } catch (error) {
            console.error('Failed to fetch PayPal details:', error);
            showToast({
                message: 'Unable to load saved PayPal details. Please try again.',
                type: 'error',
            });
        } finally {
            setPaypalLoading(false);
        }
    };

    const isValidPayPalEmail = (value: string) => {
        const trimmed = value.trim();
        if (trimmed === '') return false;
        // Basic RFC 5322 email validation (simplified)
        const emailPattern =
            /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return emailPattern.test(trimmed);
    };

    const handleSavePayPal = async () => {
        const email = paypalEmail.trim();
        if (!isValidPayPalEmail(email)) {
            showToast({
                message: 'Please enter a valid PayPal email address.',
                type: 'error',
            });
            return;
        }

        setPaypalSaving(true);

        try {
            const response = await supplierPaymentAccountApi.savePayPal(email);
            if (response.success) {
                showToast({
                    message: response.message || 'PayPal details saved successfully.',
                    type: 'success',
                });
                setPaypalEmail(email);
            } else {
                showToast({
                    message: response.message || 'Unable to save PayPal details.',
                    type: 'error',
                });
            }
        } catch (error: any) {
            console.error('Failed to save PayPal details:', error);
            showToast({
                message: error.message || 'Unable to save PayPal details.',
                type: 'error',
            });
        } finally {
            setPaypalSaving(false);
        }
    };

    const handleConnect = async () => {
        setLoading(true);
        try {
            const response = await stripeConnectApi.getConnectUrl();
            if (response.success && response.url) {
                setAuthUrl(response.url);
                setModalVisible(true);
            }
        } catch (error) {
            console.error('Failed to get connect URL:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnect = async () => {
        setLoading(true);
        try {
            await stripeConnectApi.disconnect();
            setConnected(false);
            setStripeDetails(null);
        } catch (error) {
            console.error('Failed to disconnect:', error);
        } finally {
            setLoading(false);
        }
    };

    const onWebViewNavigationStateChange = (newNavState: any) => {
        const { url } = newNavState;
        if (!url) return;

        // Check for success redirect (adjust based on your actual success URL)
        if (url.includes('/supplier/settings/stripe') && !url.includes('mobile-auth') && !url.includes('connect')) {
            setModalVisible(false);
            fetchDetails(); // Refresh details on success
        }
    };

    const accountId = stripeDetails?.stripe_account_id || stripeDetails?.stripe_user_id;
    const connectedOn = formatDate(stripeDetails?.connected_at ?? stripeDetails?.created_at);
    const isFullyConnected = stripeDetails?.is_fully_connected ?? false;
    const statusItems = [
        { label: 'Charges', enabled: stripeDetails?.charges_enabled },
        { label: 'Payouts', enabled: stripeDetails?.payouts_enabled },
        { label: 'Documents', enabled: stripeDetails?.details_submitted },
    ];

    return (
        <View style={styles.card}>
            <TouchableOpacity
                style={styles.header}
                onPress={onToggle}
                activeOpacity={0.7}
            >
                <View style={styles.iconBg}>
                    <Ionicons name="card-outline" size={16} color="#FFFFFF" />
                </View>

                <View style={styles.textContainer}>
                    <Text style={styles.title}>Payments</Text>
                    <Text style={styles.description}>Where to receive payouts (Stripe & PayPal)</Text>
                </View>

                <View style={styles.headerActions}>
                    {connected ? (
                        <View style={[styles.connectedBadge, !isFullyConnected && styles.partialBadge]}>
                            <Text style={[styles.badgeText, !isFullyConnected && styles.partialBadgeText]}>
                                {isFullyConnected ? 'Connected' : 'Action Required'}
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.toBeCompletedBadge}>
                            <Text style={styles.toBeCompletedText}>To be completed</Text>
                        </View>
                    )}

                    <View style={styles.chevronContainer}>
                        <Ionicons
                            name={expanded ? 'chevron-up' : 'chevron-down'}
                            size={16}
                            color="#0A292D"
                        />
                    </View>
                </View>
            </TouchableOpacity>

            {expanded && (
                <View style={styles.content}>
                    <View style={styles.sectionCard}>
                        {loading ? (
                            <View style={styles.loadingWrapper}>
                                <ActivityIndicator size="small" color="#00615E" />
                            </View>
                        ) : connected ? (
                            <View style={styles.connectedContainer}>
                                <View style={styles.accountSummary}>
                                    <Text style={styles.connectedLabel}>Connected Account ID</Text>
                                    <Text style={styles.accountIdText}>{accountId ?? '—'}</Text>
                                    {/* {stripeDetails?.stripe_user_id && (
                                        <Text style={styles.userIdText}>Stripe User: {stripeDetails.stripe_user_id}</Text>
                                    )} */}
                                    <Text style={styles.connectedOnText}>Connected on {connectedOn}</Text>
                                </View>

                                <View style={styles.statusGrid}>
                                    {statusItems.map((item, index) => (
                                        <View
                                            style={[
                                                styles.statusCard,
                                                item.enabled
                                                    ? styles.statusCardEnabled
                                                    : styles.statusCardDisabled,
                                                index !== statusItems.length - 1 && styles.statusCardSpacing,
                                            ]}
                                            key={item.label}
                                        >
                                            <Text style={styles.statusLabel}>{item.label}</Text>
                                            <Text
                                                style={[
                                                    styles.statusValue,
                                                    item.enabled
                                                        ? styles.statusValueEnabled
                                                        : styles.statusValueDisabled,
                                                ]}
                                            >
                                                {item.enabled ? 'Enabled' : 'Incomplete'}
                                            </Text>
                                        </View>
                                    ))}
                                </View>

                                {!isFullyConnected && (
                                    <View style={styles.warningContainer}>
                                        <Text style={styles.warningTitle}>Action required</Text>
                                        <Text style={styles.warningMessage}>
                                            Provide the remaining information in Stripe to start receiving payouts.
                                        </Text>
                                        <TouchableOpacity style={styles.connectButton} onPress={handleConnect}>
                                            <Text style={styles.connectButtonText}>Complete setup</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
                                    <Text style={styles.disconnectButtonText}>Disconnect</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.connectContainer}>
                                <Text style={styles.infoText}>
                                    Connect your Stripe account to receive automatic payouts.
                                </Text>
                                <View style={styles.benefitsContainer}>
                                    {benefitHighlights.map((benefit) => (
                                        <View style={styles.benefitRow} key={benefit}>
                                            <Ionicons name="checkmark-circle" size={16} color="#00615E" />
                                            <Text style={styles.benefitText}>{benefit}</Text>
                                        </View>
                                    ))}
                                </View>
                                <TouchableOpacity style={styles.connectButton} onPress={handleConnect}>
                                    <Text style={styles.connectButtonText}>Connect with Stripe</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>PayPal payouts</Text>
                        <Text style={styles.sectionSubtitle}>
                            {paypalLoading
                                ? 'Loading saved PayPal details...'
                                : 'Enter the PayPal email where you would like to receive payouts.'}
                        </Text>
                        <TextInput
                            value={paypalEmail}
                            onChangeText={setPaypalEmail}
                            style={styles.paypalInput}
                            placeholder="PayPal email address"
                            placeholderTextColor="#7D8A8C"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            editable={!paypalLoading}
                        />
                        <TouchableOpacity
                            style={[
                                styles.paypalSaveButton,
                                paypalSaving && styles.paypalSaveButtonDisabled,
                            ]}
                            onPress={handleSavePayPal}
                            disabled={paypalSaving}
                        >
                            {paypalSaving ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.paypalSaveButtonText}>Save PayPal details</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <Modal
                visible={modalVisible}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <SafeAreaView style={{ flex: 1 }}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setModalVisible(false)}>
                            <Text style={styles.closeText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                    {authUrl && (
                        <>
                            {/* Debugging Text */}
                            {/* <Text style={{ fontSize: 10, color: 'gray', padding: 5 }}>Loading: {authUrl}</Text> */}
                            <WebView
                                source={{ uri: authUrl }}
                                onNavigationStateChange={onWebViewNavigationStateChange}
                                startInLoadingState
                                scalesPageToFit
                                javaScriptEnabled
                                domStorageEnabled
                                sharedCookiesEnabled
                                thirdPartyCookiesEnabled
                                mixedContentMode="always"
                                userAgent="Mozilla/5.0 (Linux; Android 10; Android SDK built for x86) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36"
                                renderLoading={() => <ActivityIndicator size="large" color="#00615E" style={{ flex: 1 }} />}
                                onError={(syntheticEvent) => {
                                    const { nativeEvent } = syntheticEvent;
                                    console.warn('WebView error: ', nativeEvent);
                                    // alert(`WebView Error: ${nativeEvent.description} \nURL: ${nativeEvent.url}`);
                                }}
                                onHttpError={(syntheticEvent) => {
                                    const { nativeEvent } = syntheticEvent;
                                    console.warn('WebView HTTP error: ', nativeEvent);
                                    if (nativeEvent.statusCode >= 400) {
                                        alert(`HTTP Error: ${nativeEvent.statusCode} \nURL: ${nativeEvent.url} \n message: ${nativeEvent.description}`);
                                    }
                                }}
                            />
                        </>
                    )}
                </SafeAreaView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 16,
        padding: 8,
        gap: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 0,
        gap: 8,
        width: '100%',
        position: 'relative',
    },
    iconBg: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        width: 32,
        height: 32,
        backgroundColor: '#00615E',
        borderRadius: 8,
    },
    textContainer: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        gap: 4,
    },
    title: {
        width: '100%',
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
    },
    description: {
        width: '100%',
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 14,
        lineHeight: 20,
        color: '#0A292D',
    },
    chevronContainer: {
        width: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        paddingTop: 8,
        gap: 12,
    },
    sectionCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E9E3D3',
        backgroundColor: '#FFFFFF',
        gap: 12,
    },
    sectionTitle: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 16,
        color: '#0A292D',
    },
    sectionSubtitle: {
        fontFamily: 'Inter',
        fontSize: 13,
        color: '#4C5A5F',
    },
    loadingWrapper: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    paypalInput: {
        height: 44,
        borderWidth: 1,
        borderColor: '#E5DBCE',
        borderRadius: 10,
        paddingHorizontal: 12,
        fontFamily: 'Inter',
        fontSize: 14,
        backgroundColor: '#FAF9F6',
        color: '#0A292D',
    },
    paypalSaveButton: {
        marginTop: 6,
        paddingVertical: 12,
        backgroundColor: '#00615E',
        borderRadius: 8,
        alignItems: 'center',
    },
    paypalSaveButtonText: {
        fontFamily: 'Inter',
        fontWeight: '500',
        color: '#FFFFFF',
    },
    paypalSaveButtonDisabled: {
        opacity: 0.7,
    },
    paypalMessage: {
        marginTop: 8,
        fontFamily: 'Inter',
        fontSize: 13,
    },
    paypalSuccessMessage: {
        color: '#1D8531',
    },
    paypalErrorMessage: {
        color: '#BB5625',
    },
    connectedContainer: {
        gap: 12,
    },
    accountSummary: {
        marginBottom: 4,
    },
    connectedLabel: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 14,
        color: '#0A292D',
    },
    accountIdText: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 16,
        color: '#000000',
    },
    userIdText: {
        fontFamily: 'Inter',
        fontSize: 13,
        color: '#4C5A5F',
    },
    connectedOnText: {
        fontFamily: 'Inter',
        fontSize: 13,
        color: '#7D8A8C',
    },
    connectedText: {
        fontFamily: 'Inter',
        fontSize: 14,
        color: '#0A292D',
    },
    statusGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statusCard: {
        flex: 1,
        minWidth: 96,
        minHeight: 72,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    statusCardEnabled: {
        backgroundColor: '#E6F8F2',
        borderColor: '#B5E4D5',
    },
    statusCardDisabled: {
        backgroundColor: '#FDEDED',
        borderColor: '#F5C2BE',
    },
    statusLabel: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 12,
        color: '#0A292D',
        marginBottom: 4,
        flexWrap: 'wrap',
    },
    statusValue: {
        fontFamily: 'Inter',
        fontSize: 12,
        marginTop: 6,
    },
    statusValueEnabled: {
        color: '#1D8531',
    },
    statusValueDisabled: {
        color: '#BB5625',
    },
    statusCardSpacing: {
        marginRight: 8,
    },
    disconnectButton: {
        padding: 10,
        backgroundColor: '#FDEAE9',
        borderRadius: 8,
        alignItems: 'center',
    },
    disconnectButtonText: {
        color: '#BB5625',
        fontFamily: 'Inter',
        fontWeight: '500',
    },
    warningContainer: {
        padding: 12,
        backgroundColor: '#FFF6F0',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F4C3B7',
    },
    warningTitle: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 14,
        color: '#BB5625',
    },
    warningMessage: {
        fontFamily: 'Inter',
        fontSize: 13,
        color: '#4C5A5F',
    },
    connectContainer: {
        gap: 12,
    },
    benefitsContainer: {
        marginTop: 8,
    },
    benefitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    benefitText: {
        fontFamily: 'Inter',
        fontSize: 13,
        color: '#0A292D',
        flex: 1,
        marginLeft: 6,
    },
    infoText: {
        fontFamily: 'Inter',
        fontSize: 14,
        color: '#7D8A8C',
    },
    connectButton: {
        padding: 12,
        backgroundColor: '#00615E',
        borderRadius: 8,
        alignItems: 'center',
    },
    connectButtonText: {
        color: '#FFFFFF',
        fontFamily: 'Inter',
        fontWeight: '500',
    },
    modalHeader: {
        padding: 16,
        backgroundColor: '#f5f5f5',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        alignItems: 'flex-end',
    },
    closeText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    toBeCompletedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
        gap: 10,
        backgroundColor: '#FCF7EA',
        borderWidth: 1,
        borderColor: '#DDAA39',
        borderRadius: 80,
    },
    toBeCompletedText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 12,
        lineHeight: 14,
        color: '#000000',
    },
    connectedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
        gap: 4,
        backgroundColor: '#00615E',
        borderRadius: 80,
        minWidth: 10,
        height: 22,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginLeft: 'auto',
    },
    partialBadge: {
        backgroundColor: '#FFD9B2',
    },
    badgeText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 12,
        lineHeight: 14,
        color: '#FFFFFF',
    },
    partialBadgeText: {
        color: '#BB5625',
    },
});
