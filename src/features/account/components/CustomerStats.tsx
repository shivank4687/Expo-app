import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRequireAuth } from '@/shared/hooks/useRequireAuth';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCustomerStatsThunk } from '@/store/slices/customerStatsSlice';
import { updateBuyerType } from '@/store/slices/authSlice';
import { useFocusEffect } from '@react-navigation/native';
import { formatters } from '@/shared/utils/formatters';
import { getCustomerProfile, CUSTOMER_SUBTYPES } from '../api/customer-tax-profile.api';

export const CustomerStats = () => {
    const { t } = useTranslation();
    const { user } = useRequireAuth();
    const dispatch = useAppDispatch();
    const { data: stats, isLoading } = useAppSelector((state) => state.customerStats);
    const { selectedCurrency } = useAppSelector((state) => state.core);
    const currencySymbol = selectedCurrency?.symbol || selectedCurrency?.code || '$';
    const formattedSpend = stats?.formatted_total_spend || formatters.formatPrice(stats?.total_spend, currencySymbol);

    // Resolve buyer type label from subtype value
    const buyerType = React.useMemo(() => {
        const buyerSuffix = t('dashboardCards.stats.buyerSuffix');
        if (user?.buyer_type) {
            const match = CUSTOMER_SUBTYPES.find((s) => s.value === user.buyer_type);
            if (match) {
                // Convert the i18n key suffix to a display label (e.g. 'retailer' → 'Retailer Buyer')
                return user.buyer_type.charAt(0).toUpperCase() + user.buyer_type.slice(1) + ' ' + buyerSuffix;
            }
        }
        // Fall back to group name
        if (user?.group?.name || user?.group?.code) {
            const name = user?.group?.name || (user.group!.code.charAt(0).toUpperCase() + user.group!.code.slice(1));
            return name + ' ' + buyerSuffix;
        }
        return null;
    }, [user?.buyer_type, user?.group, t]);

    useFocusEffect(
        React.useCallback(() => {
            dispatch(fetchCustomerStatsThunk());
            // Fetch buyer_type from profile if not yet in Redux
            if (!user?.buyer_type) {
                getCustomerProfile()
                    .then((profile) => {
                        if (profile?.buyer_type) {
                            dispatch(updateBuyerType(profile.buyer_type));
                        }
                    })
                    .catch(() => { /* non-critical */ });
            }
        }, [dispatch, user?.buyer_type])
    );

    return (
        <View style={styles.container}>
            {/* Top Row: Profile Info & Actions */}
            <View style={styles.topRow}>
                {/* Profile Left Side */}
                <View style={styles.profileSection}>
                    <View style={styles.avatar}>
                        <Ionicons name="person" size={24} color="#A3A194" />
                    </View>
                    <View style={styles.infoContainer}>
                        <Text style={styles.nameText}>{user?.name || 'User'}</Text>
                        {buyerType && (
                            <Text style={styles.typeText}>{buyerType}</Text>
                        )}

                        {/* Badges Container */}
                        {/* <View style={styles.badgesWrapper}>
                            <View style={styles.verifiedContainer}>
                                <Ionicons name="shield-checkmark" size={14} color="#00615E" />
                                <Text style={styles.verifiedText}>{t('dashboardCards.stats.verifiedBuyer')}</Text>
                            </View>
                            <View style={styles.scoreChip}>
                                <Text style={styles.scoreText}>{t('dashboardCards.stats.score')} 92</Text>
                            </View>
                        </View> */}
                    </View>
                </View>

                {/* Top Right Actions */}
                {/* <View style={styles.actionButtons}>
                    <View style={styles.actionChip}>
                        <Text style={styles.actionText}>{t('dashboardCards.stats.wallet')}</Text>
                    </View>
                    <View style={styles.actionChip}>
                        <Text style={styles.actionText}>{t('dashboardCards.stats.help')}</Text>
                    </View>
                </View> */}
            </View>

            {/* Stats Row */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.statsScrollContent}
                style={styles.statsScroll}
            >
                <View style={styles.statBlock}>
                    <Text style={styles.statNumber}>
                        {isLoading ? '...' : (stats?.total_orders ?? '0')}
                    </Text>
                    <Text style={styles.statLabel}>{t('dashboardCards.stats.orders')}</Text>
                </View>
                <View style={styles.statBlock}>
                    <Text style={styles.statNumber}>
                        {isLoading ? '...' : formattedSpend}
                    </Text>
                    <Text style={styles.statLabel}>{t('dashboardCards.stats.spend')}</Text>
                </View>
                {/* <View style={styles.statBlock}>
                    <Text style={styles.statNumber}>18</Text>
                    <Text style={styles.statLabel}>Saved</Text>
                </View> */}
            </ScrollView>

            {/* Bottom Note */}
            <Text style={styles.bottomNote}>
                {t('dashboardCards.stats.fastActionsNote')}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 8,
        padding: 8,
        marginHorizontal: 16,
        marginTop: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        width: '100%',
    },
    profileSection: {
        flexDirection: 'row',
        flex: 1,
        gap: 8,
    },
    avatar: {
        width: 48,
        height: 48,
        backgroundColor: '#E6E4D8',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoContainer: {
        flexDirection: 'column',
        justifyContent: 'flex-start',
        gap: 4,
        flex: 1,
    },
    nameText: {
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
        fontWeight: '500',
        fontSize: 16,
        color: '#000000',
        lineHeight: 16,
    },
    typeText: {
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
        fontWeight: '500',
        fontSize: 14,
        color: '#0A292D',
        lineHeight: 16.8,
    },
    badgesWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 247,
        paddingVertical: 4,
        paddingLeft: 6,
        paddingRight: 4,
        gap: 4,
        alignSelf: 'flex-start',
    },
    verifiedContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    verifiedText: {
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
        fontWeight: '500',
        fontSize: 11,
        color: '#0A292D',
        lineHeight: 13.2,
    },
    scoreChip: {
        backgroundColor: '#DDAA39',
        borderRadius: 50,
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    scoreText: {
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
        fontWeight: '600',
        fontSize: 11,
        color: '#FFFFFF',
        lineHeight: 13.2,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 4,
    },
    actionChip: {
        backgroundColor: '#BB5625',
        borderRadius: 50,
        paddingVertical: 4,
        paddingHorizontal: 8,
        justifyContent: 'center',
        alignItems: 'center',
        height: 23,
    },
    actionText: {
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
        fontWeight: '600',
        fontSize: 11,
        color: '#FFFFFF',
        lineHeight: 15.4,
    },
    statsScroll: {
        width: '100%',
    },
    statsScrollContent: {
        gap: 4,
        flexGrow: 1,
        paddingRight: 16,
    },
    statBlock: {
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 8,
        padding: 8,
        flexDirection: 'column',
        gap: 4,
        minWidth: 168,
    },
    statNumber: {
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
        fontWeight: '700',
        fontSize: 16,
        color: '#000000',
        lineHeight: 19.2,
    },
    statLabel: {
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
        fontWeight: '500',
        fontSize: 12,
        color: '#0A292D',
        lineHeight: 16.8,
    },
    bottomNote: {
        fontFamily: Platform.OS === 'ios' ? 'Inter' : 'sans-serif',
        fontWeight: '500',
        fontSize: 14,
        color: '#0A292D',
        lineHeight: 16.8,
    },
});
