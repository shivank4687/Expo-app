/**
 * AddressStep Component
 * Checkout address selection step
 */

import { Address } from '@/features/address/types/address.types';
import { addressApi } from '@/services/api/address.api';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { useToast } from '@/shared/components/Toast';
import { theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CheckoutAddress } from '../types/checkout.types';

interface AddressStepProps {
    billingAddress: CheckoutAddress | null;
    shippingAddress: CheckoutAddress | null;
    sameAsBilling: boolean;
    onSameAsBillingChange: (value: boolean) => void;
    onAddressUpdate: (type: 'billing' | 'shipping', address: CheckoutAddress) => void;
    isDefaultAddressLoading?: boolean;
}

export const AddressStep: React.FC<AddressStepProps> = ({
    billingAddress,
    shippingAddress,
    sameAsBilling,
    onSameAsBillingChange,
    onAddressUpdate,
    isDefaultAddressLoading = false,
}) => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const router = useRouter();
    const [showAddressListModal, setShowAddressListModal] = useState(false);
    const [addressType, setAddressType] = useState<'billing' | 'shipping'>('billing');
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
    const isInitialLoading = isDefaultAddressLoading && !billingAddress;

    // Load addresses from API
    const loadAddresses = async () => {
        try {
            setIsLoadingAddresses(true);
            const data = await addressApi.getAddresses();
            setAddresses(data);
        } catch (error: any) {
            showToast({ message: error.message || t('checkout.addressLoadFailed', 'Failed to load addresses'), type: 'error' });
        } finally {
            setIsLoadingAddresses(false);
        }
    };

    // Handle Add button click - navigate to add address screen
    const handleAddBillingAddress = () => {
        router.push('/add-address');
    };

    const handleAddShippingAddress = () => {
        router.push('/add-address');
    };

    // Handle Change button click - show address list modal
    const handleChangeBillingAddress = async () => {
        setAddressType('billing');
        await loadAddresses();
        setShowAddressListModal(true);
    };

    const handleChangeShippingAddress = async () => {
        setAddressType('shipping');
        await loadAddresses();
        setShowAddressListModal(true);
    };

    // Handle address selection from list
    const handleAddressSelect = (address: Address) => {
        // Convert Address to CheckoutAddress
        const addressLines = address.address || address.address1 || [];
        const addressArray = Array.isArray(addressLines) ? addressLines : [addressLines];

        const checkoutAddress: CheckoutAddress = {
            id: address.id,
            first_name: address.first_name,
            last_name: address.last_name,
            email: address.email || '',
            phone: address.phone,
            address1: addressArray[0] || '',
            address2: addressArray[1] || address.address2 || '',
            city: address.city,
            state: address.state,
            country: address.country,
            postcode: address.postcode,
        };

        onAddressUpdate(addressType, checkoutAddress);
        setShowAddressListModal(false);
        showToast({ message: t('checkout.addressSelected', 'Address selected successfully'), type: 'success' });
    };

    const canProceed = billingAddress && (sameAsBilling || shippingAddress);

    const renderAddressCard = (
        address: CheckoutAddress | null,
        title: string,
        onAdd: () => void,
        onChange: () => void,
        disabled?: boolean
    ) => {
        return (
            <Card
                style={[styles.addressCard, disabled && styles.disabledAddressCard]}
                variant={disabled ? 'flat' : 'elevated'}
            >
                <View style={[styles.addressHeader, disabled && styles.disabledAddressHeader]}>
                    <View style={styles.headerTitleRow}>
                        <Text style={[styles.addressTitle, disabled && styles.disabledAddressTitle]}>{title}</Text>
                        {disabled && (
                            <View style={styles.sameAsBillingBadge}>
                                <Text style={styles.sameAsBillingBadgeText}>
                                    {t('checkout.sameAsBillingBadge', 'Same as Billing')}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {address ? (
                    <View style={disabled && styles.disabledContentWrapper}>
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
                                onPress={onAdd}
                                disabled={disabled}
                            >
                                <Ionicons
                                    name="add-circle-outline"
                                    size={18}
                                    color={disabled ? theme.colors.gray[400] : theme.colors.primary[500]}
                                />
                                <Text style={[styles.actionButtonText, disabled && styles.disabledActionButtonText]}>
                                    {t('checkout.addAddress', 'Add')}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={onChange}
                                disabled={disabled}
                            >
                                <Ionicons
                                    name="swap-horizontal"
                                    size={18}
                                    color={disabled ? theme.colors.gray[400] : theme.colors.primary[500]}
                                />
                                <Text style={[styles.actionButtonText, disabled && styles.disabledActionButtonText]}>
                                    {t('checkout.changeAddress', 'Change')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View style={[styles.emptyAddressContainer, disabled && styles.disabledContentWrapper]}>
                        <TouchableOpacity
                            style={[styles.emptyStateButton, disabled && styles.disabledEmptyStateButton]}
                            onPress={onChange}
                            disabled={disabled}
                        >
                            <Ionicons
                                name="list-outline"
                                size={24}
                                color={disabled ? theme.colors.gray[400] : theme.colors.primary[500]}
                            />
                            <Text style={[styles.emptyStateButtonText, disabled && styles.disabledEmptyStateButtonText]}>
                                {t('checkout.chooseAddress', 'Choose Address')}
                            </Text>
                        </TouchableOpacity>

                        <Text style={[styles.orText, disabled && styles.disabledOrText]}>- {t('common.or', 'OR')} -</Text>

                        <TouchableOpacity
                            style={[styles.emptyStateButton, disabled && styles.disabledEmptyStateButton]}
                            onPress={onAdd}
                            disabled={disabled}
                        >
                            <Ionicons
                                name="add-circle-outline"
                                size={24}
                                color={disabled ? theme.colors.gray[400] : theme.colors.primary[500]}
                            />
                            <Text style={[styles.emptyStateButtonText, disabled && styles.disabledEmptyStateButtonText]}>
                                {t('checkout.addNewAddress', 'Add New Address')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </Card>
        );
    };

    return (
        <View style={styles.container}>
            {/* Scrollable Content */}
            {isInitialLoading ? (
                <View style={styles.initialLoadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary[500]} />
                    <Text style={styles.initialLoadingText}>
                        {t('checkout.loadingDefaultAddress', 'Loading default address...')}
                    </Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
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

                    {/* Shipping Address */}
                    <>
                        <View style={styles.divider} />
                        {renderAddressCard(
                            shippingAddress,
                            t('address.shippingAddress'),
                            handleAddShippingAddress,
                            handleChangeShippingAddress,
                            sameAsBilling
                        )}
                    </>
                </ScrollView>
            )}

            {/* Address Selection Modal */}
            <Modal
                visible={showAddressListModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowAddressListModal(false)}
            >
                <View style={styles.modalContainer}>
                    {/* Modal Header */}
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {t('checkout.selectAddress', 'Select Address')}
                        </Text>
                        <TouchableOpacity onPress={() => setShowAddressListModal(false)}>
                            <Ionicons name="close" size={28} color={theme.colors.text.primary} />
                        </TouchableOpacity>
                    </View>

                    {/* Address List */}
                    <ScrollView style={styles.addressListScroll} contentContainerStyle={styles.addressListContainer}>
                        {isLoadingAddresses ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={theme.colors.primary[500]} />
                                <Text style={styles.loadingText}>{t('common.loading', 'Loading...')}</Text>
                            </View>
                        ) : addresses.length > 0 ? (
                            addresses.map((address) => {
                                const addressLines = address.address || address.address1 || [];
                                const addressArray = Array.isArray(addressLines) ? addressLines : [addressLines];
                                const currentSelectedId = addressType === 'billing' ? billingAddress?.id : shippingAddress?.id;
                                const isSelected = currentSelectedId === address.id;

                                return (
                                    <TouchableOpacity
                                        key={address.id}
                                        style={[
                                            styles.addressListCard,
                                            isSelected && styles.addressListCardSelected
                                        ]}
                                        onPress={() => handleAddressSelect(address)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.addressListCardContent}>
                                            <View style={styles.addressListCardHeader}>
                                                <Text style={styles.addressListCardName}>
                                                    {address.first_name} {address.last_name}
                                                </Text>
                                                {isSelected && (
                                                    <View style={styles.selectedBadge}>
                                                        <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary[500]} />
                                                    </View>
                                                )}
                                            </View>
                                            <Text style={styles.addressListCardText}>{addressArray[0]}</Text>
                                            {addressArray[1] && (
                                                <Text style={styles.addressListCardText}>{addressArray[1]}</Text>
                                            )}
                                            <Text style={styles.addressListCardText}>
                                                {address.city}, {address.state} {address.postcode}
                                            </Text>
                                            <Text style={styles.addressListCardText}>{address.country}</Text>
                                            <Text style={styles.addressListCardText}>{address.phone}</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })
                        ) : (
                            <View style={styles.emptyAddressState}>
                                <Ionicons
                                    name="location-outline"
                                    size={64}
                                    color={theme.colors.gray[400]}
                                />
                                <Text style={styles.emptyAddressTitle}>
                                    {t('checkout.noAddresses', 'No Addresses Found')}
                                </Text>
                                <Text style={styles.emptyAddressMessage}>
                                    {t('checkout.noAddressesMessage', 'Please add an address first')}
                                </Text>
                                <Button
                                    title={t('checkout.addAddress', 'Add Address')}
                                    onPress={() => {
                                        setShowAddressListModal(false);
                                        router.push('/add-address');
                                    }}
                                    style={styles.emptyAddressButton}
                                />
                            </View>
                        )}
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: theme.spacing.xs,
    },
    initialLoadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.md,
    },
    initialLoadingText: {
        marginTop: theme.spacing.md,
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text.secondary,
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
    emptyAddressContainer: {
        padding: theme.spacing.md,
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    emptyStateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        padding: theme.spacing.md,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: theme.colors.primary[300],
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.primary[50],
        width: '100%',
    },
    emptyStateButtonText: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.primary[600],
    },
    orText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        fontWeight: theme.typography.fontWeight.medium,
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
    disabledAddressCard: {
        borderColor: theme.colors.gray[200],
        backgroundColor: theme.colors.gray[50],
    },
    disabledAddressHeader: {
        backgroundColor: theme.colors.gray[100],
        borderBottomColor: theme.colors.gray[200],
    },
    disabledAddressTitle: {
        color: theme.colors.text.disabled,
    },
    disabledContentWrapper: {
        opacity: 0.6,
    },
    disabledActionButtonText: {
        color: theme.colors.text.disabled,
    },
    disabledEmptyStateButton: {
        borderColor: theme.colors.gray[300],
        backgroundColor: theme.colors.gray[100],
        borderStyle: 'solid',
    },
    disabledEmptyStateButtonText: {
        color: theme.colors.gray[400],
    },
    disabledOrText: {
        color: theme.colors.gray[400],
    },
    headerTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        flex: 1,
    },
    sameAsBillingBadge: {
        backgroundColor: theme.colors.primary[50],
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
        borderRadius: theme.borderRadius.sm,
        borderWidth: 1,
        borderColor: theme.colors.primary[100],
    },
    sameAsBillingBadgeText: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.primary[600],
    },
    modalContainer: {
        flex: 1,
        backgroundColor: theme.colors.background.default,
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
    addressListScroll: {
        flex: 1,
    },
    addressListContainer: {
        padding: theme.spacing.md,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: theme.spacing.xl * 3,
    },
    loadingText: {
        marginTop: theme.spacing.md,
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text.secondary,
    },
    addressListCard: {
        borderWidth: 1,
        borderColor: theme.colors.gray[300],
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        backgroundColor: theme.colors.background.default,
    },
    addressListCardSelected: {
        borderColor: theme.colors.primary[500],
        borderWidth: 2,
        backgroundColor: theme.colors.primary[50],
    },
    addressListCardContent: {
        gap: 4,
    },
    addressListCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
    },
    addressListCardName: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.semiBold,
        color: theme.colors.text.primary,
    },
    selectedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    addressListCardText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        lineHeight: 20,
    },
    emptyAddressState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: theme.spacing.xl * 3,
        paddingHorizontal: theme.spacing.xl,
    },
    emptyAddressTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginTop: theme.spacing.lg,
        marginBottom: theme.spacing.sm,
    },
    emptyAddressMessage: {
        fontSize: theme.typography.fontSize.md,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        marginBottom: theme.spacing.lg,
    },
    emptyAddressButton: {
        minWidth: 200,
    },
});
