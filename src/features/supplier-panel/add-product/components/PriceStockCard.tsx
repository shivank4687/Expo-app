import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/features/supplier-panel/styles';
import { Dropdown } from '@/features/supplier-panel/components';

const CURRENCY_OPTIONS = [
    { label: 'USD ($)', value: 'usd' },
    { label: 'MXN (MX$)', value: 'mxn' },
    { label: 'EUR (€)', value: 'eur' },
];

const UNIT_OPTIONS = [
    { label: 'Piece', value: 'piece' },
    { label: 'Set', value: 'set' },
    { label: 'Box', value: 'box' },
    { label: 'Kg', value: 'kg' },
];

export default function PriceStockCard() {
    const [wholesalePrice, setWholesalePrice] = useState('');
    const [retailPrice, setRetailPrice] = useState('');
    const [skuCode, setSkuCode] = useState('');
    const [inStockEnabled, setInStockEnabled] = useState(false);
    const [stockQuantity, setStockQuantity] = useState('');
    const [stockUnit, setStockUnit] = useState('');
    const [madeToOrderEnabled, setMadeToOrderEnabled] = useState(false);
    const [madeToOrderQuantity, setMadeToOrderQuantity] = useState('');
    const [productionTime, setProductionTime] = useState('');
    const [discounts, setDiscounts] = useState('');
    const [minimumQuantity, setMinimumQuantity] = useState('');
    const [unitPriceWholesale, setUnitPriceWholesale] = useState('');

    return (
        <View style={styles.card}>
            {/* Card Title */}
            <Text style={styles.cardTitle}>2) Price & Stock</Text>

            {/* Pricing Section */}
            <View style={styles.section}>
                <View style={styles.inputGroup}>
                    <Text style={styles.sectionTitle}>Wholesale Price</Text>
                    <Dropdown
                        placeholder="Select currency..."
                        options={CURRENCY_OPTIONS}
                        value={wholesalePrice}
                        onSelect={setWholesalePrice}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.sectionTitle}>Retail Price</Text>
                    <Dropdown
                        placeholder="Select currency..."
                        options={CURRENCY_OPTIONS}
                        value={retailPrice}
                        onSelect={setRetailPrice}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.sectionTitle}>SKU Reference Code</Text>
                    <Dropdown
                        placeholder="Enter here..."
                        options={[]}
                        value={skuCode}
                        onSelect={setSkuCode}
                    />
                </View>
            </View>

            {/* In Stock Section */}
            <View style={styles.borderedSection}>
                <View style={styles.checkboxRow}>
                    <TouchableOpacity
                        style={styles.checkbox}
                        onPress={() => setInStockEnabled(!inStockEnabled)}
                    >
                        {inStockEnabled && <View style={styles.checkboxChecked} />}
                    </TouchableOpacity>
                    <View style={styles.checkboxContent}>
                        <Text style={styles.sectionTitle}>In Stock (Immediate Shipping)</Text>
                        <Text style={styles.tipText}>
                            A "4" icon will be displayed on the photo when Quantity {'>'}
                        </Text>
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.sectionTitle}>Quantity in Stock</Text>
                    <View style={styles.rowInputs}>
                        <TextInput
                            style={styles.halfInput}
                            placeholder="Enter here..."
                            placeholderTextColor="#666666"
                            value={stockQuantity}
                            onChangeText={setStockQuantity}
                            keyboardType="numeric"
                        />
                        <View style={{ flex: 1 }}>
                            <Dropdown
                                placeholder="Unit..."
                                options={UNIT_OPTIONS}
                                value={stockUnit}
                                onSelect={setStockUnit}
                            />
                        </View>
                    </View>
                </View>
            </View>

            {/* Made to Order Section */}
            <View style={styles.borderedSection}>
                <View style={styles.checkboxRow}>
                    <TouchableOpacity
                        style={styles.checkbox}
                        onPress={() => setMadeToOrderEnabled(!madeToOrderEnabled)}
                    >
                        {madeToOrderEnabled && <View style={styles.checkboxChecked} />}
                    </TouchableOpacity>
                    <View style={styles.checkboxContent}>
                        <Text style={styles.sectionTitle}>Made to Order (Made to Order) if necessary</Text>
                        <Text style={styles.tipText}>
                            If Quantity in Stock = 0 (or is insufficient), the buyer will see "Made to Order, production time." with the
                        </Text>
                    </View>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.sectionTitle}>Quantity (Made to Order)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter here..."
                        placeholderTextColor="#666666"
                        value={madeToOrderQuantity}
                        onChangeText={setMadeToOrderQuantity}
                        keyboardType="numeric"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.sectionTitle}>Production Time (days)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter here..."
                        placeholderTextColor="#666666"
                        value={productionTime}
                        onChangeText={setProductionTime}
                        keyboardType="numeric"
                    />
                </View>
            </View>

            {/* Discounts Section */}
            <View style={styles.section}>
                <View style={styles.inputGroup}>
                    <Text style={styles.sectionTitle}>Discounts (Optional)</Text>
                    <TextInput
                        style={styles.textArea}
                        placeholder="Enter here..."
                        placeholderTextColor="#666666"
                        value={discounts}
                        onChangeText={setDiscounts}
                        multiline
                        numberOfLines={2}
                    />
                </View>

                <TouchableOpacity style={styles.aiButton}>
                    <Text style={styles.buttonText}>Standard Price</Text>
                </TouchableOpacity>

                <Text style={styles.tipText}>
                    We recommend applying a progressive price based on quantities to encourage larger and recurring orders.
                </Text>
            </View>

            {/* Minimum Quantity Section */}
            <View style={styles.section}>
                <View style={styles.inputGroup}>
                    <Text style={styles.sectionTitle}>Minimum Quantity</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter here..."
                        placeholderTextColor="#666666"
                        value={minimumQuantity}
                        onChangeText={setMinimumQuantity}
                        keyboardType="numeric"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.sectionTitle}>Unit Price Wholesale</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter here..."
                        placeholderTextColor="#666666"
                        value={unitPriceWholesale}
                        onChangeText={setUnitPriceWholesale}
                        keyboardType="numeric"
                    />
                </View>

                <TouchableOpacity style={styles.aiButton}>
                    <Ionicons name="add" size={16} color="#000000" />
                    <Text style={styles.buttonText}>Add Tier</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
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
        width: '100%',
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 20,
        lineHeight: 24,
        color: '#000000',
    },
    section: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 8,
        width: '100%',
    },
    borderedSection: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 8,
        gap: 16,
        width: '100%',
        borderWidth: 1,
        borderColor: '#EEEEEF',
        borderRadius: 8,
    },
    inputGroup: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 8,
        width: '100%',
    },
    sectionTitle: {
        width: '100%',
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
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
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 16,
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
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 16,
        color: '#000000',
        textAlignVertical: 'top',
    },
    rowInputs: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        width: '100%',
    },
    halfInput: {
        flex: 1,
        height: 40,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 16,
        color: '#000000',
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        width: '100%',
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
        flexDirection: 'column',
        gap: 4,
    },
    tipText: {
        width: '100%',
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 14,
        lineHeight: 20,
        color: '#666666',
    },
    aiButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        gap: 8,
        width: '100%',
        height: 40,
        backgroundColor: COLORS.primaryLight,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 8,
    },
    buttonText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 16,
        color: '#000000',
    },
});
