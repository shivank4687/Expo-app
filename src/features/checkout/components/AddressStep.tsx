/**
 * AddressStep Component
 * Checkout address selection step
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { theme } from '@/theme';
import { CheckoutAddress } from '../types/checkout.types';
import { addressApi } from '@/services/api/address.api';
import { useToast } from '@/shared/components/Toast';

interface AddressStepProps {
    billingAddress: CheckoutAddress | null;
    shippingAddress: CheckoutAddress | null;
    sameAsBilling: boolean;
    onSameAsBillingChange: (value: boolean) => void;
    onProceed: () => void;
    onAddressUpdate: (type: 'billing' | 'shipping', address: CheckoutAddress) => void;
    isProcessing?: boolean;
}

export const AddressStep: React.FC<AddressStepProps> = ({
    billingAddress,
    shippingAddress,
    sameAsBilling,
    onSameAsBillingChange,
    onProceed,
    onAddressUpdate,
    isProcessing = false,
}) => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [addressType, setAddressType] = useState<'billing' | 'shipping'>('billing');
    const [isSaving, setIsSaving] = useState(false);
    
    // Form state
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address1: '',
        address2: '',
        city: '',
        state: '',
        country: '',
        postcode: '',
    });

    const handleAddBillingAddress = () => {
        setAddressType('billing');
        setFormData({
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            address1: '',
            address2: '',
            city: '',
            state: '',
            country: '',
            postcode: '',
        });
        setShowAddressForm(true);
    };

    const handleChangeBillingAddress = () => {
        setAddressType('billing');
        if (billingAddress) {
            setFormData({
                first_name: billingAddress.first_name,
                last_name: billingAddress.last_name,
                email: billingAddress.email,
                phone: billingAddress.phone,
                address1: billingAddress.address1,
                address2: billingAddress.address2 || '',
                city: billingAddress.city,
                state: billingAddress.state,
                country: billingAddress.country,
                postcode: billingAddress.postcode,
            });
        }
        setShowAddressForm(true);
    };

    const handleAddShippingAddress = () => {
        setAddressType('shipping');
        setFormData({
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            address1: '',
            address2: '',
            city: '',
            state: '',
            country: '',
            postcode: '',
        });
        setShowAddressForm(true);
    };

    const handleChangeShippingAddress = () => {
        setAddressType('shipping');
        if (shippingAddress) {
            setFormData({
                first_name: shippingAddress.first_name,
                last_name: shippingAddress.last_name,
                email: shippingAddress.email,
                phone: shippingAddress.phone,
                address1: shippingAddress.address1,
                address2: shippingAddress.address2 || '',
                city: shippingAddress.city,
                state: shippingAddress.state,
                country: shippingAddress.country,
                postcode: shippingAddress.postcode,
            });
        }
        setShowAddressForm(true);
    };

    const handleSaveAddress = async () => {
        // Validate
        if (!formData.first_name || !formData.last_name || !formData.email || 
            !formData.phone || !formData.address1 || !formData.city || 
            !formData.state || !formData.country || !formData.postcode) {
            showToast({ message: t('checkout.fillAllFields', 'Please fill all required fields'), type: 'error' });
            return;
        }

        setIsSaving(true);
        try {
            // Save to backend - API expects address1 as array
            const addressData = {
                first_name: formData.first_name,
                last_name: formData.last_name,
                phone: formData.phone,
                address1: [formData.address1, formData.address2].filter(Boolean),
                city: formData.city,
                state: formData.state,
                country: formData.country,
                postcode: formData.postcode,
            };

            const savedAddress = await addressApi.createAddress(addressData);

            // Convert to CheckoutAddress
            const checkoutAddress: CheckoutAddress = {
                id: savedAddress.id,
                first_name: savedAddress.first_name,
                last_name: savedAddress.last_name,
                email: formData.email, // Use form email
                phone: savedAddress.phone,
                address1: Array.isArray(savedAddress.address1) ? savedAddress.address1[0] : savedAddress.address1,
                address2: Array.isArray(savedAddress.address1) && savedAddress.address1[1] ? savedAddress.address1[1] : (savedAddress.address2 || ''),
                city: savedAddress.city,
                state: savedAddress.state,
                country: savedAddress.country,
                postcode: savedAddress.postcode,
            };

            onAddressUpdate(addressType, checkoutAddress);
            setShowAddressForm(false);
            showToast({ message: t('messages.addressAdded'), type: 'success' });
        } catch (error: any) {
            showToast({ message: error.message || t('checkout.addressSaveFailed'), type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const canProceed = billingAddress && (sameAsBilling || shippingAddress);

    const renderAddressCard = (
        address: CheckoutAddress | null,
        title: string,
        onAdd: () => void,
        onChange: () => void
    ) => {
        return (
            <Card style={styles.addressCard}>
                <View style={styles.addressHeader}>
                    <Text style={styles.addressTitle}>{title}</Text>
                </View>

                {address ? (
                    <>
                        <View style={styles.addressContent}>
                            <Text style={styles.addressName}>
                                {address.first_name} {address.last_name}
                            </Text>
                            <Text style={styles.addressText}>{address.address1}</Text>
                            {address.address2 ? (
                                <Text style={styles.addressText}>{address.address2}</Text>
                            ) : null}
                            <Text style={styles.addressText}>
                                {address.city}, {address.state} {address.postcode}
                            </Text>
                            <Text style={styles.addressText}>{address.country}</Text>
                            <Text style={styles.addressText}>{address.phone}</Text>
                            <Text style={styles.addressText}>{address.email}</Text>
                        </View>

                        <View style={styles.addressActions}>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={onChange}
                            >
                                <Ionicons
                                    name="swap-horizontal"
                                    size={18}
                                    color={theme.colors.primary[500]}
                                />
                                <Text style={styles.actionButtonText}>
                                    {t('checkout.changeAddress', 'Change')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </>
                ) : (
                    <TouchableOpacity
                        style={styles.addAddressButton}
                        onPress={onAdd}
                    >
                        <Ionicons
                            name="add-circle-outline"
                            size={24}
                            color={theme.colors.primary[500]}
                        />
                        <Text style={styles.addAddressText}>
                            {t('checkout.addAddress', 'Add Address')}
                        </Text>
                    </TouchableOpacity>
                )}
            </Card>
        );
    };

    return (
        <View style={styles.container}>
            {/* Billing Address */}
            {renderAddressCard(
                billingAddress,
                t('address.billingAddress'),
                handleAddBillingAddress,
                handleChangeBillingAddress
            )}

            {/* Same as Billing Checkbox */}
            <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => onSameAsBillingChange(!sameAsBilling)}
                activeOpacity={0.7}
            >
                <View
                    style={[
                        styles.checkbox,
                        sameAsBilling && styles.checkboxChecked,
                    ]}
                >
                    {sameAsBilling && (
                        <Ionicons
                            name="checkmark"
                            size={18}
                            color={theme.colors.white}
                        />
                    )}
                </View>
                <Text style={styles.checkboxLabel}>
                    {t('address.sameAsBilling')}
                </Text>
            </TouchableOpacity>

            {/* Shipping Address (if different from billing) */}
            {!sameAsBilling && (
                <>
                    <View style={styles.divider} />
                    {renderAddressCard(
                        shippingAddress,
                        t('address.shippingAddress'),
                        handleAddShippingAddress,
                        handleChangeShippingAddress
                    )}
                </>
            )}

            {/* Proceed Button */}
            <Button
                title={t('checkout.proceedToShipping', 'Proceed to Shipping')}
                onPress={onProceed}
                disabled={!canProceed || isProcessing}
                loading={isProcessing}
                style={styles.proceedButton}
            />

            {/* Add/Edit Address Modal */}
            <Modal
                visible={showAddressForm}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowAddressForm(false)}
            >
                <View style={styles.modalContainer}>
                    {/* Modal Header */}
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {addressType === 'billing' 
                                ? t('address.billingAddress') 
                                : t('address.shippingAddress')}
                        </Text>
                        <TouchableOpacity onPress={() => setShowAddressForm(false)}>
                            <Ionicons name="close" size={28} color={theme.colors.text.primary} />
                        </TouchableOpacity>
                    </View>

                    {/* Address Form */}
                    <ScrollView style={styles.formScroll} contentContainerStyle={styles.formContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder={t('address.enterFirstName')}
                            value={formData.first_name}
                            onChangeText={(text) => setFormData({ ...formData, first_name: text })}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder={t('address.enterLastName')}
                            value={formData.last_name}
                            onChangeText={(text) => setFormData({ ...formData, last_name: text })}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder={t('address.enterEmail')}
                            value={formData.email}
                            onChangeText={(text) => setFormData({ ...formData, email: text })}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder={t('address.enterPhone')}
                            value={formData.phone}
                            onChangeText={(text) => setFormData({ ...formData, phone: text })}
                            keyboardType="phone-pad"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder={t('address.address1')}
                            value={formData.address1}
                            onChangeText={(text) => setFormData({ ...formData, address1: text })}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder={t('address.address2') + ' ' + t('common.optional', '(Optional)')}
                            value={formData.address2}
                            onChangeText={(text) => setFormData({ ...formData, address2: text })}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder={t('address.enterCity')}
                            value={formData.city}
                            onChangeText={(text) => setFormData({ ...formData, city: text })}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder={t('address.state')}
                            value={formData.state}
                            onChangeText={(text) => setFormData({ ...formData, state: text })}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder={t('address.country')}
                            value={formData.country}
                            onChangeText={(text) => setFormData({ ...formData, country: text })}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder={t('address.enterZipCode')}
                            value={formData.postcode}
                            onChangeText={(text) => setFormData({ ...formData, postcode: text })}
                        />

                        <Button
                            title={t('common.save')}
                            onPress={handleSaveAddress}
                            loading={isSaving}
                            disabled={isSaving}
                            style={styles.saveButton}
                        />
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: theme.spacing.md,
    },
    addressCard: {
        marginBottom: theme.spacing.md,
        padding: 0,
        overflow: 'hidden',
    },
    addressHeader: {
        padding: theme.spacing.md,
        backgroundColor: theme.colors.gray[50],
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200],
    },
    addressTitle: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
    },
    addressContent: {
        padding: theme.spacing.md,
    },
    addressName: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    addressText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        marginBottom: 2,
    },
    addressActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: theme.spacing.md,
        paddingTop: theme.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: theme.colors.gray[200],
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
    },
    actionButtonText: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.primary[500],
    },
    addAddressButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        padding: theme.spacing.xl,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: theme.colors.gray[300],
        borderRadius: theme.borderRadius.md,
        margin: theme.spacing.md,
    },
    addAddressText: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.primary[500],
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.sm,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: theme.colors.gray[400],
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.sm,
    },
    checkboxChecked: {
        backgroundColor: theme.colors.primary[500],
        borderColor: theme.colors.primary[500],
    },
    checkboxLabel: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text.primary,
        fontWeight: theme.typography.fontWeight.medium,
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.gray[200],
        marginVertical: theme.spacing.md,
    },
    proceedButton: {
        marginTop: theme.spacing.lg,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: theme.colors.white,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.gray[200],
    },
    modalTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
    },
    formScroll: {
        flex: 1,
    },
    formContainer: {
        padding: theme.spacing.md,
    },
    input: {
        height: 48,
        borderWidth: 1,
        borderColor: theme.colors.gray[300],
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: theme.spacing.md,
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text.primary,
        backgroundColor: theme.colors.white,
        marginBottom: theme.spacing.md,
    },
    saveButton: {
        marginTop: theme.spacing.lg,
        marginBottom: theme.spacing.xl * 2,
    },
});

