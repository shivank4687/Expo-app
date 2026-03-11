import ContactCard from '@/features/supplier-panel/profile/components/ContactCard';
import LegalInformationCard from '@/features/supplier-panel/profile/components/LegalInformationCard';
import StripeConnectCard from '@/features/supplier-panel/profile/components/StripeConnectCard';
import VatTaxesCard from '@/features/supplier-panel/profile/components/VatTaxesCard';
import ApplicationDataCard from '@/features/supplier-panel/profile/components/ApplicationDataCard';
import { supplierTheme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppDispatch } from '@/store/hooks';
import { supplierLogoutThunk } from '@/store/slices/supplierAuthSlice';
import ProgressCard from './components/ProgressCard';
type ProfileProgressState = {
    legal: boolean
    vat: boolean
    contact: boolean
    payments: boolean
}

const progressTips: Record<keyof ProfileProgressState, string> = {
    legal: 'Tip: Upload identity documents and record a selfie video to verify your legal information.',
    vat: 'Tip: Submit VAT/tax details, address, and phone to close out tax requirements.',
    contact: 'Tip: Provide your contact and business address so we can reach you quickly.',
    payments: 'Tip: Connect Stripe to receive payouts as soon as your account is approved.',
};

const orderedProgressSteps: Array<keyof ProfileProgressState> = ['legal', 'vat', 'contact', 'payments'];

const initialReadyState: Record<keyof ProfileProgressState, boolean> = {
    legal: false,
    vat: false,
    contact: false,
    payments: false,
};

export default function ProfileScreen() {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();
    const router = useRouter();

    const insets = useSafeAreaInsets();
    const { expandLegal } = useLocalSearchParams<{ expandLegal?: string }>();
    const [expandedCards, setExpandedCards] = useState({
        legal: true,
        vat: true,
        contact: true,
        payments: true,
        applicationData: true,
        closeAccount: false,
    });
    // Key used to force LegalInformationCard to remount and reload when arriving from a notification
    const [legalKey, setLegalKey] = useState(0);
    const [progressState, setProgressState] = useState<ProfileProgressState>({
        legal: false,
        vat: false,
        contact: false,
        payments: false,
    })
    const total = Object.keys(progressState).length
    const completed = Object.values(progressState).filter(Boolean).length
    const percent = Math.round((completed / total) * 100)
    const [cardReady, setCardReady] = useState<Record<keyof ProfileProgressState, boolean>>(
        () => ({ ...initialReadyState })
    );
    const markCardReady = useCallback((card: keyof ProfileProgressState) => {
        setCardReady((prev) => (prev[card] ? prev : { ...prev, [card]: true }));
    }, []);
    const allCardsReady = orderedProgressSteps.every((step) => cardReady[step]);
    const pendingStep = orderedProgressSteps.find((step) => !progressState[step]);
    const tipText = pendingStep
        ? progressTips[pendingStep]
        : 'Tip: You’re all set—your profile is complete and payouts can run automatically.';

    const toggleCard = (card: keyof typeof expandedCards) => {
        setExpandedCards((prev) => ({ ...prev, [card]: !prev[card] }));
    };

    // When navigating here from an identity verification notification,
    // force the legal card open and reload its status.
    useFocusEffect(
        useCallback(() => {
            if (expandLegal === '1') {
                setExpandedCards((prev) => ({ ...prev, legal: true }));
                setLegalKey((k) => k + 1); // remounts LegalInformationCard → triggers fresh API call
            }
        }, [expandLegal])
    );

    const handleLogout = () => {
        Alert.alert(
            t('auth.logoutConfirmTitle', 'Confirm Logout'),
            t('auth.logoutConfirmMessage', 'Are you sure you want to logout?'),
            [
                {
                    text: t('common.cancel', 'Cancel'),
                    style: 'cancel',
                },
                {
                    text: t('auth.logout', 'Logout'),
                    style: 'destructive',
                    onPress: async () => {
                        await dispatch(supplierLogoutThunk());
                        // Navigate to shop home screen after logout
                        router.replace('/(drawer)/(tabs)');
                    },
                },
            ],
            { cancelable: true }
        );
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom }]}
            >
                {/* Frame 134 - Header Container */}
                <View style={styles.headerContainer}>
                    {/* My data - Title */}
                    <Text style={styles.title}>My data</Text>

                    {/* Frame 71 - Help Chip */}
                    <View style={styles.helpChip}>
                        <Text style={styles.helpText}>Help</Text>
                    </View>

                    {/* Subtitle */}
                    <Text style={styles.subtitle}>
                        Complete your profile to sell more and get paid faster
                    </Text>
                </View>

                <ProgressCard
                    styles={styles}
                    percent={percent}
                    completedSteps={completed}
                    totalSteps={total}
                    isLoading={!allCardsReady}
                    tipText={tipText}
                    actionBadgeText="Action Required"
                    showActionBadge={percent < 100}
                />

                {/* Frame 137 - VAT and Taxes Card Container */}
                {/* Frame 137 - VAT and Taxes Card Container */}
                <VatTaxesCard
                    expanded={expandedCards.vat}
                    onToggle={() => toggleCard('vat')}
                    onStatusChange={(done) =>
                        setProgressState(prev => ({ ...prev, vat: done }))
                    }
                    styles={styles}
                    onReady={() => markCardReady('vat')}
                />

                {/* Frame 136 - Legal Information Card Container */}
                {/* Frame 136 - Legal Information Card Container */}
                <LegalInformationCard
                    key={legalKey}
                    expanded={expandedCards.legal}
                    onToggle={() => toggleCard('legal')}
                    onStatusChange={(done) =>
                        setProgressState(prev => ({ ...prev, legal: done }))
                    }
                    onReady={() => markCardReady('legal')}
                    styles={styles}

                />


                <ContactCard
                    expanded={expandedCards.contact}
                    onToggle={() => toggleCard('contact')}
                    onStatusChange={(done) =>
                        setProgressState(prev => ({ ...prev, contact: done }))
                    }
                    styles={styles}
                    onReady={() => markCardReady('contact')}
                />
                {/* Frame 139 - Payments Card Container */}
                {/* Frame 139 - Payments Card Container */}
                {/* Frame 139 - Payments Card Container */}
                <StripeConnectCard
                    expanded={expandedCards.payments}
                    onToggle={() => toggleCard('payments')}
                    onStatusChange={(done) =>
                        setProgressState(prev => ({ ...prev, payments: done }))
                    }
                    onReady={() => markCardReady('payments')}
                />

                <ApplicationDataCard
                    expanded={expandedCards.applicationData}
                    onToggle={() => toggleCard('applicationData')}
                    styles={styles as any}
                />

                {/* Frame 140 - Close Account Card Container */}
                {/* Frame 140 - Close Account Card Container */}
                <View style={styles.closeAccountCard}>
                    {/* Frame 72 - Header */}
                    <TouchableOpacity
                        style={styles.businessHeader}
                        onPress={() => toggleCard('closeAccount')}
                        activeOpacity={0.7}
                    >
                        {/* Frame 45 - Icon Background */}
                        <View style={styles.businessIconBg}>
                            <Ionicons name="warning-outline" size={16} color="#FFFFFF" />
                        </View>

                        {/* Frame 61 Container */}
                        <View style={styles.businessTextContainer}>
                            <Text style={styles.businessTitle}>Close account</Text>
                            <Text style={styles.businessDescription}>Final Action</Text>
                        </View>

                        {/* chevron-down */}
                        <View style={styles.chevronContainer}>
                            <Ionicons
                                name={expandedCards.closeAccount ? 'chevron-up' : 'chevron-down'}
                                size={16}
                                color="#0A292D"
                            />
                        </View>
                    </TouchableOpacity>

                    {expandedCards.closeAccount && (
                        <>
                            {/* Frame 76 - Warning Box */}
                            <View style={styles.warningBox}>
                                <Text style={styles.warningTitle}>This action is permanent.</Text>
                                <Text style={styles.warningDescription}>
                                    Before closing your account, all sales, shipments, and disputes must be completed. History may be retained for legal reasons.
                                </Text>
                            </View>

                            {/* Button */}
                            <TouchableOpacity style={styles.closeButton}>
                                <Text style={styles.closeButtonText}>Close account</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {/* Frame 141 - Action Summary Card Container */}
                {/* <View style={styles.actionSummaryCard}>
                    <View style={styles.actionSummaryInner}>
                        <Text style={styles.progressText}>Progress: 25%</Text>
                        <Text style={styles.activationMessage}>
                            Complete identity + payments to activate payouts
                        </Text>


                        <View style={styles.buttonRow}>
                            <TouchableOpacity style={styles.secondaryActionButton}>
                                <Ionicons name="eye-outline" size={16} color="#0A292D" />
                                <Text style={styles.secondaryButtonText}>Preview</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.primaryActionButton}>
                                <Ionicons name="checkmark-outline" size={16} color="#F5F5F5" />
                                <Text style={styles.primaryButtonText}>Finish</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View> */}

                {/* Logout */}
                <View style={styles.logoutSection}>
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Ionicons name="log-out-outline" size={24} color="#D32F2F" />
                        <Text style={styles.logoutText}>{t('auth.logout', 'Logout')}</Text>
                    </TouchableOpacity>
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
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 0,
        gap: 8,
        flexGrow: 1,
    },
    headerContainer: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        gap: 8,
        width: '100%',
        minHeight: 52,
        position: 'relative',
    },
    title: {
        width: '100%',
        height: 24,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '700',
        fontSize: 24,
        lineHeight: 24,
        color: '#000000',
    },
    helpChip: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
        gap: 10,
        position: 'absolute',
        width: 43,
        height: 22,
        right: 0,
        top: 0,
        backgroundColor: '#BB5625',
        borderRadius: 70,
    },
    helpText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 12,
        lineHeight: 14,
        color: '#FFFFFF',
    },
    subtitle: {
        width: '100%',
        minHeight: 20,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 14,
        lineHeight: 20,
        color: '#0A292D',
    },
    progressCard: {
        width: '100%',
        minHeight: 129,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 8,
        padding: 8,
    },
    progressCardLoading: {
        width: '100%',
        minHeight: 129,
        backgroundColor: '#F6F3ED',
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 8,
        padding: 8,
    },
    cardInner: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 8,
        width: '100%',
        position: 'relative',
    },
    progressLabel: {
        width: '100%',
        height: 19,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
    },
    statusMessage: {
        width: '100%',
        height: 20,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 14,
        lineHeight: 20,
        color: '#0A292D',
    },
    progressBarBackground: {
        width: '100%',
        height: 10,
        backgroundColor: '#F3F0E7',
        borderRadius: 47,
        overflow: 'hidden',
    },
    progressBarFill: {
        position: 'absolute',
        height: 10,
        backgroundColor: '#00615E',
    },
    tipText: {
        width: '100%',
        height: 40,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 14,
        lineHeight: 20,
        color: '#0A292D',
    },
    actionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
        gap: 4,
        position: 'absolute',
        width: 120,
        height: 22,
        right: 0,
        top: 0,
        backgroundColor: '#BB5625',
        borderRadius: 80,
    },
    badgeDot: {
        width: 8,
        height: 8,
        backgroundColor: '#FFFFFF',
        borderRadius: 4,
    },
    badgeText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 12,
        lineHeight: 14,
        color: '#FFFFFF',
    },
    placeholderBase: {
        width: '100%',
        borderRadius: 6,
        backgroundColor: '#EEF1F6',
        overflow: 'hidden',
        position: 'relative',
        height: 19,
    },
    placeholderLine: {
        height: 19,
    },
    placeholderLineShort: {
        height: 20,
        width: '60%',
    },
    placeholderBar: {
        height: 10,
        borderRadius: 6,
        backgroundColor: '#E6EBF3',
    },
    placeholderTip: {
        height: 40,
        width: '90%',
        borderRadius: 6,
        backgroundColor: '#E6EBF3',
    },
    placeholderShimmer: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.55)',
        borderRadius: 16,
    },
    businessCard: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 8,
        padding: 8,
        gap: 8,
    },
    legalCard: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 16,
        padding: 8,
        gap: 8,
    },
    vatCard: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 16,
        padding: 8,
        gap: 8,
    },
    contactCard: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 16,
        padding: 8,
        gap: 8,
    },
    paymentsCard: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 16,
        padding: 8,
        gap: 8,
    },
    closeAccountCard: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 16,
        padding: 8,
        gap: 8,
    },
    actionSummaryCard: {
        width: '100%',
        minHeight: 111,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 16,
        padding: 8,
    },
    actionSummaryInner: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 8,
        width: '100%',
    },
    progressText: {
        width: '100%',
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
    },
    activationMessage: {
        width: '100%',
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 14,
        lineHeight: 20,
        color: '#0A292D',
    },
    buttonRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        width: '100%',
        height: 40,
    },
    primaryActionButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        gap: 8,
        backgroundColor: '#00615E',
        borderRadius: 8,
        height: 40,
    },
    secondaryActionButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        gap: 8,
        backgroundColor: '#EAECE1',
        borderRadius: 8,
        height: 40,
    },
    primaryButtonText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        color: '#F5F5F5',
    },
    secondaryButtonText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        color: '#0A292D',
    },
    businessHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 0,
        gap: 8,
        width: '100%',
        position: 'relative',
    },
    businessIconBg: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        width: 32,
        height: 32,
        backgroundColor: '#00615E',
        borderRadius: 8,
    },
    businessTextContainer: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 4,
    },
    businessTitle: {
        width: '100%',
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
    },
    businessDescription: {
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
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginLeft: 'auto',
    },
    doneBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
        gap: 4,
        backgroundColor: '#BB5625',
        borderRadius: 80,
    },
    doneBadgeVat: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
        gap: 4,
        backgroundColor: '#BB5625',
        borderRadius: 80,
    },
    missingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
        gap: 4,
        position: 'absolute',
        width: 128,
        height: 22,
        right: 25,
        top: -2,
        backgroundColor: '#FCF7EA',
        borderWidth: 1,
        borderColor: '#DDAA39',
        borderRadius: 80,
    },
    toBeCompletedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
        gap: 4,
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
    missingText: {
        width: 112,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 12,
        lineHeight: 14,
        color: '#000000',
    },
    doneText: {
        width: 31,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 12,
        lineHeight: 14,
        color: '#FFFFFF',
    },
    formSection: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        gap: 8,
        width: '100%',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 0,
        gap: 8,
        width: '100%',
    },
    inputRowHigher: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 0,
        gap: 8,
        width: '100%',
        height: 52,
    },
    inputLabel: {
        width: 97,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
    },
    phoneLabel: {
        width: 64,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
    },
    emailLabel: {
        width: 64,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
    },
    addressLabel: {
        width: 64,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
    },
    primaryMethodLabel: {
        width: 123,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
    },
    bankLabel: {
        width: 39,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
    },
    clabeLabel: {
        width: 53,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
    },
    holderLabel: {
        width: 120,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
    },
    vatLabel: {
        width: 78,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
    },
    inputLabelHigh: {
        width: 143,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
    },
    inputChip: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 10,
        height: 40,
        backgroundColor: '#F3F0E7',
        borderRadius: 8,
    },
    inputChipHigh: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 10,
        height: 52,
        backgroundColor: '#F3F0E7',
        borderRadius: 8,
    },
    inputText: {
        flex: 1,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 16,
        color: '#0A292D',
    },
    inputTextSmall: {
        flex: 1,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 14,
        lineHeight: 14,
        color: '#0A292D',
    },
    attachmentButtonRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    attachmentButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#E1D9CF',
        borderRadius: 8,
        backgroundColor: '#FAF9F6',
    },
    attachmentButtonIcon: {
        marginRight: 6,
    },
    attachmentButtonText: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 14,
        color: '#0A292D',
    },
    attachmentPreview: {
        flex: 1,
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#E1D9CF',
        borderRadius: 8,
        backgroundColor: '#F0FCF8',
    },
    attachmentPreviewText: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 14,
        color: '#0A292D',
    },
    attachmentPreviewAction: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: '#00615E',
        borderRadius: 6,
        backgroundColor: '#FFFFFF',
    },
    videoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 6,
        borderRadius: 8,
        backgroundColor: '#00615E',
        marginTop: 8,
    },
    iconButtonText: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 14,
        color: '#FFFFFF',
    },
    recordingText: {
        marginTop: 6,
        fontFamily: 'Inter',
        fontSize: 12,
        color: '#BB5625',
    },
    videoPreview: {
        marginTop: 12,
        padding: 10,
        flex: 1,
        width: '100%',
        borderWidth: 1,
        borderColor: '#E1D9CF',
        borderRadius: 8,
        backgroundColor: '#F6F8FA',
    },
    videoPreviewText: {
        fontFamily: 'Inter',
        fontSize: 14,
        fontWeight: '500',
        color: '#0A292D',
    },
    videoPreviewSubtext: {
        fontFamily: 'Inter',
        fontSize: 12,
        color: '#7D8A8C',
    },
    videoPreviewAction: {
        borderWidth: 1,
        borderColor: '#00615E',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    noticeText: {
        width: '100%',
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 14,
        lineHeight: 20,
        color: '#0A292D',
        flexShrink: 1,
        flexWrap: 'wrap',
    },
    inputField: {
        flex: 1,
        height: 40,
        borderWidth: 1,
        borderColor: '#E1D9CF',
        borderRadius: 8,
        paddingHorizontal: 12,
        fontFamily: 'Inter',
        fontSize: 14,
        color: '#0A292D',
        backgroundColor: '#FAF9F6',
    },
    saveButton: {
        width: '100%',
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#00615E',
        borderRadius: 8,
        marginTop: 8,
    },
    saveButtonText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '600',
        fontSize: 16,
        color: '#FFFFFF',
    },
    smallInputField: {
        flex: 0,
        width: 110,
    },
    warningBox: {
        width: '100%',
        minHeight: 99,
        backgroundColor: '#FDF2F2',
        borderWidth: 1,
        borderColor: '#F5BFBF',
        borderRadius: 8,
        padding: 8,
        gap: 4,
    },
    warningTitle: {
        width: '100%',
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#DC2626',
    },
    warningDescription: {
        width: '100%',
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 14,
        lineHeight: 20,
        color: '#7A2B2B',
    },
    closeButton: {
        width: '100%',
        height: 40,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 0,
        paddingHorizontal: 12,
        backgroundColor: '#FCEEEE',
        borderWidth: 1,
        borderColor: '#F5BFBF',
        borderRadius: 8,
    },
    closeButtonText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        color: '#DC2626',
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: '#EEEEEF',
        marginVertical: 4,
    },
    logoutSection: {
        marginTop: 16,
        marginBottom: 32,
        alignItems: 'center',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 8,
    },
    logoutText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        color: '#D32F2F',
    },
});
