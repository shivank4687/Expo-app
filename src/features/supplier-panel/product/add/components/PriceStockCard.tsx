import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/features/supplier-panel/styles';
import { Dropdown } from '@/features/supplier-panel/components';
import { forwardRef, useImperativeHandle } from 'react';
import { useFormValidation } from '@/shared/hooks/useFormValidation';

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

import { useAppSelector } from '@/store/hooks';

import { ProductAttribute } from '../api/product-attributes.api';

interface PriceTier {
    id: string;
    qty: string;
    price: string;
}

export interface PriceStockCardProps {
    productName: string;
    attributes: ProductAttribute[];
}

export interface PriceStockCardRef {
    getData: () => any;
    validate: () => boolean;
}

const PriceStockCard = forwardRef<PriceStockCardRef, PriceStockCardProps>(({ productName, attributes }, ref) => {
    const { supplier } = useAppSelector((state) => state.supplierAuth);
    const shopName = supplier?.company_name || '';

    // Unit options from attributes
    const dynamicUnitOptions = attributes.find(a => a.code === 'in_order_qty_type')?.options?.map(o => ({
        label: o.admin_name,
        value: o.id.toString() // Using option ID as value
    })) || UNIT_OPTIONS;

    // Helper to get SKU prefix
    const getSkuPrefix = () => {
        const shop = shopName.substring(0, 3).toUpperCase().padEnd(3, 'X');
        const prod = productName.substring(0, 2).toUpperCase().padEnd(2, 'X');
        return `${shop}-${prod}-`;
    };
    const [formData, setFormData] = useState({
        wholesalePrice: '',
        retailPrice: '',
        price: '',
        sku: '',
        immediateShipping: false,
        inOrOrderQty: '',
        inOrderQtyUnit: '',
        madeToOrderEnabled: false,
        madeToOrderQuantity: '',
        productionTime: '',
        discounts: '',
        manageStock: true,
        inventoryQty: '',
    });

    // Discount type state: 'percentage' or 'price'
    const [discountType, setDiscountType] = useState<'percentage' | 'price'>('percentage');

    // Pricing tiers state
    const [priceTiers, setPriceTiers] = useState<PriceTier[]>([
        { id: '1', qty: '', price: '' }
    ]);

    // Tier-specific errors: { [tierId]: { qty: string, price: string } }
    const [tierErrors, setTierErrors] = useState<Record<string, { qty?: string; price?: string }>>({});
    const [generalTierError, setGeneralTierError] = useState<string | null>(null);

    // Form validation
    const { errors, validate, clearError, setError } = useFormValidation({
        price: [
            { type: 'required', message: 'Price is required' },
            { type: 'pattern', value: /^\d+(\.\d{1,2})?$/, message: 'Price must be a valid number' }
        ],
        sku: [
            { type: 'required', message: 'SKU is required' }
        ],
    });

    // Helper to filter numeric input only
    const filterNumericInput = (value: string): string => {
        // Allow numbers and decimal point
        return value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    };

    const updateField = (field: keyof typeof formData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            clearError(field);
        }
    };

    // Validate discount based on type
    const validateDiscount = (newPrice?: string, newDiscountType?: 'percentage' | 'price') => {
        const discountValue = parseFloat(formData.discounts);
        const priceValue = parseFloat(newPrice !== undefined ? newPrice : formData.price);
        const currentDiscountType = newDiscountType !== undefined ? newDiscountType : discountType;

        if (!formData.discounts) {
            clearError('discounts');
            return true;
        }

        if (isNaN(discountValue)) {
            setError('discounts', 'Discount must be a valid number');
            return false;
        }

        if (currentDiscountType === 'percentage' && discountValue >= 100) {
            setError('discounts', 'Percentage discount must be less than 100%');
            return false;
        }

        if (currentDiscountType === 'price' && priceValue && discountValue >= priceValue) {
            setError('discounts', 'Price discount cannot be greater than the product price');
            return false;
        }

        clearError('discounts');
        return true;
    };

    // Tier management functions
    const addTier = () => {
        const newTier: PriceTier = {
            id: Date.now().toString(),
            qty: '',
            price: ''
        };
        setPriceTiers(prev => [...prev, newTier]);
    };

    const removeTier = (id: string) => {
        if (priceTiers.length > 1) {
            setPriceTiers(prev => prev.filter(tier => tier.id !== id));
            // Also clean up errors for this tier
            setTierErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[id];
                return newErrors;
            });
        }
    };

    const updateTier = (id: string, field: keyof PriceTier, value: string) => {
        setPriceTiers(prev => prev.map(tier =>
            tier.id === id ? { ...tier, [field]: value } : tier
        ));

        // Clear tier-specific error when user starts typing
        if (tierErrors[id]?.[field as 'qty' | 'price']) {
            setTierErrors(prev => ({
                ...prev,
                [id]: { ...prev[id], [field]: undefined }
            }));
        }

        // Check if any errors remain to clear general error
        const remainingErrors = Object.values({
            ...tierErrors,
            [id]: { ...tierErrors[id], [field]: undefined }
        }).some(err => err.qty || err.price);

        if (!remainingErrors) {
            setGeneralTierError(null);
        }
    };

    useImperativeHandle(ref, () => ({
        getData: () => {
            // Transform tiers into customer_group_prices format
            const customerGroupPrices: Record<string, any> = {};
            const validTiers = priceTiers.filter(tier => tier.qty && tier.price);

            validTiers.forEach((tier, index) => {
                customerGroupPrices[`price_${index}`] = {
                    customer_group_id: '', // Empty = applies to all customer groups
                    qty: tier.qty,
                    value_type: 'fixed',
                    value: tier.price
                };
            });

            return {
                wholesale_price: formData.wholesalePrice,
                retail_price: formData.retailPrice,
                price: formData.price,
                sku: getSkuPrefix() + formData.sku,
                immediate_shipping: formData.immediateShipping ? 1 : 0,
                in_order_qty: formData.inOrOrderQty,
                in_order_qty_type: formData.inOrderQtyUnit,
                made_to_order: formData.madeToOrderEnabled ? 1 : 0,
                made_to_order_qty: formData.madeToOrderQuantity,
                made_to_order_days: formData.productionTime,
                discounts: formData.discounts,
                discount_type: discountType, // 'percentage' or 'price'
                manage_stock: formData.manageStock ? 1 : 0,
                inventories: formData.inventoryQty ? { 1: formData.inventoryQty } : {},
                customer_group_prices: customerGroupPrices
            };
        },
        validate: () => {
            const isFormValid = validate(formData);
            const isDiscountValid = validateDiscount();

            // Validate Pricing Tiers
            const newTierErrors: Record<string, { qty?: string; price?: string }> = {};
            let hasTierError = false;

            priceTiers.forEach(tier => {
                const hasQty = !!tier.qty;
                const hasPrice = !!tier.price;

                if ((hasQty && !hasPrice) || (!hasQty && hasPrice)) {
                    newTierErrors[tier.id] = {
                        qty: !hasQty ? 'Qty required' : undefined,
                        price: !hasPrice ? 'Price required' : undefined
                    };
                    hasTierError = true;
                }
            });

            if (hasTierError) {
                setTierErrors(newTierErrors);
                setGeneralTierError('Please complete all partially filled pricing tiers.');
            } else {
                setTierErrors({});
                setGeneralTierError(null);
            }

            return isFormValid && isDiscountValid && !hasTierError;
        }
    }));

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
                        value={formData.wholesalePrice}
                        onSelect={(val) => updateField('wholesalePrice', val)}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.sectionTitle}>Retail Price</Text>
                    <Dropdown
                        placeholder="Select currency..."
                        options={CURRENCY_OPTIONS}
                        value={formData.retailPrice}
                        onSelect={(val) => updateField('retailPrice', val)}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.sectionTitle}>Price</Text>
                    <TextInput
                        style={[styles.input, errors.price && styles.inputError]}
                        placeholder="Price"
                        placeholderTextColor="#666666"
                        value={formData.price}
                        onChangeText={(val) => {
                            const newPrice = filterNumericInput(val);
                            updateField('price', newPrice);
                            // Re-validate discount if it exists, passing the new price
                            if (formData.discounts) {
                                setTimeout(() => validateDiscount(newPrice), 0);
                            }
                        }}
                        keyboardType="decimal-pad"
                    />
                    {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.sectionTitle}>SKU Reference Code</Text>
                    <View style={[styles.skuInputContainer, errors.sku && styles.inputError]}>
                        <View style={styles.skuPrefix}>
                            <Text style={styles.skuPrefixText}>{getSkuPrefix()}</Text>
                        </View>
                        <TextInput
                            style={styles.skuInput}
                            placeholder="sku"
                            placeholderTextColor="#666666"
                            value={formData.sku}
                            onChangeText={(val) => updateField('sku', val)}
                        />
                    </View>
                    {errors.sku && <Text style={styles.errorText}>{errors.sku}</Text>}
                </View>
            </View>

            {/* In Stock Section */}
            <View style={styles.borderedSection}>
                <View style={styles.checkboxRow}>
                    <TouchableOpacity
                        style={styles.checkbox}
                        onPress={() => updateField('immediateShipping', !formData.immediateShipping)}
                    >
                        {formData.immediateShipping && <View style={styles.checkboxChecked} />}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.checkboxContent}
                        onPress={() => updateField('immediateShipping', !formData.immediateShipping)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.sectionTitle}>In Stock (Immediate Shipping)</Text>
                        <Text style={styles.tipText}>
                            A "4" icon will be displayed on the photo when Quantity {'>'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.sectionTitle}>Quantity in Stock</Text>
                    <View style={styles.rowInputs}>
                        <TextInput
                            style={styles.halfInput}
                            placeholder="Quantity"
                            placeholderTextColor="#666666"
                            value={formData.inOrOrderQty}
                            onChangeText={(val) => updateField('inOrOrderQty', filterNumericInput(val))}
                            keyboardType="decimal-pad"
                        />
                        <View style={{ flex: 1 }}>
                            <Dropdown
                                placeholder="Unit"
                                options={dynamicUnitOptions}
                                value={formData.inOrderQtyUnit}
                                onSelect={(val) => updateField('inOrderQtyUnit', val)}
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
                        onPress={() => updateField('madeToOrderEnabled', !formData.madeToOrderEnabled)}
                    >
                        {formData.madeToOrderEnabled && <View style={styles.checkboxChecked} />}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.checkboxContent}
                        onPress={() => updateField('madeToOrderEnabled', !formData.madeToOrderEnabled)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.sectionTitle}>Made to Order (Made to Order) if necessary</Text>
                        <Text style={styles.tipText}>
                            If Quantity in Stock = 0 (or is insufficient), the buyer will see "Made to Order, production time." with the
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.sectionTitle}>Quantity (Made to Order)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Quantity"
                        placeholderTextColor="#666666"
                        value={formData.madeToOrderQuantity}
                        onChangeText={(val) => updateField('madeToOrderQuantity', filterNumericInput(val))}
                        keyboardType="decimal-pad"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.sectionTitle}>Production Time (days)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Production Time"
                        placeholderTextColor="#666666"
                        value={formData.productionTime}
                        onChangeText={(val) => updateField('productionTime', filterNumericInput(val))}
                        keyboardType="decimal-pad"
                    />
                </View>
            </View>

            {/* Manage Stock Section */}
            <View style={styles.borderedSection}>
                <View style={styles.checkboxRow}>
                    <TouchableOpacity
                        style={styles.checkbox}
                        onPress={() => updateField('manageStock', !formData.manageStock)}
                    >
                        {formData.manageStock && <View style={styles.checkboxChecked} />}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.checkboxContent}
                        onPress={() => updateField('manageStock', !formData.manageStock)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.sectionTitle}>Manage Stock</Text>
                        <Text style={styles.tipText}>
                            Enable inventory tracking for this product.
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.sectionTitle}>Inventory Quantity</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Stock Quantity"
                        placeholderTextColor="#666666"
                        value={formData.inventoryQty}
                        onChangeText={(val) => updateField('inventoryQty', filterNumericInput(val))}
                        keyboardType="decimal-pad"
                    />
                </View>
            </View>

            {/* Discounts Section */}
            <View style={styles.section}>
                <View style={styles.inputGroup}>
                    <Text style={styles.sectionTitle}>Discounts (Optional)</Text>
                    <View style={[styles.discountInputContainer, errors.discounts && styles.inputError]}>
                        <TextInput
                            style={styles.discountInput}
                            placeholder="Enter discount value"
                            placeholderTextColor="#666666"
                            value={formData.discounts}
                            onChangeText={(val) => {
                                updateField('discounts', filterNumericInput(val));
                            }}
                            onBlur={() => validateDiscount()}
                            keyboardType="decimal-pad"
                        />
                        <TouchableOpacity
                            style={styles.discountToggle}
                            onPress={() => {
                                const newType = discountType === 'percentage' ? 'price' : 'percentage';
                                setDiscountType(newType);
                                // Re-validate when toggle changes with the new type
                                setTimeout(() => validateDiscount(undefined, newType), 0);
                            }}
                        >
                            <Text style={styles.discountToggleText}>
                                {discountType === 'percentage' ? '%' : '$'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    {errors.discounts && <Text style={styles.errorText}>{errors.discounts}</Text>}
                </View>

                <TouchableOpacity style={styles.aiButton}>
                    <Text style={styles.buttonText}>Standard Price</Text>
                </TouchableOpacity>

                <Text style={styles.tipText}>
                    We recommend applying a progressive price based on quantities to encourage larger and recurring orders.
                </Text>
            </View>

            {/* Pricing Tiers Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pricing Tiers</Text>

                {/* Column Headers */}
                <View style={styles.tierHeaderRow}>
                    <Text style={styles.tierHeaderText}>Minimum Quantity</Text>
                    <Text style={styles.tierHeaderText}>Unit Price Wholesale</Text>
                    {priceTiers.length > 1 && <View style={styles.headerSpacer} />}
                </View>

                {/* Tier Rows */}
                {priceTiers.map((tier, index) => (
                    <View key={tier.id} style={styles.tierContainer}>
                        <View style={styles.tierRow}>
                            <TextInput
                                style={[styles.tierInput, tierErrors[tier.id]?.qty && styles.inputError]}
                                placeholder="Quantity"
                                placeholderTextColor="#666666"
                                value={tier.qty}
                                onChangeText={(val) => updateTier(tier.id, 'qty', filterNumericInput(val))}
                                keyboardType="decimal-pad"
                            />
                            <TextInput
                                style={[styles.tierInput, tierErrors[tier.id]?.price && styles.inputError]}
                                placeholder="Unit Price Wholesale"
                                placeholderTextColor="#666666"
                                value={tier.price}
                                onChangeText={(val) => updateTier(tier.id, 'price', filterNumericInput(val))}
                                keyboardType="decimal-pad"
                            />
                            {priceTiers.length > 1 && (
                                <TouchableOpacity
                                    style={styles.removeTierButton}
                                    onPress={() => removeTier(tier.id)}
                                >
                                    <Ionicons name="close-circle" size={24} color="#666666" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                ))}

                {generalTierError && (
                    <Text style={styles.errorText}>{generalTierError}</Text>
                )}

                <TouchableOpacity
                    style={styles.aiButton}
                    onPress={addTier}
                >
                    <Ionicons name="add" size={16} color="#000000" />
                    <Text style={styles.buttonText}>Add Tier</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
});

export default PriceStockCard;

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
        paddingVertical: 10,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
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
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 16,
        color: '#000000',
        textAlignVertical: 'top',
    },
    skuInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        height: 40,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
        overflow: 'hidden',
    },
    skuPrefix: {
        paddingHorizontal: 12,
        height: '100%',
        justifyContent: 'center',
        backgroundColor: '#E5E5E5',
        borderRightWidth: 1,
        borderRightColor: '#D1D1D1',
    },
    skuPrefixText: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 14,
        color: '#666666',
    },
    skuInput: {
        flex: 1,
        height: '100%',
        paddingHorizontal: 12,
        fontFamily: 'Inter',
        fontSize: 16,
        color: '#000000',
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
        paddingVertical: 10,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 16,
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
    tierContainer: {
        width: '100%',
        marginBottom: 8,
    },
    tierRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        width: '100%',
    },
    tierInput: {
        flex: 1,
        height: 40,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 16,
        color: '#000000',
    },
    removeTierButton: {
        padding: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tierHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        marginBottom: 4,
    },
    tierHeaderText: {
        flex: 1,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 14,
        lineHeight: 17,
        color: '#666666',
    },
    headerSpacer: {
        width: 32, // Same width as remove button (24px icon + 8px padding)
    },
    inputError: {
        borderWidth: 1,
        borderColor: '#EF4444', // Lighter red to match EssentialCard
    },
    errorText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 12,
        lineHeight: 16,
        color: '#DC2626',
        marginTop: 4,
    },
    discountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        height: 40,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
        overflow: 'hidden',
    },
    discountInput: {
        flex: 1,
        height: '100%',
        paddingHorizontal: 16,
        fontFamily: 'Inter',
        fontSize: 16,
        color: '#000000',
    },
    discountToggle: {
        paddingHorizontal: 20,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        borderLeftWidth: 1,
        borderLeftColor: '#D1D1D1',
    },
    discountToggleText: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 18,
        color: '#FFFFFF',
    },
});
