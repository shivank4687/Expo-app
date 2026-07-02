import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/features/supplier-panel/styles';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { parseValidDate } from '@/shared/utils/dateUtils';
import { ToggleSlider } from '@/shared/components/ToggleSlider';

interface BuyerSpendDiscount {
    id: string;
    amount: string;
    discount_percentage: string;
    max_discount_amount: string;
}

interface SalesShippingCardProps {
    data: any;
    onChange: (field: string, value: any) => void;
    errors?: Record<string, string>;
}

export const SalesShippingCard: React.FC<SalesShippingCardProps> = ({ data, onChange, errors }) => {
    const [buyerSpendDiscounts, setBuyerSpendDiscounts] = useState<BuyerSpendDiscount[]>([]);
    const [showHolidayStartPicker, setShowHolidayStartPicker] = useState(false);
    const [showHolidayEndPicker, setShowHolidayEndPicker] = useState(false);
    const [showDiscountStartPicker, setShowDiscountStartPicker] = useState(false);
    const [showDiscountEndPicker, setShowDiscountEndPicker] = useState(false);
    const [showReturnPolicyModal, setShowReturnPolicyModal] = useState(false);

    // Initialize buyer spend discounts from data
    useEffect(() => {
        if (data?.buyer_spend_discounts && Array.isArray(data.buyer_spend_discounts)) {
            setBuyerSpendDiscounts(data.buyer_spend_discounts.map((d: any, index: number) => ({
                id: d.id || `discount-${index}`,
                amount: d.amount?.toString() || '',
                discount_percentage: d.discount_percentage?.toString() || '',
                max_discount_amount: d.max_discount_amount?.toString() || ''
            })));
        }
    }, [data?.buyer_spend_discounts]);

    const handleAddDiscount = () => {
        const newDiscount: BuyerSpendDiscount = {
            id: `discount-${Date.now()}`,
            amount: '',
            discount_percentage: '',
            max_discount_amount: ''
        };
        const updated = [...buyerSpendDiscounts, newDiscount];
        setBuyerSpendDiscounts(updated);
        onChange('buyer_spend_discounts', updated);
    };

    const handleRemoveDiscount = (id: string) => {
        const updated = buyerSpendDiscounts.filter(d => d.id !== id);
        setBuyerSpendDiscounts(updated);
        onChange('buyer_spend_discounts', updated);
    };

    const handleDiscountChange = (id: string, field: keyof BuyerSpendDiscount, value: string) => {
        const updated = buyerSpendDiscounts.map(d =>
            d.id === id ? { ...d, [field]: value } : d
        );
        setBuyerSpendDiscounts(updated);
        onChange('buyer_spend_discounts', updated);
    };

    const formatDate = (dateString?: string) => {
        const date = parseValidDate(dateString);
        return date ? date.toLocaleDateString() : '';
    };

    const holidayStartDate = parseValidDate(data?.holiday_start_date);
    const holidayEndDate = parseValidDate(data?.holiday_end_date);
    const discountSpecialStartDate = parseValidDate(data?.discount_special_start_date);
    const discountSpecialEndDate = parseValidDate(data?.discount_special_end_date);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Sales Shipping</Text>

            {/* Minimum order */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Minimum order</Text>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter minimum order amount"
                        placeholderTextColor="#666666"
                        keyboardType="numeric"
                        value={data?.minimum_order_amount?.toString() || ''}
                        onChangeText={(value) => onChange('minimum_order_amount', value ? parseFloat(value) : null)}
                        textContentType="none"
                        autoComplete="off"
                    />
                </View>
                <Text style={styles.description}>Set a minimum order amount required to place an order</Text>
            </View>

            {/* Free shipping */}
            <View style={styles.fieldContainer}>
                <View style={styles.rowSpaceBetween}>
                    <Text style={styles.label}>Free shipping</Text>
                    <ToggleSlider
                        isActive={!!data?.free_shipping_enabled}
                        onToggle={() => onChange('free_shipping_enabled', !data?.free_shipping_enabled)}
                    />
                </View>
                <Text style={styles.description}>Enable free shipping for orders above a certain amount</Text>
            </View>

            {/* Free shipping starting at */}
            {data?.free_shipping_enabled && (
                <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Free shipping starting at</Text>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter free shipping threshold"
                            placeholderTextColor="#666666"
                            keyboardType="numeric"
                            value={data?.free_shipping_threshold?.toString() || ''}
                            onChangeText={(value) => onChange('free_shipping_threshold', value ? parseFloat(value) : null)}
                            textContentType="none"
                            autoComplete="off"
                        />
                    </View>
                    <Text style={styles.description}>Free shipping applies when cart total reaches this amount</Text>
                </View>
            )}

            {/* Preparation time */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Preparation time (days)</Text>
                <Text style={styles.description}>Faster is better, but guaranteed (max 10 days)</Text>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter preparation time"
                        placeholderTextColor="#666666"
                        keyboardType="numeric"
                        value={data?.preparation_time_days?.toString() || ''}
                        onChangeText={(value) => {
                            if (!value) {
                                onChange('preparation_time_days', null);
                                return;
                            }
                            // Strip non-numeric characters
                            const numericString = value.replace(/[^0-9]/g, '');
                            if (!numericString) return;
                            
                            const numValue = parseInt(numericString, 10);
                            // Must be > 0 and <= 10
                            if (numValue === 0 || numValue > 10) return;
                            
                            onChange('preparation_time_days', numValue);
                        }}
                        textContentType="none"
                        autoComplete="off"
                    />
                </View>
                {errors?.preparation_time_days && (
                    <Text style={styles.errorText}>{errors.preparation_time_days}</Text>
                )}
            </View>

            {/* Standard delivery days */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Standard delivery days</Text>
                <Text style={styles.description}>Estimated number of days for standard delivery to the customer</Text>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter standard delivery days"
                        placeholderTextColor="#666666"
                        keyboardType="numeric"
                        value={data?.standard_delivery_days?.toString() || ''}
                        onChangeText={(value) => {
                            if (!value) {
                                onChange('standard_delivery_days', null);
                                return;
                            }
                            const numericString = value.replace(/[^0-9]/g, '');
                            if (!numericString) return;
                            const numValue = parseInt(numericString, 10);
                            if (numValue === 0) return;
                            onChange('standard_delivery_days', numValue);
                        }}
                        textContentType="none"
                        autoComplete="off"
                    />
                </View>
            </View>

            {/* Automatic validation - Radio buttons */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Order Validation Mode</Text>

                <TouchableOpacity
                    style={styles.radioRow}
                    onPress={() => onChange('automatic_validation_enabled', true)}
                >
                    <View style={styles.radioOuter}>
                        {data?.automatic_validation_enabled !== false && (
                            <View style={styles.radioInner} />
                        )}
                    </View>
                    <View style={styles.flex1}>
                        <Text style={styles.radioLabel}>Automatic validation (recommended)</Text>
                        <Text style={styles.description}>
                            The order is confirmed instantly. Better ranking + more sales.
                        </Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.radioRow}
                    onPress={() => onChange('automatic_validation_enabled', false)}
                >
                    <View style={styles.radioOuter}>
                        {data?.automatic_validation_enabled === false && (
                            <View style={styles.radioInner} />
                        )}
                    </View>
                    <View style={styles.flex1}>
                        <Text style={styles.radioLabel}>To be approved</Text>
                        <Text style={styles.description}>
                            You receive a message with the list: you can remove out-of-stock items and adjust quantities.
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Special Sales Section */}
            <View style={styles.specialSalesContainer}>
                <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => onChange('special_price_from_wholesale', !data?.special_price_from_wholesale)}
                >
                    <View style={styles.checkbox}>
                        {data?.special_price_from_wholesale && (
                            <Ionicons name="checkmark" size={12} color="#00615E" />
                        )}
                    </View>
                    <View style={styles.flex1}>
                        <Text style={styles.label}>Activate special sales</Text>
                        <Text style={styles.description}>
                            The special price is calculated from the wholesale price
                        </Text>
                    </View>
                </TouchableOpacity>

                {data?.special_price_from_wholesale && (
                    <View style={styles.multiplierContainer}>
                        <View style={styles.rowSpaceBetween}>
                            <Text style={styles.label}>Multiplier</Text>
                            {/* <Text style={styles.description}>Default x2</Text> */}
                        </View>
                        <View style={styles.multiplierInputContainer}>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter multiplier"
                                placeholderTextColor="#666666"
                                keyboardType="numeric"
                                value={data?.wholesale_price_multiplier?.toString() || ''}
                                onChangeText={(value) => onChange('wholesale_price_multiplier', value ? parseFloat(value) : null)}
                                textContentType="none"
                                autoComplete="off"
                            />
                        </View>
                    </View>
                )}
            </View>

            {/* Returns policy */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Returns policy</Text>
                <TouchableOpacity
                    style={styles.inputContainer}
                    onPress={() => setShowReturnPolicyModal(true)}
                >
                    <Text style={[styles.input, { color: data?.return_policy_days ? '#000000' : '#666666' }]}>
                        {data?.return_policy_days === 0 ? 'No returns' : data?.return_policy_days ? `${data.return_policy_days} days` : 'Select return policy'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#666666" />
                </TouchableOpacity>
                <Text style={styles.description}>More trust, more orders. (Options: 7, 14, 30, 60, 90 days, or No returns)</Text>
            </View>

            {/* Custom orders */}
            <View style={styles.fieldContainer}>
                <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => onChange('custom_orders_enabled', !data?.custom_orders_enabled)}
                >
                    <View style={styles.checkbox}>
                        {data?.custom_orders_enabled && (
                            <Ionicons name="checkmark" size={12} color="#00615E" />
                        )}
                    </View>
                    <View style={styles.flex1}>
                        <Text style={styles.label}>Accept custom orders</Text>
                        <Text style={styles.description}>
                            If enabled, customers can submit custom order requests
                        </Text>
                    </View>
                </TouchableOpacity>

                {data?.custom_orders_enabled && (
                    <View style={[styles.inputContainerLarge, { marginTop: 8 }]}>
                        <TextInput
                            style={styles.inputLarge}
                            placeholder="Enter custom order message"
                            placeholderTextColor="#666666"
                            value={data?.custom_order_message || ''}
                            onChangeText={(value) => onChange('custom_order_message', value)}
                            multiline
                            textAlignVertical="top"
                            textContentType="none"
                            autoComplete="off"
                        />
                    </View>
                )}
            </View>

            {/* Buyer Spend Discounts */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Discounts for buyer spend</Text>
                <Text style={styles.description}>
                    Offer discounts based on customer's total purchase amount
                </Text>

                {buyerSpendDiscounts.map((discount, index) => (
                    <View key={discount.id} style={styles.discountEntryContainer}>
                        <View style={styles.discountEntryHeader}>
                            <Text style={styles.discountEntryTitle}>Discount {index + 1}</Text>
                            <TouchableOpacity onPress={() => handleRemoveDiscount(discount.id)}>
                                <Ionicons name="trash-outline" size={20} color="#FF0000" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.discountRowContainer}>
                            <View style={styles.discountInputHalf}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Amount"
                                    placeholderTextColor="#666666"
                                    keyboardType="numeric"
                                    value={discount.amount}
                                    onChangeText={(value) => handleDiscountChange(discount.id, 'amount', value)}
                                    textContentType="none"
                                    autoComplete="off"
                                />
                            </View>

                            <View style={styles.discountInputHalf}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Discount"
                                    placeholderTextColor="#666666"
                                    keyboardType="numeric"
                                    value={discount.discount_percentage}
                                    onChangeText={(value) => handleDiscountChange(discount.id, 'discount_percentage', value)}
                                    textContentType="none"
                                    autoComplete="off"
                                />
                                <Text style={styles.percentageSymbol}>%</Text>
                            </View>
                        </View>
                        {errors?.[`buyer_spend_discount_${index}`] && (
                            <Text style={styles.errorText}>{errors[`buyer_spend_discount_${index}`]}</Text>
                        )}
                    </View>
                ))}

                <TouchableOpacity style={styles.addButton} onPress={handleAddDiscount}>
                    <Ionicons name="add" size={20} color="#00615E" />
                    <Text style={styles.addButtonText}>Add Discount Tier</Text>
                </TouchableOpacity>
            </View>

            {/* Holiday Period */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Holiday Period</Text>
                <Text style={styles.description}>Shop will be in closed state during this period</Text>

                <View style={styles.dateRowContainer}>
                    <TouchableOpacity
                        style={styles.dateInputHalf}
                        onPress={() => setShowHolidayStartPicker(true)}
                    >
                        <Text style={[styles.dateInputText, { color: holidayStartDate ? '#000000' : '#666666' }]} numberOfLines={1}>
                            {holidayStartDate ? formatDate(data?.holiday_start_date) : 'Start date'}
                        </Text>
                        {holidayStartDate ? (
                            <TouchableOpacity
                                onPress={(e) => {
                                    e.stopPropagation();
                                    onChange('holiday_start_date', null);
                                }}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons name="close-circle" size={16} color="#666666" />
                            </TouchableOpacity>
                        ) : (
                            <Ionicons name="calendar-outline" size={16} color="#666666" />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.dateInputHalf}
                        onPress={() => setShowHolidayEndPicker(true)}
                    >
                        <Text style={[styles.dateInputText, { color: holidayEndDate ? '#000000' : '#666666' }]} numberOfLines={1}>
                            {holidayEndDate ? formatDate(data?.holiday_end_date) : 'End date'}
                        </Text>
                        {holidayEndDate ? (
                            <TouchableOpacity
                                onPress={(e) => {
                                    e.stopPropagation();
                                    onChange('holiday_end_date', null);
                                }}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons name="close-circle" size={16} color="#666666" />
                            </TouchableOpacity>
                        ) : (
                            <Ionicons name="calendar-outline" size={16} color="#666666" />
                        )}
                    </TouchableOpacity>
                </View>
                {errors?.holiday_end_date && (
                    <Text style={styles.errorText}>{errors.holiday_end_date}</Text>
                )}
            </View>

            {/* Discount Special Time */}
            <View style={styles.fieldContainer}>
                <Text style={styles.label}>Discount Special Time</Text>
                <Text style={styles.description}>Apply discount percentage on all store items for a limited time</Text>

                <View style={styles.dateRowContainer}>
                    <View style={styles.dateInputHalf}>
                        <TextInput
                            style={styles.input}
                            placeholder="Discount"
                            placeholderTextColor="#666666"
                            keyboardType="numeric"
                            value={data?.discount_special_percentage?.toString() || ''}
                            onChangeText={(value) => onChange('discount_special_percentage', value ? parseFloat(value) : null)}
                            textContentType="none"
                            autoComplete="off"
                        />
                        <Text style={styles.percentageSymbol}>%</Text>
                    </View>

                    <View style={styles.dateInputHalf}>
                        <TextInput
                            style={styles.input}
                            placeholder="Max amount"
                            placeholderTextColor="#666666"
                            keyboardType="numeric"
                            value={data?.discount_special_max_amount?.toString() || ''}
                            onChangeText={(value) => onChange('discount_special_max_amount', value ? parseFloat(value) : null)}
                            textContentType="none"
                            autoComplete="off"
                        />
                    </View>
                </View>
                {errors?.discount_special_percentage && (
                    <Text style={styles.errorText}>{errors.discount_special_percentage}</Text>
                )}

                <View style={styles.dateRowContainer}>
                    <TouchableOpacity
                        style={styles.dateInputHalf}
                        onPress={() => setShowDiscountStartPicker(true)}
                    >
                        <Text style={[styles.dateInputText, { color: discountSpecialStartDate ? '#000000' : '#666666' }]} numberOfLines={1}>
                            {discountSpecialStartDate ? formatDate(data?.discount_special_start_date) : 'Start date'}
                        </Text>
                        {discountSpecialStartDate ? (
                            <TouchableOpacity
                                onPress={(e) => {
                                    e.stopPropagation();
                                    onChange('discount_special_start_date', null);
                                }}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons name="close-circle" size={16} color="#666666" />
                            </TouchableOpacity>
                        ) : (
                            <Ionicons name="calendar-outline" size={16} color="#666666" />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.dateInputHalf}
                        onPress={() => setShowDiscountEndPicker(true)}
                    >
                        <Text style={[styles.dateInputText, { color: discountSpecialEndDate ? '#000000' : '#666666' }]} numberOfLines={1}>
                            {discountSpecialEndDate ? formatDate(data?.discount_special_end_date) : 'End date'}
                        </Text>
                        {discountSpecialEndDate ? (
                            <TouchableOpacity
                                onPress={(e) => {
                                    e.stopPropagation();
                                    onChange('discount_special_end_date', null);
                                }}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons name="close-circle" size={16} color="#666666" />
                            </TouchableOpacity>
                        ) : (
                            <Ionicons name="calendar-outline" size={16} color="#666666" />
                        )}
                    </TouchableOpacity>
                </View>
                {errors?.discount_special_end_date && (
                    <Text style={styles.errorText}>{errors.discount_special_end_date}</Text>
                )}
            </View>

            {/* Date Pickers */}
            <DateTimePickerModal
                isVisible={showHolidayStartPicker}
                mode="date"
                date={holidayStartDate || new Date()}
                onConfirm={(date) => {
                    onChange('holiday_start_date', date.toISOString().split('T')[0]);
                    setShowHolidayStartPicker(false);
                }}
                onCancel={() => setShowHolidayStartPicker(false)}
            />

            <DateTimePickerModal
                isVisible={showHolidayEndPicker}
                mode="date"
                date={holidayEndDate || new Date()}
                onConfirm={(date) => {
                    onChange('holiday_end_date', date.toISOString().split('T')[0]);
                    setShowHolidayEndPicker(false);
                }}
                onCancel={() => setShowHolidayEndPicker(false)}
            />

            <DateTimePickerModal
                isVisible={showDiscountStartPicker}
                mode="date"
                date={discountSpecialStartDate || new Date()}
                onConfirm={(date) => {
                    onChange('discount_special_start_date', date.toISOString().split('T')[0]);
                    setShowDiscountStartPicker(false);
                }}
                onCancel={() => setShowDiscountStartPicker(false)}
            />

            <DateTimePickerModal
                isVisible={showDiscountEndPicker}
                mode="date"
                date={discountSpecialEndDate || new Date()}
                onConfirm={(date) => {
                    onChange('discount_special_end_date', date.toISOString().split('T')[0]);
                    setShowDiscountEndPicker(false);
                }}
                onCancel={() => setShowDiscountEndPicker(false)}
            />

            {/* Return Policy Modal */}
            <Modal
                visible={showReturnPolicyModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowReturnPolicyModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowReturnPolicyModal(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Select Return Policy</Text>

                        {[7, 14, 30, 60, 90].map((days) => (
                            <TouchableOpacity
                                key={days}
                                style={styles.modalOption}
                                onPress={() => {
                                    onChange('return_policy_days', days);
                                    setShowReturnPolicyModal(false);
                                }}
                            >
                                <Text style={styles.modalOptionText}>{days} days</Text>
                                {data?.return_policy_days === days && (
                                    <Ionicons name="checkmark" size={20} color="#00615E" />
                                )}
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            style={styles.modalOption}
                            onPress={() => {
                                onChange('return_policy_days', 0);
                                setShowReturnPolicyModal(false);
                            }}
                        >
                            <Text style={styles.modalOptionText}>No returns</Text>
                            {data?.return_policy_days === 0 && (
                                <Ionicons name="checkmark" size={20} color="#00615E" />
                            )}
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View >
    );
};


const styles = StyleSheet.create({
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        gap: 16,
        alignSelf: 'stretch',
    },
    title: {
        width: "100%",
        height: 24,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 20,
        lineHeight: 24,
        color: '#000000',
    },
    fieldContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        gap: 8,
        width: "100%",
    },
    label: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
        alignSelf: 'stretch',
    },
    description: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 14,
        lineHeight: 20,
        color: '#666666',
        alignSelf: 'stretch',
    },
    inputContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        gap: 10,
        width: "100%",
        height: 40,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
    },
    inputContainerLarge: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 10,
        width: "100%",
        minHeight: 112,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
    },
    input: {
        flex: 1,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 16,
        color: '#666666',
        padding: 0,
    },
    inputLarge: {
        flex: 1,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 16,
        color: '#666666',
        padding: 0,
        minHeight: 88,
    },
    percentageSymbol: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 20,
        color: '#666666',
        marginLeft: 4,
    },
    errorText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 12,
        lineHeight: 16,
        color: '#FF0000',
        marginTop: 4,
    },
    radioRow: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        width: "100%",
        marginBottom: 12,
    },
    radioOuter: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#00615E',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#00615E',
    },
    radioLabel: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
    },
    specialSalesContainer: {
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 8,
        gap: 16,
        width: "100%",
        borderWidth: 1,
        borderColor: '#EEEEEF',
        borderRadius: 8,
    },
    checkboxRow: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        width: "100%",
    },
    checkbox: {
        width: 16,
        height: 16,
        backgroundColor: '#EEEEEF',
        borderWidth: 1,
        borderColor: '#666666',
        borderRadius: 4,
        marginTop: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    multiplierContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 8,
        width: "100%",
    },
    multiplierInputContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        gap: 10,
        width: "100%",
        height: 40,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
    },
    rowSpaceBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    discountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        width: "100%",
    },
    plusButton: {
        width: 40,
        height: 40,
        backgroundColor: '#00615E',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    discountEntryContainer: {
        width: "100%",
        padding: 12,
        backgroundColor: '#F9F9F9',
        borderRadius: 8,
        gap: 8,
        marginTop: 8,
    },
    discountInputContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        gap: 10,
        width: "100%",
        height: 40,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
    },
    discountRowContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
        width: "100%",
    },
    discountInputHalf: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 12,
        gap: 8,
        height: 40,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
    },
    discountEntryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    discountEntryTitle: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 14,
        color: '#000000',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#00615E',
        borderRadius: 8,
        marginTop: 8,
        width: "100%",
    },
    addButtonText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '500',
        fontSize: 14,
        color: '#00615E',
    },
    flex1: {
        flex: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 20,
        width: "100%",
        maxHeight: '80%',
    },
    modalTitle: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '600',
        fontSize: 18,
        lineHeight: 22,
        color: '#000000',
        marginBottom: 16,
    },
    modalOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEF',
    },
    modalOptionText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 19,
        color: '#000000',
    },
    dateRowContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
        width: "100%",
    },
    dateInputHalf: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 12,
        gap: 8,
        height: 40,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
    },
    dateInputText: {
        flex: 1,
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 14,
        lineHeight: 16,
        color: '#666666',
    },
    datePickerModalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    datePickerModalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 20,
    },
    datePickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEF',
    },
    datePickerTitle: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '600',
        fontSize: 18,
        lineHeight: 22,
        color: '#000000',
    },
    datePickerDoneButton: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '600',
        fontSize: 16,
        lineHeight: 19,
        color: '#00615E',
    },
});
