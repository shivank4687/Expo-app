import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/features/supplier-panel/styles';
import { Dropdown } from '@/features/supplier-panel/components';
import { AiIcon } from '@/assets/icons';

const VARIANT_VALUES = ['S', 'M', 'L', 'XL'];
const VARIANT_GROUP_OPTIONS = [
    { label: 'Size', value: 'size' },
    { label: 'Color', value: 'color' },
    { label: 'Material', value: 'material' },
];

export default function PriceStockVariantsCard() {
    const [variantGroup, setVariantGroup] = useState('');
    const [selectedValues, setSelectedValues] = useState<string[]>([]);
    const [selectedMainVariant, setSelectedMainVariant] = useState<string | null>(null);
    const [inStockEnabled, setInStockEnabled] = useState(false);
    const [madeToOrderEnabled, setMadeToOrderEnabled] = useState(false);

    const toggleValue = (value: string) => {
        setSelectedValues(prev =>
            prev.includes(value)
                ? prev.filter(v => v !== value)
                : [...prev, value]
        );
    };

    return (
        <View style={styles.card}>
            {/* Card Title */}
            <Text style={styles.cardTitle}>2) Price & Stock & Variants</Text>

            {/* Variant Group Section */}
            <View style={styles.section}>
                <View style={styles.inputGroup}>
                    <Text style={styles.sectionTitle}>Variant Group</Text>
                    <Text style={styles.tipText}>Choose or create your group.</Text>
                    <Dropdown
                        placeholder="Enter here..."
                        options={VARIANT_GROUP_OPTIONS}
                        value={variantGroup}
                        onSelect={setVariantGroup}
                    />
                </View>

                <TouchableOpacity style={styles.aiButton}>
                    <Ionicons name="add" size={16} color="#000000" />
                    <Text style={styles.buttonText}>Create</Text>
                </TouchableOpacity>
            </View>

            {/* Values Section */}
            <View style={styles.section}>
                <View style={styles.valuesHeader}>
                    <Text style={styles.sectionTitle}>Values</Text>
                    <Text style={styles.tipText}>Tap a value to edit its variant.</Text>
                </View>

                <View style={styles.chipsContainer}>
                    {VARIANT_VALUES.map((value, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.chip,
                                selectedValues.includes(value) && styles.chipActive
                            ]}
                            onPress={() => toggleValue(value)}
                        >
                            <Text style={styles.chipText}>{value}</Text>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity style={styles.addChipButton}>
                        <Ionicons name="add" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.aiButton}>
                    <AiIcon width={16} height={16} color="#000000" />
                    <Text style={styles.buttonText}>Suggest values with AI</Text>
                </TouchableOpacity>

                <Text style={styles.tipText}>
                    Fill in SKU, suggest category, generate a short description, and activate the shipping calculation (preview).
                </Text>
            </View>

            {/* Main Variant Editor */}
            <View style={styles.section}>
                <View style={styles.valuesHeader}>
                    <Text style={styles.sectionTitle}>Main Variant Editor (first selected)</Text>
                    <Text style={styles.tipText}>Wholesale Price Retail Price Reference</Text>
                </View>

                <View style={styles.variantRow}>
                    {VARIANT_VALUES.map((value, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.variantChip,
                                selectedMainVariant === value && styles.chipActive
                            ]}
                            onPress={() => setSelectedMainVariant(value)}
                        >
                            <Text style={styles.chipText}>{value}</Text>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity style={styles.iconButton}>
                        <Ionicons name="copy-outline" size={16} color="#000000" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteButton}>
                        <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Size and Weight */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Size and Weight</Text>
                <View style={styles.gridInputs}>
                    <TextInput style={styles.gridInput} placeholder="Enter here..." placeholderTextColor="#666666" />
                    <TextInput style={styles.gridInput} placeholder="Enter here..." placeholderTextColor="#666666" />
                    <TextInput style={styles.gridInput} placeholder="Enter here..." placeholderTextColor="#666666" />
                    <TextInput style={styles.gridInput} placeholder="Enter here..." placeholderTextColor="#666666" />
                </View>
            </View>

            {/* In Stock Section */}
            <View style={styles.borderedSection}>
                <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => setInStockEnabled(!inStockEnabled)}
                    activeOpacity={0.7}
                >
                    <View style={styles.checkbox}>
                        {inStockEnabled && <View style={styles.checkboxChecked} />}
                    </View>
                    <View style={styles.checkboxContent}>
                        <Text style={styles.sectionTitle}>In Stock (Immediate Shipping)</Text>
                        <Text style={styles.tipText}>A "4" icon will be displayed on the photo when Quantity {'>'}</Text>
                    </View>
                </TouchableOpacity>
                <View style={styles.inputGroup}>
                    <Text style={styles.sectionTitle}>Quantity in Stock</Text>
                    <View style={styles.rowInputs}>
                        <TextInput style={styles.halfInput} placeholder="Enter here..." placeholderTextColor="#666666" />
                        <View style={{ flex: 1 }}>
                            <Dropdown placeholder="Unit..." options={[]} value="" onSelect={() => { }} />
                        </View>
                    </View>
                </View>
            </View>

            {/* Made to Order Section */}
            <View style={styles.borderedSection}>
                <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => setMadeToOrderEnabled(!madeToOrderEnabled)}
                    activeOpacity={0.7}
                >
                    <View style={styles.checkbox}>
                        {madeToOrderEnabled && <View style={styles.checkboxChecked} />}
                    </View>
                    <View style={styles.checkboxContent}>
                        <Text style={styles.sectionTitle}>Made to Order (Made to Order) if necessary</Text>
                        <Text style={styles.tipText}>If Quantity in Stock = 0 (or insufficient), the buyer will see "Made to Order" with the production time.</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Discounts */}
            <View style={styles.section}>
                <View style={styles.inputGroup}>
                    <Text style={styles.sectionTitle}>Discounts (Optional)</Text>
                    <TextInput style={styles.textArea} placeholder="Enter here..." placeholderTextColor="#666666" multiline />
                </View>
                <TouchableOpacity style={styles.aiButton}>
                    <Text style={styles.buttonText}>Add Variant Discount</Text>
                </TouchableOpacity>
            </View>

            {/* Variant Editor */}
            <View style={styles.section}>
                <View style={styles.valuesHeader}>
                    <Text style={styles.sectionTitle}>Variant Editor</Text>
                    <Text style={styles.tipText}>Select if different from the first variant sku/B2C/DISCOUNTS/made to order</Text>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.sectionTitle}>Size</Text>
                    <TextInput style={styles.input} placeholder="Enter here..." placeholderTextColor="#666666" />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.sectionTitle}>Stock</Text>
                    <TextInput style={styles.input} placeholder="Enter here..." placeholderTextColor="#666666" />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.sectionTitle}>Wholesale price</Text>
                    <TextInput style={styles.input} placeholder="Enter here..." placeholderTextColor="#666666" />
                </View>

                <View style={styles.photoRow}>
                    <TouchableOpacity style={styles.photoButton}>
                        <Ionicons name="camera-outline" size={16} color="#666666" />
                        <Text style={styles.photoButtonText}>Take photo (app)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteButton}>
                        <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Size and Weight</Text>
                    <View style={styles.gridInputs}>
                        <TextInput style={styles.gridInput} placeholder="Enter here..." placeholderTextColor="#666666" />
                        <TextInput style={styles.gridInput} placeholder="Enter here..." placeholderTextColor="#666666" />
                        <TextInput style={styles.gridInput} placeholder="Enter here..." placeholderTextColor="#666666" />
                        <TextInput style={styles.gridInput} placeholder="Enter here..." placeholderTextColor="#666666" />
                    </View>
                </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Second Variant Editor */}
            <View style={styles.section}>
                <View style={styles.inputGroup}>
                    <Text style={styles.sectionTitle}>Size</Text>
                    <TextInput style={styles.input} placeholder="Enter here..." placeholderTextColor="#666666" />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.sectionTitle}>Stock</Text>
                    <TextInput style={styles.input} placeholder="Enter here..." placeholderTextColor="#666666" />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.sectionTitle}>Wholesale price</Text>
                    <TextInput style={styles.input} placeholder="Enter here..." placeholderTextColor="#666666" />
                </View>

                <View style={styles.photoRow}>
                    <TouchableOpacity style={styles.photoButton}>
                        <Ionicons name="camera-outline" size={16} color="#666666" />
                        <Text style={styles.photoButtonText}>Take photo (app)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteButton}>
                        <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Size and Weight</Text>
                    <View style={styles.gridInputs}>
                        <TextInput style={styles.gridInput} placeholder="Enter here..." placeholderTextColor="#666666" />
                        <TextInput style={styles.gridInput} placeholder="Enter here..." placeholderTextColor="#666666" />
                        <TextInput style={styles.gridInput} placeholder="Enter here..." placeholderTextColor="#666666" />
                        <TextInput style={styles.gridInput} placeholder="Enter here..." placeholderTextColor="#666666" />
                    </View>
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.tipText}>The photo is optional. If not, the product cover is used.</Text>
                <TouchableOpacity style={styles.publishButton}>
                    <Text style={styles.publishButtonText}>Apply</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'column',
        padding: 16,
        gap: 16,
        width: '100%',
        backgroundColor: COLORS.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
        borderRadius: 16,
    },
    cardTitle: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 20,
        lineHeight: 24,
        color: '#000000',
    },
    section: {
        flexDirection: 'column',
        gap: 8,
        width: '100%',
    },
    inputGroup: {
        flexDirection: 'column',
        gap: 8,
        width: '100%',
    },
    sectionTitle: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
    },
    tipText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 14,
        lineHeight: 20,
        color: '#666666',
    },
    valuesHeader: {
        flexDirection: 'column',
        gap: 4,
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        height: 40,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chipActive: {
        backgroundColor: COLORS.primaryLight,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    chipText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 16,
        color: '#666666',
    },
    addChipButton: {
        width: 40,
        height: 40,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    variantRow: {
        flexDirection: 'row',
        gap: 8,
    },
    variantChip: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        height: 40,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconButton: {
        width: 40,
        height: 40,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteButton: {
        width: 40,
        height: 40,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gridInputs: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    gridInput: {
        width: '48.5%',
        height: 40,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontFamily: 'Inter',
        fontSize: 16,
        color: '#000000',
    },
    input: {
        width: '100%',
        height: 40,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontFamily: 'Inter',
        fontSize: 16,
        color: '#000000',
    },
    textArea: {
        width: '100%',
        height: 56,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontFamily: 'Inter',
        fontSize: 16,
        color: '#000000',
        textAlignVertical: 'top',
    },
    halfInput: {
        flex: 1,
        height: 40,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    rowInputs: {
        flexDirection: 'row',
        gap: 8,
    },
    borderedSection: {
        flexDirection: 'column',
        padding: 8,
        gap: 16,
        borderWidth: 1,
        borderColor: '#EEEEEF',
        borderRadius: 8,
    },
    checkboxRow: {
        flexDirection: 'row',
        gap: 8,
    },
    checkbox: {
        width: 16,
        height: 16,
        backgroundColor: '#EEEEEF',
        borderWidth: 1,
        borderColor: '#666666',
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        width: 10,
        height: 10,
        backgroundColor: COLORS.primary,
        borderRadius: 2,
    },
    checkboxContent: {
        flex: 1,
        gap: 4,
    },
    aiButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        gap: 8,
        height: 40,
        backgroundColor: COLORS.primaryLight,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 8,
    },
    buttonText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 16,
        color: '#000000',
    },
    photoRow: {
        flexDirection: 'row',
        gap: 8,
    },
    photoButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        gap: 10,
        height: 40,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
    },
    photoButtonText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 16,
        color: '#666666',
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: '#EEEEEF',
    },
    footer: {
        flexDirection: 'column',
        gap: 8,
    },
    publishButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        height: 40,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
    },
    publishButtonText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 16,
        color: '#F5F5F5',
    },
});
