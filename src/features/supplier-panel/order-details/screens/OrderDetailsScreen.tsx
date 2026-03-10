import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../styles/colors';
import { TrackingInfoCard, OrderChatView, OrderDetailsTab } from '../components';
import { getOrderDetails, OrderDetails } from '../../orders/api/orders.api';
import { createShipment, createSkydropxShipment, updateShipmentStatus } from '../../dashboard/api/shipments.api';
import { useToast } from '@/shared/components/Toast';

type TabType = 'details' | 'messages' | 'tracking';

interface Tab {
    id: TabType;
    label: string;
}

export default function OrderDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<TabType>('details');
    const sourceParam = Array.isArray(params.source) ? params.source[0] : params.source;
    const isFromDashboard = sourceParam === 'dashboard';
    const fromScreen = Array.isArray(params.from) ? params.from[0] : params.from;

    // Get order ID from route params
    const orderId = params.orderId ? parseInt(params.orderId as string) : 0;

    // Drawer keeps this screen mounted; reset tab to default each time screen comes into focus
    // so navigating away and back always starts on the Details tab.
    useFocusEffect(
        useCallback(() => {
            setActiveTab('details');
        }, [])
    );

    const tabs: Tab[] = [
        { id: 'details', label: 'Details' },
        { id: 'messages', label: 'Messages' },
        { id: 'tracking', label: 'Tracking' },
    ];

    const [order, setOrder] = useState<OrderDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmittingTracking, setIsSubmittingTracking] = useState(false);
    const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);

    useEffect(() => {
        if (orderId) {
            fetchOrderDetails();
        }
    }, [orderId]);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            const response = await getOrderDetails(orderId);
            setOrder(response.data);
        } catch (error) {
            console.error('Failed to fetch order details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTrackingSubmit = async (trackingNumber: string, photoUri: string | null) => {
        try {
            setIsSubmittingTracking(true);

            const shipmentData: any = {
                track_number: trackingNumber,
            };

            if (photoUri) {
                shipmentData.tracking_photo = {
                    uri: photoUri,
                    type: 'image/jpeg',
                    name: `tracking_${orderId}.jpg`,
                };
            }

            const response = await createShipment(orderId, shipmentData);

            if (response.success && response.data) {
                // Manually update local state to show the new shipment immediately
                if (order) {
                    const newShipment = {
                        id: response.data.shipment_id,
                        carrier_title: response.data.carrier_title,
                        track_number: response.data.track_number || trackingNumber,
                        tracking_photo_url: response.data.tracking_photo_url || photoUri,
                        total_qty: 1, // Defaulting if not in response
                        created_at: response.data.created_at,
                    };

                    setOrder({
                        ...order,
                        shipments: [...(order.shipments || []), newShipment],
                    });
                }
            } else {
                showToast({ message: response.message || 'Failed to create shipment', type: 'error' });
            }
        } catch (error: any) {
            console.error('Failed to submit tracking:', error);
            showToast({ message: error?.message || 'An error occurred while submitting tracking info', type: 'error' });
        } finally {
            setIsSubmittingTracking(false);
        }
    };

    const handleSkydropxSubmit = async (consignmentNote: string, packageType: string) => {
        try {
            setIsSubmittingTracking(true);

            const payload = {
                consignment_note: consignmentNote,
                package_type: packageType,
            };

            const response = await createSkydropxShipment(orderId, payload);

            if (response.success && response.data) {
                // Manually update local state to show the new shipment immediately
                if (order) {
                    const newShipment = {
                        id: response.data.shipment_id,
                        carrier_title: response.data.carrier_title,
                        track_number: response.data.track_number || '',
                        tracking_photo_url: null,
                        total_qty: 1,
                        created_at: response.data.created_at,
                    };

                    setOrder({
                        ...order,
                        shipments: [...(order.shipments || []), newShipment],
                    });
                }
            } else {
                showToast({ message: response.message || 'Failed to create Skydropx shipment', type: 'error' });
            }
        } catch (error: any) {
            console.error('Failed to submit Skydropx tracking:', error);
            showToast({ message: error?.message || 'An error occurred while creating Skydropx shipment', type: 'error' });
        } finally {
            setIsSubmittingTracking(false);
        }
    };

    const handleStatusUpdate = async (shipmentId: number, newStatus: string) => {
        try {
            setIsSubmittingStatus(true);
            const response = await updateShipmentStatus(shipmentId, newStatus);
            if (response.success) {
                if (order && order.shipments) {
                    const updatedShipments = order.shipments.map(shipment =>
                        shipment.id === shipmentId ? { ...shipment, status: newStatus } : shipment
                    );
                    setOrder({
                        ...order,
                        shipments: updatedShipments,
                    });
                }
                showToast({ message: 'Shipment status updated successfully', type: 'success' });
            } else {
                showToast({ message: response.message || 'Failed to update shipment status', type: 'error' });
            }
        } catch (error: any) {
            console.error('Failed to update status:', error);
            showToast({ message: error?.message || 'An error occurred while updating shipment status', type: 'error' });
        } finally {
            setIsSubmittingStatus(false);
        }
    };

    const renderTabContent = () => {
        if (loading) {
            return (
                <View style={[styles.comingSoonContainer, { backgroundColor: 'transparent' }]}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            );
        }

        if (activeTab === 'tracking') {
            return (
                <TrackingInfoCard
                    shipments={order?.shipments}
                    isSubmitting={isSubmittingTracking}
                    isSubmittingStatus={isSubmittingStatus}
                    isSkydropx={true}
                    onSubmit={handleTrackingSubmit}
                    onSkydropxSubmit={handleSkydropxSubmit}
                    onStatusUpdate={handleStatusUpdate}
                />
            );
        }

        if (activeTab === 'messages') {
            return <OrderChatView supplierOrderId={orderId} />;
        }

        const handleVoucherRegenerated = (newPaymentData: any) => {
            if (order) {
                setOrder({
                    ...order,
                    payment: newPaymentData
                });
            }
        };

        return <OrderDetailsTab order={order ?? undefined} onVoucherRegenerated={handleVoucherRegenerated} />;
    };

    return (
        <View style={styles.container}>
            {/* Fixed Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => {
                            if (fromScreen === 'notifications') {
                                router.push('/(supplier-drawer)/notifications' as any);
                            } else {
                                router.back();
                            }
                        }}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={16} color="#000000" />
                    </TouchableOpacity>

                    <View style={styles.titleContainer}>
                        <Text style={styles.headerTitle}>
                            {fromScreen === 'notifications' ? 'Notifications' : isFromDashboard ? 'Dashboard' : 'Orders'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Tabs - Moved outside ScrollView for sticky behavior and better layout control */}
            <View style={styles.tabsWrapper}>
                <View style={styles.tabsContainer}>
                    {tabs.map((tab) => (
                        <TouchableOpacity
                            key={tab.id}
                            style={[
                                styles.tab,
                                activeTab === tab.id && styles.tabActive,
                            ]}
                            onPress={() => setActiveTab(tab.id)}
                            activeOpacity={0.7}
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    activeTab === tab.id && styles.tabTextActive,
                                ]}
                            >
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Content Area */}
            <View style={styles.contentArea}>
                {activeTab === 'messages' ? (
                    <OrderChatView supplierOrderId={orderId} />
                ) : (
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {renderTabContent()}
                    </ScrollView>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        backgroundColor: COLORS.background,
        paddingTop: 60,
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        height: 32,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        width: 32,
        height: 32,
        backgroundColor: COLORS.white,
        borderRadius: 8,
        justifyContent: 'center',
    },
    titleContainer: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        gap: 4,
        flex: 1,
    },
    headerTitle: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 16,
        color: '#000000',
    },
    content: {
        padding: 16,
        gap: 16,
    },
    tabsWrapper: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: COLORS.background,
    },
    contentArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        padding: 16,
        gap: 16,
    },
    tabsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 4,
        minHeight: 42,
        backgroundColor: COLORS.white,
        borderRadius: 8,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 8,
        minHeight: 34,
        borderRadius: 4,
    },
    tabActive: {
        backgroundColor: '#00615E',
        borderWidth: 1,
        borderColor: '#00615E',
    },
    tabText: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 14,
        lineHeight: 18,
        includeFontPadding: false,
        textAlignVertical: 'center',
        color: '#000000',
    },
    tabTextActive: {
        color: '#FFFFFF',
    },
    comingSoonContainer: {
        alignItems: 'center',
        gap: 16,
        padding: 32,
        backgroundColor: COLORS.white,
        borderRadius: 16,
        marginTop: 16,
    },
    comingSoonTitle: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 24,
        color: '#000000',
        textAlign: 'center',
    },
    comingSoonText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
    },
});
