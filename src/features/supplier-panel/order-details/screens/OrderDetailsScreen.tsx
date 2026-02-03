import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../styles/colors';
import { TrackingInfoCard, OrderChatView } from '../components';

type TabType = 'details' | 'messages' | 'tracking';

interface Tab {
    id: TabType;
    label: string;
}

export default function OrderDetailsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [activeTab, setActiveTab] = useState<TabType>('details');

    // Get order ID from route params
    const orderId = params.orderId ? parseInt(params.orderId as string) : 0;

    const tabs: Tab[] = [
        { id: 'details', label: 'Details' },
        { id: 'messages', label: 'Messages' },
        { id: 'tracking', label: 'Tracking' },
    ];

    const handleTrackingSubmit = (trackingNumber: string, photoUri: string) => {
        console.log('Tracking Number:', trackingNumber);
        console.log('Photo URI:', photoUri);
        // TODO: Implement API call to submit tracking information
    };

    const renderTabContent = () => {
        if (activeTab === 'tracking') {
            return <TrackingInfoCard onSubmit={handleTrackingSubmit} />;
        }

        if (activeTab === 'messages') {
            return <OrderChatView supplierOrderId={orderId} />;
        }

        return (
            <View style={styles.comingSoonContainer}>
                <Ionicons name="time-outline" size={64} color="#9CA3AF" />
                <Text style={styles.comingSoonTitle}>Coming Soon</Text>
                <Text style={styles.comingSoonText}>
                    {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} content is under development
                </Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* Fixed Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={16} color="#000000" />
                    </TouchableOpacity>

                    <View style={styles.titleContainer}>
                        <Text style={styles.headerTitle}>Orders</Text>
                    </View>
                </View>
            </View>

            {/* Content */}
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Tabs */}
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

                {/* Tab Content */}
                {renderTabContent()}
            </ScrollView>
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
    tabsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 4,
        height: 42,
        backgroundColor: COLORS.white,
        borderRadius: 8,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 10,
        height: 34,
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
        lineHeight: 14,
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
