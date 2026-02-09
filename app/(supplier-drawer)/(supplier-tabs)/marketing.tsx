import { getInvitationActivity, getInvitationStats, InvitationActivity, InvitationStats, logInvitationAction } from '@/features/supplier-panel/invitations/api/invitations.api';
import { supplierTheme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { cacheDirectory, downloadAsync } from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Clipboard, Image, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MarketingScreen() {
    const [stats, setStats] = useState<InvitationStats | null>(null);
    const [activities, setActivities] = useState<InvitationActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const [statsData, activitiesData] = await Promise.all([
                getInvitationStats(),
                getInvitationActivity()
            ]);
            // @ts-ignore - response.data vs response.data.data
            setStats(statsData?.data || statsData);
            // @ts-ignore
            setActivities(activitiesData?.data || activitiesData);
        } catch (error) {
            console.error('Error fetching marketing data:', error);
            Alert.alert('Error', 'Failed to load marketing data. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCopyLink = () => {
        if (!stats?.referral_url) return;
        Clipboard.setString(stats.referral_url);
        Alert.alert('Success', 'Invitation link copied to clipboard!');
    };

    const handleShare = async (channel?: string) => {
        if (!stats?.referral_url) return;

        const message = `I'll share the app with you to buy/sell handicrafts. Here is my invitation: ${stats.referral_url}`;

        try {
            const result = await Share.share({
                message,
                url: stats.referral_url,
                title: 'Invite to B2B Marketplace'
            });

            if (result.action === Share.sharedAction) {
                await logInvitationAction('invitation_sent', channel || 'more');
                fetchData(false);
            }
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    // Helper function to download QR code to cache
    const downloadQRCode = async (url: string): Promise<string | null> => {
        try {
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(url)}`;
            const cacheDir = cacheDirectory;

            if (!cacheDir) {
                console.error('Cache directory not available');
                return null;
            }

            const fileUri = cacheDir + 'qr-code.png';

            const downloadResult = await downloadAsync(qrUrl, fileUri);

            if (downloadResult.status === 200) {
                return downloadResult.uri;
            }
            return null;
        } catch (error) {
            console.error('Error downloading QR code:', error);
            return null;
        }
    };

    // Share QR code as image
    const handleShareQR = async () => {
        if (!stats?.referral_url) return;

        try {
            const qrUri = await downloadQRCode(stats.referral_url);

            if (!qrUri) {
                Alert.alert('Error', 'Failed to generate QR code');
                return;
            }

            const isAvailable = await Sharing.isAvailableAsync();

            if (isAvailable) {
                await Sharing.shareAsync(qrUri, {
                    mimeType: 'image/png',
                    dialogTitle: 'Share QR Code',
                    UTI: 'public.png'
                });

                await logInvitationAction('invitation_sent', 'qr');
                fetchData(false);
            } else {
                Alert.alert('Error', 'Sharing is not available on this device');
            }
        } catch (error) {
            console.error('Error sharing QR code:', error);
            Alert.alert('Error', 'Failed to share QR code');
        }
    };

    // Download QR code to gallery
    const handleDownloadQR = async () => {
        if (!stats?.referral_url) return;

        try {
            const { status } = await MediaLibrary.requestPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert(
                    'Permission Required',
                    'Please grant photo library access to download the QR code'
                );
                return;
            }

            const qrUri = await downloadQRCode(stats.referral_url);

            if (!qrUri) {
                Alert.alert('Error', 'Failed to generate QR code');
                return;
            }

            const asset = await MediaLibrary.createAssetAsync(qrUri);
            await MediaLibrary.createAlbumAsync('Downloads', asset, false);

            Alert.alert('Success', 'QR code saved to your photo library!');
        } catch (error) {
            console.error('Error downloading QR code:', error);
            Alert.alert('Error', 'Failed to download QR code');
        }
    };

    const renderActivityItem = (item: InvitationActivity) => {
        let title = '';
        let desc = '';
        let iconText = '';

        const timeAgo = (date: string) => {
            const now = new Date();
            const past = new Date(date);
            const diffMs = now.getTime() - past.getTime();
            const diffMin = Math.round(diffMs / 60000);
            if (diffMin < 1) return 'Just now';
            if (diffMin < 60) return `${diffMin} min ago`;
            const diffHr = Math.round(diffMin / 60);
            if (diffHr < 24) return `${diffHr} hr ago`;
            return past.toLocaleDateString();
        };

        switch (item.type) {
            case 'invitation_sent':
                title = 'Invitation sent';
                desc = `${item.channel || 'Shared'} · ${timeAgo(item.created_at)}`;
                iconText = '+1';
                break;
            case 'bonus_applied':
                title = 'Bonus applied';
                desc = `${item.data?.bonus_remaining || 0} orders remaining · when the guest completes their first order`;
                iconText = '5%';
                break;
            case 'referral_joined':
                title = 'Referral joined';
                desc = `${item.data?.customer_name || 'A new user'} joined via your link · ${timeAgo(item.created_at)}`;
                iconText = '👤';
                break;
        }

        return (
            <View key={item.id} style={styles.activityItem}>
                <View style={styles.activityIconBg}>
                    <Text style={styles.activityIconText}>{iconText}</Text>
                </View>
                <View style={styles.activityTextContainer}>
                    <Text style={styles.activityItemTitle}>{title}</Text>
                    <Text style={styles.activityItemDesc}>{desc}</Text>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={[styles.safeArea, styles.centered]}>
                <ActivityIndicator size="large" color="#00615E" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
                {/* Frame 24 - Main Container */}
                <View style={styles.mainCard}>
                    {/* Header Section */}
                    <View style={styles.headerRow}>
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.title}>Marketing</Text>
                            {/* Frame 71 - Invitation Program Chip */}
                            <View style={styles.invitationChip}>
                                <Text style={styles.invitationText}>Invitation Program</Text>
                            </View>
                        </View>
                        <Text style={styles.subtitle}>
                            Invite your contacts to install the app. Share your QR or your link in seconds.
                        </Text>
                    </View>

                    {/* Frame 66 - Commission Card */}
                    <View style={styles.commissionCard}>
                        <View style={styles.commissionInner}>
                            <View style={styles.commissionMain}>
                                <Text style={styles.commissionTitle}>Earn 5% commission reduction</Text>
                                <Text style={styles.commissionDesc}>
                                    For each new user you invite and who makes a first action: buy (order as buyer) or sell (order as seller). You get 5% commission reduction on your next 2 orders.
                                </Text>
                            </View>
                            <View style={styles.commissionBadges}>
                                <View style={styles.mxBadge}>
                                    <Text style={styles.mxText}>MX</Text>
                                </View>
                                <View style={styles.ordersBadge}>
                                    <Text style={styles.ordersText}>2 orders</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Frame 127 - Stats Row */}
                    <View style={styles.statsRow}>
                        {/* Frame 72 - Invitations Sent */}
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{stats?.invitations_sent_count || 0}</Text>
                            <Text style={styles.statLabel}>Invitations sent (estimated)</Text>
                        </View>
                        {/* Frame 73 - Active Bonuses */}
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>{stats?.active_bonuses_count || 0}</Text>
                            <Text style={styles.statLabel}>Active Bonuses (2 orders each)</Text>
                        </View>
                    </View>

                    {/* Frame 56 - Overview Section */}
                    <View style={styles.overviewSection}>
                        <Text style={styles.sectionTitle}>Overview</Text>
                        {/* Frame 128 - QR Container */}
                        <View style={styles.qrContainer}>
                            <View style={styles.qrPlaceholder}>
                                {stats?.referral_url ? (
                                    <Image
                                        source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(stats.referral_url)}` }}
                                        style={{ width: 100, height: 100 }}
                                    />
                                ) : (
                                    <Ionicons name="qr-code-outline" size={80} color="#877F6C" />
                                )}
                            </View>
                        </View>

                        {/* Frame 32 - Action Buttons */}
                        <View style={styles.actionButtons}>
                            <TouchableOpacity style={styles.primaryButton} onPress={handleShareQR}>
                                <Ionicons name="share-outline" size={16} color="#F5F5F5" />
                                <Text style={styles.primaryButtonText}>Share QR code</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.secondaryButton} onPress={handleDownloadQR}>
                                <Ionicons name="download-outline" size={16} color="#0A292D" />
                                <Text style={styles.secondaryButtonText}>Download QR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Frame 58 - Invitation Link Section */}
                    <View style={styles.linkSection}>
                        <Text style={styles.sectionTitle}>Your invitation link</Text>
                        <Text style={styles.sectionDesc}>
                            Share this link via WhatsApp, Messages, Mail or networks. It's automatically associated with your account.
                        </Text>
                        <TouchableOpacity style={styles.inputContainer} onPress={handleCopyLink}>
                            <TextInput
                                style={styles.linkInput}
                                value={stats?.referral_url || 'Loading...'}
                                editable={false}
                                pointerEvents="none"
                            />
                            <Ionicons name="copy-outline" size={20} color="#00615E" />
                        </TouchableOpacity>
                    </View>

                    {/* Frame 131 - Quick Share Section */}
                    <View style={styles.quickShareContainer}>
                        {/* Frame 129 - Row 1 */}
                        <View style={styles.shareRow}>
                            <TouchableOpacity style={styles.shareCard} onPress={() => handleShare('whatsapp')}>
                                <View style={styles.shareIconBg}>
                                    <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" />
                                </View>
                                <View style={styles.shareTextContainer}>
                                    <Text style={styles.shareTitle}>WhatsApp</Text>
                                    <Text style={styles.shareDesc}>Quick share</Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.shareCard} onPress={() => handleShare('messages')}>
                                <View style={styles.shareIconBg}>
                                    <Ionicons name="chatbubble-outline" size={16} color="#FFFFFF" />
                                </View>
                                <View style={styles.shareTextContainer}>
                                    <Text style={styles.shareTitle}>Messages</Text>
                                    <Text style={styles.shareDesc}>SMS/iMessage</Text>
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Frame 130 - Row 2 */}
                        <View style={styles.shareRow}>
                            <TouchableOpacity style={styles.shareCard} onPress={() => handleShare('facebook')}>
                                <View style={styles.shareIconBg}>
                                    <Ionicons name="logo-facebook" size={16} color="#FFFFFF" />
                                </View>
                                <View style={styles.shareTextContainer}>
                                    <Text style={styles.shareTitle}>Facebook</Text>
                                    <Text style={styles.shareDesc}>Publish/Send</Text>
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.shareCard} onPress={() => handleShare('more')}>
                                <View style={styles.shareIconBg}>
                                    <Ionicons name="ellipsis-horizontal" size={16} color="#FFFFFF" />
                                </View>
                                <View style={styles.shareTextContainer}>
                                    <Text style={styles.shareTitle}>More</Text>
                                    <Text style={styles.shareDesc}>Other apps</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Suggested Text Section */}
                    <Text style={styles.suggestedText}>
                        Suggested text: "I'll share the app with you"
                    </Text>
                </View>

                {/* Frame 34 - How it works Card */}
                <View style={styles.howItWorksCard}>
                    {/* Frame 132 - Header */}
                    <View style={styles.howItWorksHeader}>
                        <View style={styles.headerTitleRow}>
                            <Text style={styles.title}>How it works</Text>
                            {/* Frame 71 - Benefit Chip */}
                            <View style={styles.benefitChip}>
                                <Text style={styles.benefitText}>Benefit</Text>
                            </View>
                        </View>
                        <Text style={styles.subtitle}>
                            Clear rules and metrics for you to get the most out of it.
                        </Text>
                    </View>

                    {/* Frame 66 - Bonus Detail */}
                    <View style={styles.bonusCard}>
                        <Text style={styles.bonusTitle}>Bonus</Text>
                        <View style={styles.bonusContent}>
                            <Text style={styles.bonusSubtitle}>
                                For each new guest who places their first order As a buyer or seller, you get:
                            </Text>
                            <Text style={styles.bonusDetail}>
                                5% commission reduction Valid for your next 2 orders Rolls over for each new valid user
                            </Text>
                        </View>
                    </View>

                    {/* Frame 72 - Recent Activity */}
                    <View style={styles.activityCard}>
                        <View style={styles.activityHeader}>
                            <Text style={styles.activityTitle}>Recent activity</Text>
                            {activities.length === 0 && (
                                <View style={styles.demoChip}>
                                    <Text style={styles.demoText}>No activity yet</Text>
                                </View>
                            )}
                        </View>

                        {/* Activity Items */}
                        <ScrollView
                            style={activities.length > 0 ? styles.activityScroll : null}
                            contentContainerStyle={styles.activityItems}
                            nestedScrollEnabled={true}
                        >
                            {activities.map(renderActivityItem)}

                            {activities.length === 0 && (
                                <Text style={styles.activityItemDesc}>Start sharing your link to see activity here!</Text>
                            )}
                        </ScrollView>
                    </View>

                    {/* Frame 73 - Quick Tip */}
                    <View style={styles.tipCard}>
                        <Text style={styles.tipTitle}>Quick Tip (MX)</Text>
                        <Text style={styles.tipDesc}>
                            Best conversion in Mexico: send the link on WhatsApp with a short and clear sentence. Example: "I'll share the app with you to buy/sell handicrafts. Here is my invitation: ..."
                        </Text>
                    </View>

                    {/* Frame 75 - Final Button Row */}
                    {/* <View style={styles.finalButtonRow}>
                        <TouchableOpacity style={styles.finalSecondaryButton} onPress={() => fetchData()}>
                            <Ionicons name="refresh-outline" size={16} color="#0A292D" />
                            <Text style={styles.finalSecondaryButtonText}>Refresh</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.finalPrimaryButton} onPress={() => Alert.alert('Done', 'You are all set!')}>
                            <Ionicons name="checkmark-outline" size={16} color="#F5F5F5" />
                            <Text style={styles.finalPrimaryButtonText}>Finish</Text>
                        </TouchableOpacity>
                    </View> */}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: supplierTheme.colors.background.default,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 40,
        gap: 8,
    },
    mainCard: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 8,
        padding: 8,
        gap: 8,
    },
    headerRow: {
        width: '100%',
        gap: 8,
    },
    headerTextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    title: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 20,
        lineHeight: 24,
        color: '#000000',
    },
    subtitle: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 14,
        lineHeight: 20,
        color: '#0A292D',
    },
    invitationChip: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
        backgroundColor: '#BB5625',
        borderRadius: 70,
    },
    invitationText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 12,
        lineHeight: 14,
        color: '#FFFFFF',
    },
    commissionCard: {
        width: '100%',
        minHeight: 139,
        borderWidth: 1,
        borderColor: '#EEEEEF',
        borderRadius: 8,
        padding: 8,
    },
    commissionInner: {
        flexDirection: 'row',
        gap: 8,
        width: '100%',
    },
    commissionMain: {
        flex: 1,
        gap: 4,
    },
    commissionTitle: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
    },
    commissionDesc: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 14,
        lineHeight: 20,
        color: '#0A292D',
    },
    commissionBadges: {
        width: 64,
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 8,
    },
    mxBadge: {
        width: 35,
        height: 22,
        backgroundColor: '#BB5625',
        borderRadius: 70,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mxText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 12,
        color: '#FFFFFF',
    },
    ordersBadge: {
        width: 64,
        height: 22,
        backgroundColor: '#FFF6EB',
        borderWidth: 1,
        borderColor: '#DDAA39',
        borderRadius: 70,
        justifyContent: 'center',
        alignItems: 'center',
    },
    ordersText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 12,
        color: '#000000',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 4,
        width: '100%',
    },
    statCard: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#EEEEEF',
        borderRadius: 8,
        padding: 8,
        gap: 4,
    },
    statValue: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
    },
    statLabel: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 14,
        lineHeight: 20,
        color: '#0A292D',
    },
    overviewSection: {
        width: '100%',
        gap: 8,
    },
    sectionTitle: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
    },
    qrContainer: {
        width: '100%',
        height: 133,
        backgroundColor: '#FCF7EA',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    qrPlaceholder: {
        width: 108,
        height: 108,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E0D7C2',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionButtons: {
        width: '100%',
        gap: 8,
    },
    primaryButton: {
        width: '100%',
        height: 40,
        backgroundColor: '#00615E',
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        padding: 12,
    },
    primaryButtonText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        color: '#F5F5F5',
    },
    secondaryButton: {
        width: '100%',
        height: 40,
        backgroundColor: '#EAECE1',
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        padding: 12,
    },
    secondaryButtonText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        color: '#0A292D',
    },
    linkSection: {
        width: '100%',
        gap: 4,
    },
    sectionDesc: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 14,
        lineHeight: 20,
        color: '#0A292D',
    },
    inputContainer: {
        width: '100%',
        height: 56,
        backgroundColor: '#F3F0E7',
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    linkInput: {
        flex: 1,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        color: '#0A292D',
    },
    quickShareContainer: {
        width: '100%',
        gap: 8,
    },
    shareRow: {
        flexDirection: 'row',
        gap: 8,
        width: '100%',
    },
    shareCard: {
        flex: 1,
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#EEEEEF',
        borderRadius: 8,
        padding: 8,
        gap: 8,
        alignItems: 'center',
    },
    shareIconBg: {
        width: 32,
        height: 32,
        backgroundColor: '#00615E',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    shareTextContainer: {
        flex: 1,
        gap: 4,
    },
    shareTitle: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
    },
    shareDesc: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 14,
        lineHeight: 20,
        color: '#0A292D',
    },
    suggestedText: {
        width: '100%',
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 14,
        lineHeight: 20,
        color: '#0A292D',
        marginTop: 8,
    },
    howItWorksCard: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 16,
        padding: 8,
        gap: 8,
    },
    howItWorksHeader: {
        width: '100%',
        gap: 8,
        position: 'relative',
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    benefitChip: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
        backgroundColor: '#BB5625',
        borderRadius: 70,
    },
    benefitText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 12,
        lineHeight: 14,
        color: '#FFFFFF',
    },
    bonusCard: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#EEEEEF',
        borderRadius: 8,
        padding: 8,
        gap: 8,
    },
    bonusTitle: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
    },
    bonusContent: {
        gap: 4,
    },
    bonusSubtitle: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 14,
        lineHeight: 20,
        color: '#0A292D',
    },
    bonusDetail: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 14,
        lineHeight: 20,
        color: '#0A292D',
    },
    activityCard: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#EEEEEF',
        borderRadius: 8,
        padding: 8,
        gap: 16,
        position: 'relative',
    },
    activityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    activityTitle: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
    },
    demoChip: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
        backgroundColor: '#BB5625',
        borderRadius: 70,
    },
    demoText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 12,
        lineHeight: 14,
        color: '#FFFFFF',
    },
    activityScroll: {
        maxHeight: 320,
    },
    activityItems: {
        gap: 8,
    },
    activityItem: {
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: '#EEEEEF',
        borderRadius: 8,
        padding: 8,
        gap: 8,
        alignItems: 'center',
    },
    activityIconBg: {
        width: 32,
        height: 32,
        backgroundColor: '#00615E',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activityIconText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 12,
        color: '#FFFFFF',
    },
    activityTextContainer: {
        flex: 1,
        gap: 4,
    },
    activityItemTitle: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
    },
    activityItemDesc: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 14,
        lineHeight: 20,
        color: '#0A292D',
    },
    tipCard: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#EEEEEF',
        borderRadius: 8,
        padding: 8,
        gap: 4,
    },
    tipTitle: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
    },
    tipDesc: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 14,
        lineHeight: 20,
        color: '#0A292D',
    },
    finalButtonRow: {
        flexDirection: 'row',
        gap: 8,
        width: '100%',
        marginTop: 8,
    },
    finalSecondaryButton: {
        flex: 1,
        height: 40,
        backgroundColor: '#EAECE1',
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        padding: 12,
    },
    finalSecondaryButtonText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        color: '#0A292D',
    },
    finalPrimaryButton: {
        flex: 1,
        height: 40,
        backgroundColor: '#00615E',
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        padding: 12,
    },
    finalPrimaryButtonText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        color: '#F5F5F5',
    },
});
