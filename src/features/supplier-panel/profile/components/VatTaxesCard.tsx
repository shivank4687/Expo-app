import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ViewStyle, TextStyle, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import InlineDropdown, { DropdownOption } from '@/features/supplier-panel/components/InlineDropdown';

interface VatTaxesCardStyles {
    vatCard: ViewStyle;
    businessHeader: ViewStyle;
    businessIconBg: ViewStyle;
    businessTextContainer: ViewStyle;
    businessTitle: TextStyle;
    businessDescription: TextStyle;
    chevronContainer: ViewStyle;
    doneBadgeVat: ViewStyle;
    doneText: TextStyle;
    formSection: ViewStyle;
    inputRow: ViewStyle;
    vatLabel: TextStyle;
    inputLabel: TextStyle;
    inputChip: ViewStyle;
    inputTextSmall: TextStyle;
    noticeText: TextStyle;
}

interface VatTaxesCardProps {
    expanded: boolean;
    onToggle: () => void;
    styles: VatTaxesCardStyles;
}

const fiscalRegimeOptions: DropdownOption[] = [
    {
        value: 'general_personas_morales',
        label: 'General de Ley Personas Morales',
    },
    {
        value: 'regimen_incorporacion_fiscal',
        label: 'Régimen de Incorporación Fiscal',
    },
];

export default function VatTaxesCard({
    expanded,
    onToggle,
    styles,
}: VatTaxesCardProps) {
    const [rfc, setRfc] = useState('');
    const [selectedRegime, setSelectedRegime] = useState<string | null>(null);

    return (
        <View style={styles.vatCard}>
            <TouchableOpacity
                style={styles.businessHeader}
                onPress={onToggle}
                activeOpacity={0.7}
            >
                <View style={styles.businessIconBg}>
                    <Ionicons name="receipt-outline" size={16} color="#FFFFFF" />
                </View>

                <View style={styles.businessTextContainer}>
                    <Text style={styles.businessTitle}>VAT and taxes</Text>
                    <Text style={styles.businessDescription}>Tax settings (only if applicable)</Text>
                </View>

                <View style={styles.chevronContainer}>
                    <Ionicons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color="#0A292D"
                    />
                </View>

                <View style={styles.doneBadgeVat}>
                    <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                    <Text style={styles.doneText}>Done</Text>
                </View>
            </TouchableOpacity>

            {expanded && (
                <View style={styles.formSection}>
                    <View style={styles.inputRow}>
                        <Text style={styles.vatLabel}>VAT Mode</Text>
                        <View style={styles.inputChip}>
                            <Text style={styles.inputTextSmall}>Enter here...</Text>
                            <Ionicons name="chevron-down" size={16} color="#0A292D" />
                        </View>
                    </View>

                    <Text style={styles.noticeText}>
                        Recommended: If you don't have a Tax ID, use "Not Applicable" for frictionless selling
                    </Text>
                    <View style={styles.inputRow}>
                        <Text style={styles.inputLabel}>RFC (Tax ID)</Text>
                        <TextInput
                            style={styles.inputField}
                            placeholder="Enter RFC"
                            placeholderTextColor="#7D8A8C"
                            value={rfc}
                            onChangeText={setRfc}
                            autoCapitalize="characters"
                        />
                    </View>
                    <View style={styles.inputRow}>
                        <Text style={styles.inputLabel}>Fiscal regime</Text>
                        <InlineDropdown
                            options={fiscalRegimeOptions}
                            value={selectedRegime}
                            onSelect={(value) => setSelectedRegime(value)}
                            placeholder="Select fiscal regime"
                            style={{
                                container: { flex: 1 },
                            }}
                        />
                    </View>
                </View>
            )}
        </View>
    );
}
