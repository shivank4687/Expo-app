import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LegalInformationCardStyles {
    legalCard: ViewStyle;
    businessHeader: ViewStyle;
    businessIconBg: ViewStyle;
    businessTextContainer: ViewStyle;
    businessTitle: TextStyle;
    businessDescription: TextStyle;
    chevronContainer: ViewStyle;
    missingBadge: ViewStyle;
    missingText: TextStyle;
    divider: ViewStyle;
    noticeText: TextStyle;
    formSection: ViewStyle;
    inputRow: ViewStyle;
    inputLabel: TextStyle;
    inputChip: ViewStyle;
    inputTextSmall: TextStyle;
    inputRowHigher: ViewStyle;
    inputLabelHigh: TextStyle;
    inputChipHigh: ViewStyle;
}

interface LegalInformationCardProps {
    expanded: boolean;
    onToggle: () => void;
    styles: LegalInformationCardStyles;
}

export default function LegalInformationCard({
    expanded,
    onToggle,
    styles,
}: LegalInformationCardProps) {
    return (
        <View style={styles.legalCard}>
            <TouchableOpacity
                style={styles.businessHeader}
                onPress={onToggle}
                activeOpacity={0.7}
            >
                <View style={styles.businessIconBg}>
                    <Ionicons name="id-card-outline" size={16} color="#FFFFFF" />
                </View>

                <View style={styles.businessTextContainer}>
                    <Text style={styles.businessTitle}>Legal information</Text>
                    <Text style={styles.businessDescription}>Identity Verification</Text>
                </View>

                <View style={styles.chevronContainer}>
                    <Ionicons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color="#0A292D"
                    />
                </View>

                <View style={styles.missingBadge}>
                    <Text style={styles.missingText}>Missing documents</Text>
                </View>
            </TouchableOpacity>

            {expanded && (
                <>
                    <View style={styles.formSection}>
                        <View style={styles.inputRow}>
                            <Text style={styles.inputLabel}>Seller Profile</Text>
                            <View style={styles.inputChip}>
                                <Ionicons name="attach" size={16} color="#0A292D" />
                                <Text style={styles.inputTextSmall}>Enter here...</Text>
                            </View>
                        </View>
                        <Text style={styles.noticeText}>
                            Upload a clear photo (front view). (1 file)
                        </Text>
                    </View>

                    <View style={styles.formSection}>
                        <View style={styles.inputRowHigher}>
                            <Text style={styles.inputLabelHigh}>Video selfie (3-5s)</Text>
                            <View style={styles.inputChipHigh}>
                                <Ionicons name="attach" size={16} color="#0A292D" />
                                <Text style={styles.inputTextSmall}>Enter here...</Text>
                            </View>
                        </View>
                        <Text style={styles.noticeText}>
                            To confirm identity and prevent fraud.
                        </Text>
                    </View>

                    <View style={styles.divider} />
                    <Text style={styles.noticeText}>
                        Your documents are used only for security (KYC). They are never published
                    </Text>
                </>
            )}
        </View>
    );
}
