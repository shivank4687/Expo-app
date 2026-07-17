import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { theme } from '@/theme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchAddressesThunk } from '@/store/slices/addressSlice';
import { productsApi } from '@/services/api/products.api';
import { ShippingQuoteRate } from '../types/product.types';
import { Address } from '@/features/address/types/address.types';

interface EstimatedDeliveryCardProps {
    productId: number;
    isAuthenticated: boolean;
}

export const EstimatedDeliveryCard: React.FC<EstimatedDeliveryCardProps> = ({
    productId,
    isAuthenticated,
}) => {
    const { t } = useTranslation();
    const router = useRouter();
    const dispatch = useAppDispatch();

    // Select address state
    const { addresses, isLoaded, isLoading: isLoadingAddresses } = useAppSelector(
        (state: any) => state.address
    );

    const [shippingRate, setShippingRate] = useState<ShippingQuoteRate | null>(null);
    const [isLoadingQuote, setIsLoadingQuote] = useState(false);
    const [quoteError, setQuoteError] = useState<string | null>(null);

    // Selected address state
    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
    const [showAddressModal, setShowAddressModal] = useState(false);

    // Fetch addresses on mount if authenticated
    useEffect(() => {
        if (isAuthenticated && !isLoaded) {
            dispatch(fetchAddressesThunk());
        }
    }, [isAuthenticated, isLoaded, dispatch]);

    // Find default address
    const defaultAddress = addresses.find(
        (addr: any) => addr.is_default || addr.default_address
    ) || addresses[0];

    // Initialize or update selectedAddress when addresses are loaded
    useEffect(() => {
        if (addresses.length > 0 && !selectedAddress) {
            setSelectedAddress(defaultAddress);
        }
    }, [addresses, defaultAddress, selectedAddress]);

    // Track active address (local selected address or fallback default)
    const activeAddress = selectedAddress || defaultAddress;

    // Fetch shipping quote when activeAddress changes
    useEffect(() => {
        const fetchQuote = async () => {
            if (!activeAddress) {
                setShippingRate(null);
                return;
            }

            try {
                setIsLoadingQuote(true);
                setQuoteError(null);

                const addressPayload = {
                    postcode: activeAddress.postcode,
                    country: activeAddress.country,
                    state: activeAddress.state,
                    city: activeAddress.city,
                };

                const quote = await productsApi.getShippingQuote(productId, addressPayload);
                setShippingRate(quote.cheapest);
            } catch (err: any) {
                console.error('[EstimatedDeliveryCard] Error fetching quote:', err);
                setQuoteError(t('product.shippingQuoteError', 'Failed to calculate shipping'));
            } finally {
                setIsLoadingQuote(false);
            }
        };

        if (isAuthenticated && activeAddress) {
            fetchQuote();
        }
    }, [productId, activeAddress, isAuthenticated, t]);

    const handleAddAddress = () => {
        router.push('/add-address');
    };

    const renderCardContent = () => {
        // Render loading state
        if (isAuthenticated && (isLoadingAddresses || isLoadingQuote)) {
            return (
                <View style={[styles.card, styles.loadingCard]}>
                    <ActivityIndicator size="small" color={theme.colors.primary[500]} />
                    <Text style={styles.loadingText}>
                        {t('product.calculatingShipping', 'Calculating shipping estimate...')}
                    </Text>
                </View>
            );
        }

        // Render state: Not authenticated
        if (!isAuthenticated) {
            return (
                <View style={[styles.card, styles.infoCard]}>
                    <View style={styles.iconContainer}>
                        <View style={[styles.iconCircle, styles.infoIconCircle]}>
                            <Ionicons name="home-outline" size={20} color={theme.colors.primary[500]} />
                        </View>
                    </View>
                    <View style={styles.content}>
                        <Text style={styles.title}>
                            {t('product.deliveryEstimate', 'Delivery Estimate')}
                        </Text>
                        <Text style={styles.description}>
                            {t('product.loginToSeeEstimate', 'Login to see estimated delivery dates.')}
                        </Text>
                    </View>
                </View>
            );
        }

        // Render state: No address found
        if (addresses.length === 0) {
            return (
                <View style={[styles.card, styles.warningCard]}>
                    <View style={styles.iconContainer}>
                        <View style={[styles.iconCircle, styles.warningIconCircle]}>
                            <Ionicons name="pin-outline" size={20} color="#b45309" />
                        </View>
                    </View>
                    <View style={styles.content}>
                        <Text style={[styles.title, styles.warningTitle]}>
                            {t('product.addAddressForEstimate', 'Add Address for Estimate')}
                        </Text>
                        <Text style={styles.warningDescription}>
                            {t('product.noAddressFoundDesc', 'Add a delivery address to calculate delivery days and prices.')}
                        </Text>
                        <TouchableOpacity style={styles.addButton} onPress={handleAddAddress}>
                            <Text style={styles.addButtonText}>
                                {t('product.addAddress', 'Add Address')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        // Render state: Quote error or no rates found
        if (quoteError || !shippingRate) {
            return (
                <View style={[styles.card, styles.errorCard]}>
                    <View style={styles.iconContainer}>
                        <View style={[styles.iconCircle, styles.errorIconCircle]}>
                            <Ionicons name="alert-circle-outline" size={20} color="#b91c1c" />
                        </View>
                    </View>
                    <View style={styles.content}>
                        <Text style={[styles.title, styles.errorTitle]}>
                            {t('product.shippingUnavailable', 'Shipping Unavailable')}
                        </Text>
                        <Text style={styles.errorDescription}>
                            {quoteError || t('product.noRatesForLocation', 'No shipping options found for this location.')}
                        </Text>
                        {activeAddress && (
                            <View style={styles.addressRowContainer}>
                                <Text style={styles.addressSnippet}>
                                    {activeAddress.city}, {activeAddress.postcode}
                                </Text>
                                <TouchableOpacity onPress={() => setShowAddressModal(true)}>
                                    <Text style={styles.changeLinkText}>
                                        {t('common.change', 'Change')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            );
        }

        // Render state: Success quote details
        return (
            <View style={[styles.card, styles.successCard]}>
                <View style={styles.iconContainer}>
                    <View style={[styles.iconCircle, styles.successIconCircle]}>
                        <Ionicons name="bus-outline" size={20} color="#15803d" />
                    </View>
                </View>
                <View style={styles.content}>
                    <Text style={[styles.title, styles.successTitle]}>
                        {t('product.estimatedDelivery', 'Estimated Delivery')}
                    </Text>
                    <Text style={styles.deliveryDateText}>
                        {shippingRate.days
                            ? t('product.deliveryDaysVal', 'Arrives in {{count}} day', {
                                count: shippingRate.days,
                                defaultValue_plural: 'Arrives in {{count}} days',
                            })
                            : shippingRate.estimated_delivery}
                    </Text>
                    <View style={styles.providerRow}>
                        <Text style={styles.providerLabel}>
                            {shippingRate.provider} ({shippingRate.service_name})
                        </Text>
                        <Text style={styles.priceDivider}> · </Text>
                        <Text style={styles.priceText}>
                            {shippingRate.formatted_price}
                        </Text>
                    </View>
                    <View style={styles.addressRowContainer}>
                        <View style={styles.addressRow}>
                            <Ionicons name="location-sharp" size={12} color={theme.colors.text.secondary} />
                            <Text style={styles.addressText}>
                                {activeAddress.city}, {activeAddress.postcode}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => setShowAddressModal(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Text style={styles.changeLinkText}>
                                {t('common.change', 'Change')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <>
            {renderCardContent()}

            {/* Address Selection Modal */}
            <Modal
                visible={showAddressModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowAddressModal(false)}
            >
                <View style={styles.modalContainer}>
                    {/* Modal Header */}
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {t('checkout.selectAddress', 'Select Address')}
                        </Text>
                        <TouchableOpacity onPress={() => setShowAddressModal(false)}>
                            <Ionicons name="close" size={28} color={theme.colors.text.primary} />
                        </TouchableOpacity>
                    </View>

                    {/* Address List */}
                    <ScrollView style={styles.addressListScroll} contentContainerStyle={styles.addressListContainer}>
                        {addresses.map((address: any) => {
                            const addressLines = address.address || address.address1 || [];
                            const addressArray = Array.isArray(addressLines) ? addressLines : [addressLines];
                            const isSelected = activeAddress?.id === address.id;

                            return (
                                <TouchableOpacity
                                    key={address.id}
                                    style={[
                                        styles.addressListCard,
                                        isSelected && styles.addressListCardSelected
                                    ]}
                                    onPress={() => {
                                        setSelectedAddress(address);
                                        setShowAddressModal(false);
                                    }}
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
                        })}

                        {/* Add New Address Button */}
                        <TouchableOpacity
                            style={styles.modalAddButton}
                            onPress={() => {
                                setShowAddressModal(false);
                                router.push('/add-address');
                            }}
                        >
                            <Ionicons name="add" size={20} color={theme.colors.primary[500]} />
                            <Text style={styles.modalAddButtonText}>
                                {t('checkout.addAddress', 'Add New Address')}
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.xl,
        marginBottom: theme.spacing.sm,
        borderWidth: 1,
    },
    loadingCard: {
        backgroundColor: theme.colors.gray[50],
        borderColor: theme.colors.gray[200],
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.lg,
    },
    loadingText: {
        marginLeft: theme.spacing.sm,
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
    },
    infoCard: {
        backgroundColor: '#f0fdf4',
        borderColor: '#dcfce7',
    },
    successCard: {
        backgroundColor: '#f0fdf4',
        borderColor: '#dcfce7',
    },
    warningCard: {
        backgroundColor: '#fffbeb',
        borderColor: '#fef3c7',
    },
    errorCard: {
        backgroundColor: '#fef2f2',
        borderColor: '#fee2e2',
    },
    iconContainer: {
        marginRight: theme.spacing.md,
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoIconCircle: {
        backgroundColor: theme.colors.primary[50],
    },
    successIconCircle: {
        backgroundColor: '#dcfce7',
    },
    warningIconCircle: {
        backgroundColor: '#fef3c7',
    },
    errorIconCircle: {
        backgroundColor: '#fee2e2',
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: 2,
    },
    warningTitle: {
        color: '#92400e',
    },
    errorTitle: {
        color: '#991b1b',
    },
    successTitle: {
        color: '#166534',
    },
    description: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        lineHeight: 18,
    },
    warningDescription: {
        fontSize: theme.typography.fontSize.sm,
        color: '#b45309',
        lineHeight: 18,
        marginBottom: theme.spacing.sm,
    },
    errorDescription: {
        fontSize: theme.typography.fontSize.sm,
        color: '#b91c1c',
        lineHeight: 18,
    },
    addressSnippet: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
        marginTop: 4,
    },
    deliveryDateText: {
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.bold,
        color: '#166534',
        marginBottom: 4,
    },
    providerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: 4,
    },
    providerLabel: {
        fontSize: theme.typography.fontSize.sm,
        color: '#15803d',
        flexShrink: 1,
    },
    priceDivider: {
        fontSize: theme.typography.fontSize.sm,
        color: '#86efac',
        fontWeight: 'bold',
    },
    priceText: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.bold,
        color: '#166534',
        flexShrink: 1,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    addressText: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
    },
    addButton: {
        backgroundColor: theme.colors.primary[500],
        paddingVertical: theme.spacing.xs,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        alignSelf: 'flex-start',
    },
    addButtonText: {
        color: theme.colors.white,
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semiBold,
    },
    addressRowContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
        width: '100%',
    },
    changeLinkText: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.primary[500],
        textDecorationLine: 'underline',
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
    },
    modalAddButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: theme.colors.primary[500],
        marginTop: theme.spacing.xs,
        marginBottom: theme.spacing.xl,
        gap: 8,
    },
    modalAddButtonText: {
        color: theme.colors.primary[500],
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semiBold,
    },
});
