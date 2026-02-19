import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { stripeConnectApi } from '@/services/api/stripeconnect.api';

interface StripeConnectCardProps {
    expanded: boolean;
    onToggle: () => void;
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

export default function StripeConnectCard({ expanded, onToggle }: StripeConnectCardProps) {
    const [loading, setLoading] = useState(false);
    const [connected, setConnected] = useState(false);
    const [stripeDetails, setStripeDetails] = useState<StripeDetails | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [authUrl, setAuthUrl] = useState<string | null>(null);

    useEffect(() => {
        if (expanded) {
            fetchDetails();
        }
    }, [expanded]);

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
        { label: 'Details Submitted', enabled: stripeDetails?.details_submitted },
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
                    <Text style={styles.description}>Where to receive your money (Stripe)</Text>
                </View>

                <View style={styles.chevronContainer}>
                    <Ionicons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color="#0A292D"
                    />
                </View>

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
            </TouchableOpacity>

            {expanded && (
                <View style={styles.content}>
                    {loading ? (
                        <ActivityIndicator size="small" color="#00615E" />
                    ) : connected ? (
                        <View style={styles.connectedContainer}>
                            <View style={styles.accountSummary}>
                                <Text style={styles.connectedLabel}>Connected Account ID</Text>
                                <Text style={styles.accountIdText}>{accountId ?? '—'}</Text>
                                {stripeDetails?.stripe_user_id && (
                                    <Text style={styles.userIdText}>Stripe User: {stripeDetails.stripe_user_id}</Text>
                                )}
                                <Text style={styles.connectedOnText}>Connected on {connectedOn}</Text>
                            </View>

                            <View style={styles.statusGrid}>
                                {statusItems.map((item) => (
                                    <View style={styles.statusCard} key={item.label}>
                                        <Ionicons
                                            name={item.enabled ? 'checkmark-circle' : 'close-circle'}
                                            size={18}
                                            color={item.enabled ? '#1D8531' : '#BB5625'}
                                        />
                                        <View style={styles.statusTextGroup}>
                                            <Text style={styles.statusLabel}>{item.label}</Text>
                                            <Text style={styles.statusValue}>
                                                {item.enabled ? 'Enabled' : 'Incomplete'}
                                            </Text>
                                        </View>
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
        marginLeft: 'auto',
    },
    content: {
        paddingTop: 8,
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
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    statusCard: {
        width: '48%',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        marginBottom: 8,
    },
    statusTextGroup: {
        marginLeft: 8,
    },
    statusLabel: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 12,
        color: '#0A292D',
    },
    statusValue: {
        fontFamily: 'Inter',
        fontSize: 12,
        color: '#7D8A8C',
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
        position: 'absolute',
        minWidth: 110,
        height: 22,
        right: 110,
        top: -3,
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
        position: 'absolute',
        minWidth: 10,
        height: 22,
        right: 150,
        top: -3,
        backgroundColor: '#00615E',
        borderRadius: 80,
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
