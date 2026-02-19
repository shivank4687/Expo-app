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
    created_at: string;
}

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



                {connected ? (
                    <View style={styles.connectedBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                        <Text style={styles.badgeText}>Connected</Text>
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
            </TouchableOpacity>

            {expanded && (
                <View style={styles.content}>
                    {loading ? (
                        <ActivityIndicator size="small" color="#00615E" />
                    ) : connected ? (
                        <View style={styles.connectedContainer}>
                            <Text style={styles.connectedText}>
                                Connected Account: {stripeDetails?.stripe_user_id}
                            </Text>
                            <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
                                <Text style={styles.disconnectButtonText}>Disconnect</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.connectContainer}>
                            <Text style={styles.infoText}>
                                Connect your Stripe account to receive automatic payouts.
                            </Text>
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
                            <Text style={{ fontSize: 10, color: 'gray', padding: 5 }}>Loading: {authUrl}</Text>
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
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        gap: 4,
        width: 171,
        height: 34,
    },
    title: {
        width: 171,
        height: 16,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 14,
        lineHeight: 16,
        color: '#0A292D',
    },
    description: {
        width: 171,
        height: 14,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 12,
        lineHeight: 14,
        color: '#7D8A8C',
    },
    chevronContainer: {
        width: 16,
        height: 16,
    },
    content: {
        paddingTop: 8,
    },
    connectedContainer: {
        gap: 12,
    },
    connectedText: {
        fontFamily: 'Inter',
        fontSize: 14,
        color: '#0A292D',
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
    connectContainer: {
        gap: 12,
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
        width: 110,
        height: 22,
        right: 0,
        top: 0,
        backgroundColor: '#F3F0E7',
        borderRadius: 80,
    },
    toBeCompletedText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 12,
        lineHeight: 14,
        color: '#0A292D',
    },
    connectedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
        gap: 4,
        position: 'absolute',
        width: 100,
        height: 22,
        right: 0,
        top: 0,
        backgroundColor: '#00615E',
        borderRadius: 80,
    },
    badgeText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 12,
        lineHeight: 14,
        color: '#FFFFFF',
    },
});
