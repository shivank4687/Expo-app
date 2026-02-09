import { supplierTheme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
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

                {/* Frame 24 - Progress Card Container */}
                <View style={styles.progressCard}>
                    {/* Frame 61 - Inner Content */}
                    <View style={styles.cardInner}>
                        {/* Progress Label */}
                        <Text style={styles.progressLabel}>Progress: 25%</Text>

                        {/* Status Message */}
                        <Text style={styles.statusMessage}>
                            Complete 2 steps to activate automatic payouts
                        </Text>

                        {/* Frame 135 - Progress Bar */}
                        <View style={styles.progressBarBackground}>
                            {/* Rectangle 11 - Progress Fill */}
                            <View style={styles.progressBarFill} />
                        </View>

                        {/* Tip Text */}
                        <Text style={styles.tipText}>
                            Tip: Add identity + payments to free up automatic collections.
                        </Text>

                        {/* Frame 104 - Action Required Badge */}
                        <View style={styles.actionBadge}>
                            {/* Ellipse 1 - White Dot */}
                            <View style={styles.badgeDot} />
                            <Text style={styles.badgeText}>Action Required</Text>
                        </View>
                    </View>
                </View>

                {/* Frame 135 - Business Type Card Container */}
                <View style={styles.businessCard}>
                    {/* Frame 72 - Business Type Row */}
                    <View style={styles.businessHeader}>
                        {/* Frame 45 - Icon Background */}
                        <View style={styles.businessIconBg}>
                            <Ionicons name="cube-outline" size={16} color="#FFFFFF" />
                        </View>

                        {/* Frame 61 Container */}
                        <View style={styles.businessTextContainer}>
                            {/* Frame 58 - Inner Text */}
                            <Text style={styles.businessTitle}>Type of business</Text>
                            <Text style={styles.businessDescription}>Define how you sell today</Text>
                        </View>

                        {/* chevron-down (Manual Vector implementation) */}
                        <View style={styles.chevronContainer}>
                            <Ionicons name="chevron-down" size={16} color="#0A292D" />
                        </View>

                        {/* Frame 104 - Done Badge */}
                        <View style={styles.doneBadge}>
                            {/* Ellipse 2 (Icon replacement) */}
                            <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                            <Text style={styles.doneText}>Done</Text>
                        </View>
                    </View>

                    {/* Frame 45 (2nd occurrence) - Form Section */}
                    <View style={styles.formSection}>
                        {/* Frame 145 - Input Row */}
                        <View style={styles.inputRow}>
                            <Text style={styles.inputLabel}>Seller Profile</Text>

                            {/* input container (Chip style input) */}
                            <View style={styles.inputChip}>
                                <Text style={styles.inputText}>Enter here...</Text>
                                <Ionicons name="chevron-down" size={16} color="#0A292D" />
                            </View>
                        </View>

                        {/* Notice Message */}
                        <Text style={styles.noticeText}>
                        </Text>
                    </View>
                </View>

                {/* Frame 136 - Legal Information Card Container */}
                <View style={styles.legalCard}>
                    {/* Frame 72 - Legal Header */}
                    <View style={styles.businessHeader}>
                        {/* Frame 45 - Icon Background */}
                        <View style={styles.businessIconBg}>
                            <Ionicons name="id-card-outline" size={16} color="#FFFFFF" />
                        </View>

                        {/* Frame 61 Container */}
                        <View style={styles.businessTextContainer}>
                            {/* Frame 58 - Inner Text */}
                            <Text style={styles.businessTitle}>Legal information</Text>
                            <Text style={styles.businessDescription}>Identity Verification</Text>
                        </View>

                        {/* chevron-down */}
                        <View style={styles.chevronContainer}>
                            <Ionicons name="chevron-down" size={16} color="#0A292D" />
                        </View>

                        {/* Frame 104 - Missing Documents Badge */}
                        <View style={styles.missingBadge}>
                            <Text style={styles.missingText}>Missing documents</Text>
                        </View>
                    </View>

                    {/* Frame 45 (Inner) - Form Section */}
                    <View style={styles.formSection}>
                        {/* Frame 146 - Identity Input Row */}
                        <View style={styles.inputRow}>
                            <Text style={styles.inputLabel}>Seller Profile</Text>

                            {/* input container */}
                            <View style={styles.inputChip}>
                                <Ionicons name="attach" size={16} color="#0A292D" />
                                <Text style={styles.inputTextSmall}>Enter here...</Text>
                            </View>
                        </View>

                        {/* Description Message */}
                        <Text style={styles.noticeText}>
                            Upload a clear photo (front view). (1 file)
                        </Text>
                    </View>

                    {/* Frame 73 - Video Selfie Section */}
                    <View style={styles.formSection}>
                        {/* Frame 147 - Row */}
                        <View style={styles.inputRowHigher}>
                            <Text style={styles.inputLabelHigh}>Video selfie (3-5s)</Text>

                            {/* input container */}
                            <View style={styles.inputChipHigh}>
                                <Ionicons name="attach" size={16} color="#0A292D" />
                                <Text style={styles.inputTextSmall}>Enter here...</Text>
                            </View>
                        </View>

                        {/* Description Message */}
                        <Text style={styles.noticeText}>
                            To confirm identity and prevent fraud.
                        </Text>
                    </View>

                    {/* Vector 2 - Divider */}
                    <View style={styles.divider} />

                    {/* KYC Notice */}
                    <Text style={styles.noticeText}>
                        Your documents are used only for security (KYC). They are never published
                    </Text>
                </View>

                {/* Frame 137 - VAT and Taxes Card Container */}
                <View style={styles.vatCard}>
                    {/* Frame 72 - VAT Header */}
                    <View style={styles.businessHeader}>
                        {/* Frame 45 - Icon Background */}
                        <View style={styles.businessIconBg}>
                            <Ionicons name="receipt-outline" size={16} color="#FFFFFF" />
                        </View>

                        {/* Frame 61 Container */}
                        <View style={styles.businessTextContainer}>
                            {/* Frame 58 - Inner Text */}
                            <Text style={styles.businessTitle}>VAT and taxes</Text>
                            <Text style={styles.businessDescription}>Tax settings (only if applicable)</Text>
                        </View>

                        {/* chevron-down */}
                        <View style={styles.chevronContainer}>
                            <Ionicons name="chevron-down" size={16} color="#0A292D" />
                        </View>

                        {/* Frame 104 - Done Badge */}
                        <View style={styles.doneBadgeVat}>
                            <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                            <Text style={styles.doneText}>Done</Text>
                        </View>
                    </View>

                    {/* Frame 45 (Inner) - Form Section */}
                    <View style={styles.formSection}>
                        {/* Frame 148 - VAT Mode Input Row */}
                        <View style={styles.inputRow}>
                            <Text style={styles.vatLabel}>VAT Mode</Text>

                            {/* input container (Chip style input) */}
                            <View style={styles.inputChip}>
                                <Text style={styles.inputTextSmall}>Enter here...</Text>
                                <Ionicons name="chevron-down" size={16} color="#0A292D" />
                            </View>
                        </View>

                        {/* Recommendation Message */}
                        <Text style={styles.noticeText}>
                            Recommended: If you don't have a Tax ID, use "Not Applicable" for frictionless selling
                        </Text>
                    </View>
                </View>
                {/* Frame 138 - Contact Card Container */}
                <View style={styles.contactCard}>
                    {/* Frame 72 - Contact Header */}
                    <View style={styles.businessHeader}>
                        {/* Frame 45 - Icon Background */}
                        <View style={styles.businessIconBg}>
                            <Ionicons name="call-outline" size={16} color="#FFFFFF" />
                        </View>

                        {/* Frame 61 Container */}
                        <View style={styles.businessTextContainer}>
                            {/* Frame 58 - Inner Text */}
                            <Text style={styles.businessTitle}>Contact</Text>
                            <Text style={styles.businessDescription}>Fill in or change contact details</Text>
                        </View>

                        {/* chevron-down */}
                        <View style={styles.chevronContainer}>
                            <Ionicons name="chevron-down" size={16} color="#0A292D" />
                        </View>

                        {/* Frame 105 - To be completed Badge */}
                        <View style={styles.toBeCompletedBadge}>
                            <Text style={styles.toBeCompletedText}>To be completed</Text>
                        </View>
                    </View>

                    {/* Frame 45 (Inner) - Form Section */}
                    <View style={styles.formSection}>
                        {/* Phone Row */}
                        <View style={styles.inputRow}>
                            <Text style={styles.phoneLabel}>Teléfono</Text>
                            <View style={[styles.inputChip, { height: 38 }]}>
                                <Text style={styles.inputTextSmall}>Enter here...</Text>
                            </View>
                        </View>

                        {/* Email Row */}
                        <View style={styles.inputRow}>
                            <Text style={styles.emailLabel}>Correo</Text>
                            <View style={[styles.inputChip, { height: 40 }]}>
                                <Text style={styles.inputText}>Enter here...</Text>
                            </View>
                        </View>

                        {/* Address Row Section (Frame 74) */}
                        <View style={styles.formSection}>
                            <View style={styles.inputRow}>
                                <Text style={styles.addressLabel}>Address</Text>
                                <View style={[styles.inputChip, { height: 38 }]}>
                                    <Text style={styles.inputTextSmall}>Enter here...</Text>
                                </View>
                            </View>
                            <Text style={styles.noticeText}>
                                Used for returns and shipment validation
                            </Text>
                        </View>
                    </View>
                </View>
                {/* Frame 139 - Payments Card Container */}
                <View style={styles.paymentsCard}>
                    {/* Frame 72 - Payments Header */}
                    <View style={styles.businessHeader}>
                        {/* Frame 45 - Icon Background */}
                        <View style={styles.businessIconBg}>
                            <Ionicons name="card-outline" size={16} color="#FFFFFF" />
                        </View>

                        {/* Frame 61 Container */}
                        <View style={styles.businessTextContainer}>
                            {/* Frame 58 - Inner Text */}
                            <Text style={styles.businessTitle}>Payments</Text>
                            <Text style={styles.businessDescription}>Where to receive your money (escrow)</Text>
                        </View>

                        {/* chevron-down */}
                        <View style={styles.chevronContainer}>
                            <Ionicons name="chevron-down" size={16} color="#0A292D" />
                        </View>

                        {/* Frame 105 - To be completed Badge */}
                        <View style={[styles.toBeCompletedBadge, { right: 97 }]}>
                            <Text style={styles.toBeCompletedText}>To be completed</Text>
                        </View>
                    </View>

                    {/* Form Sections */}
                    <View style={styles.formSection}>
                        {/* Primary Method Row */}
                        <View style={styles.formSection}>
                            <View style={styles.inputRow}>
                                <Text style={styles.primaryMethodLabel}>Primary Method</Text>
                                <View style={styles.inputChip}>
                                    <Text style={styles.inputTextSmall}>Enter here...</Text>
                                    <Ionicons name="chevron-down" size={16} color="#0A292D" />
                                </View>
                            </View>
                            <Text style={styles.noticeText}>
                                Recommended: Bank account for automatic payments.
                            </Text>
                        </View>

                        {/* Bank Row */}
                        <View style={styles.inputRow}>
                            <Text style={styles.bankLabel}>Bank</Text>
                            <View style={[styles.inputChip, { height: 38 }]}>
                                <Text style={styles.inputTextSmall}>Enter here...</Text>
                            </View>
                        </View>

                        {/* CLABE Row */}
                        <View style={styles.inputRow}>
                            <Text style={styles.clabeLabel}>CLABE</Text>
                            <View style={[styles.inputChip, { height: 38 }]}>
                                <Text style={styles.inputTextSmall}>Enter here...</Text>
                            </View>
                        </View>

                        {/* Account Holder Row */}
                        <View style={styles.inputRow}>
                            <Text style={styles.holderLabel}>Account Holder</Text>
                            <View style={[styles.inputChip, { height: 38 }]}>
                                <Text style={styles.inputTextSmall}>Enter here...</Text>
                            </View>
                        </View>
                    </View>
                </View>
                {/* Frame 140 - Close Account Card Container */}
                <View style={styles.closeAccountCard}>
                    {/* Frame 72 - Header */}
                    <View style={styles.businessHeader}>
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
                            <Ionicons name="chevron-down" size={16} color="#0A292D" />
                        </View>
                    </View>

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
                </View>

                {/* Frame 141 - Action Summary Card Container */}
                <View style={styles.actionSummaryCard}>
                    <View style={styles.actionSummaryInner}>
                        <Text style={styles.progressText}>Progress: 25%</Text>
                        <Text style={styles.activationMessage}>
                            Complete identity + payments to activate payouts
                        </Text>

                        {/* Frame 75 - Button Row */}
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
        paddingBottom: 40,
        gap: 8,
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
        width: 100,
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
    businessCard: {
        width: '100%',
        minHeight: 155,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 8,
        padding: 8,
        gap: 8,
    },
    legalCard: {
        width: '100%',
        minHeight: 279,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 16,
        padding: 8,
        gap: 8,
    },
    vatCard: {
        width: '100%',
        minHeight: 155,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 16,
        padding: 8,
        gap: 8,
    },
    contactCard: {
        width: '100%',
        minHeight: 227,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 16,
        padding: 8,
        gap: 8,
    },
    paymentsCard: {
        width: '100%',
        minHeight: 293,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E9E3D3',
        borderRadius: 16,
        padding: 8,
        gap: 8,
    },
    closeAccountCard: {
        width: '100%',
        minHeight: 214,
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
        paddingVertical: 12,
        paddingHorizontal: 16,
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
    doneBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
        gap: 4,
        position: 'absolute',
        width: 67,
        height: 24,
        right: 98,
        top: -3,
        backgroundColor: '#BB5625',
        borderRadius: 80,
    },
    doneBadgeVat: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
        gap: 4,
        position: 'absolute',
        width: 67,
        height: 24,
        right: 124,
        top: -2,
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
        position: 'absolute',
        width: 113,
        height: 22,
        right: 112,
        top: -1,
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
        width: 67,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
    },
    emailLabel: {
        width: 53,
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
    noticeText: {
        width: '100%',
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 14,
        lineHeight: 20,
        color: '#0A292D',
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
        padding: 12,
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
});
