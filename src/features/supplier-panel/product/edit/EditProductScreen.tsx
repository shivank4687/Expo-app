import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/features/supplier-panel/styles';
import { EssentialCard, PriceStockCard, PriceStockVariantsCard, DetailsCard, SettingsCard } from '../add/components';
import { productAttributesApi, ProductAttribute } from '../add/api/product-attributes.api';
import productsApi from '@/services/api/products.api';
import { EssentialCardRef } from '../add/components/EssentialCard';
import { PriceStockCardRef } from '../add/components/PriceStockCard';
import { PriceStockVariantsCardRef } from '../add/components/PriceStockVariantsCard';
import { DetailsCardRef } from '../add/components/DetailsCard';
import { SettingsCardRef } from '../add/components/SettingsCard';
import { useToast } from '@/shared/components/Toast';

export default function EditProductScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const productId = params.id ? parseInt(params.id as string) : null;

    const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
    const [attributeFamilyId, setAttributeFamilyId] = useState<number | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [productName, setProductName] = useState('');
    const [productData, setProductData] = useState<any>(null);
    const [productType, setProductType] = useState<'simple' | 'configurable'>('simple');

    const { showToast } = useToast();

    // Card Refs
    const essentialCardRef = useRef<EssentialCardRef>(null);
    const priceStockCardRef = useRef<PriceStockCardRef>(null);
    const priceStockVariantsCardRef = useRef<PriceStockVariantsCardRef>(null);
    const detailsCardRef = useRef<DetailsCardRef>(null);
    const settingsCardRef = useRef<SettingsCardRef>(null);

    // Fetch product attributes and product data on mount
    useEffect(() => {
        const fetchData = async () => {
            if (!productId) {
                setFetchError('Invalid product ID');
                setIsInitialLoading(false);
                return;
            }

            try {
                // Reset all state before fetching new data
                setIsInitialLoading(true);
                setFetchError(null);
                setProductData(null);
                setProductName('');
                setAttributes([]);
                setAttributeFamilyId(null);
                setProductType('simple');

                // Fetch product data first to determine type
                const product = await productsApi.getSupplierProductById(productId);
                setProductData(product);
                setProductName(product.name || '');

                // Determine product type
                const type = product.type === 'configurable' ? 'configurable' : 'simple';
                setProductType(type);

                // Fetch attributes based on product type
                const attributesData = await productAttributesApi.getProductAttributes(type);
                setAttributes(attributesData.attributes);
                setAttributeFamilyId(attributesData.attribute_family.id);

                // Populate card components with product data
                setTimeout(() => {
                    if (essentialCardRef.current) {
                        essentialCardRef.current.updateFields({
                            name: product.name || '',
                            description: product.description || '',
                            short_description: product.short_description || '',
                            weight: product.weight?.toString() || '',
                            material_type: product.material_type || '',
                            manufacturing_origin: product.manufacturing_origin || '',
                            images: product.images || [],
                            video: product.videos?.[0] || null,
                        });
                    }

                    if (product.type === 'simple' && priceStockCardRef.current) {
                        // Calculate discount from special_price if applicable
                        let discountValue = '';
                        let discountType: 'percentage' | 'price' = 'percentage';

                        if (product.special_price && product.price) {
                            const today = new Date();
                            const specialPriceFrom = product.special_price_from ? new Date(product.special_price_from) : null;
                            const specialPriceTo = product.special_price_to ? new Date(product.special_price_to) : null;

                            // Check if special price is currently active
                            const isSpecialPriceActive =
                                (!specialPriceFrom || specialPriceFrom <= today) &&
                                (!specialPriceTo || specialPriceTo >= today);

                            if (isSpecialPriceActive) {
                                const price = parseFloat(product.price);
                                const specialPrice = parseFloat(product.special_price);

                                // Calculate discount as price difference
                                const priceDifference = price - specialPrice;

                                // Calculate as percentage
                                const percentageDiscount = (priceDifference / price) * 100;

                                // Use percentage if it's a round number, otherwise use price
                                if (Math.abs(percentageDiscount - Math.round(percentageDiscount)) < 0.01) {
                                    discountValue = Math.round(percentageDiscount).toString();
                                    discountType = 'percentage';
                                } else {
                                    discountValue = priceDifference.toFixed(2);
                                    discountType = 'price';
                                }
                            }
                        }

                        priceStockCardRef.current.updateFields({
                            price: product.price?.toString() || '',
                            sku: product.sku || '',
                            in_order_qty: product.in_order_qty?.toString() || '',
                            in_order_qty_type: product.in_order_qty_type || '',
                            made_to_order_qty: product.made_to_order_qty?.toString() || '',
                            made_to_order_days: product.made_to_order_days?.toString() || '',
                            immediate_shipping: product.immediate_shipping || false,
                            made_to_order: product.made_to_order || false,
                            inventory_qty: product.inventories?.[0]?.qty?.toString() || '',
                            price_tiers: product.customer_group_prices || [],
                            discounts: discountValue,
                            discount_type: discountType,
                        });
                    } else if (product.type === 'configurable' && priceStockVariantsCardRef.current) {
                        priceStockVariantsCardRef.current.updateFields({
                            sku: product.sku || '',
                            variants: product.variants || [],
                            super_attributes: product.super_attributes || [],
                            immediate_shipping: product.immediate_shipping || false,
                            made_to_order: product.made_to_order || false,
                            in_order_qty: product.in_order_qty?.toString() || '',
                            in_order_qty_type: product.in_order_qty_type || '',
                            made_to_order_qty: product.made_to_order_qty?.toString() || '',
                            made_to_order_days: product.made_to_order_days?.toString() || '',
                        });
                    }

                    if (detailsCardRef.current) {
                        detailsCardRef.current.updateFields({
                            features: product.features || '',
                            categories: product.categories || [],
                            meta_title: product.meta_title || '',
                            meta_keywords: product.meta_keywords || '',
                            meta_description: product.meta_description || '',
                        });
                    }

                    if (settingsCardRef.current) {
                        settingsCardRef.current.updateFields({
                            new: product.new || false,
                            featured: product.featured || false,
                            guest_checkout: product.guest_checkout || false,
                            visible_individually: product.visible_individually !== false,
                        });
                    }
                }, 100);
            } catch (err) {
                console.error('Error fetching product data:', err);
                setFetchError('Failed to load product data. Please try again.');
            } finally {
                setIsInitialLoading(false);
            }
        };

        fetchData();
    }, [productId]);

    const handleSave = async () => {
        if (!productId) {
            Alert.alert('Error', 'Invalid product ID');
            return;
        }

        setIsSubmitting(true);

        try {
            // Validate all cards - use correct price/stock card based on product type
            const essentialValid = await essentialCardRef.current?.validate();
            const priceStockValid = productType === 'simple'
                ? await priceStockCardRef.current?.validate()
                : await priceStockVariantsCardRef.current?.validate();

            if (!essentialValid || !priceStockValid) {
                Alert.alert('Validation Error', 'Please fill in all required fields correctly.');
                setIsSubmitting(false);
                return;
            }

            // Collect data from all cards - use correct price/stock card based on product type
            const essentialData = essentialCardRef.current?.getData() || {};
            const priceStockData = productType === 'simple'
                ? (priceStockCardRef.current?.getData() || {})
                : (priceStockVariantsCardRef.current?.getData() || {});
            const detailsData = detailsCardRef.current?.getData() || {};
            const settingsData = settingsCardRef.current?.getData() || {};

            // Combine all data
            const updateData = {
                ...essentialData,
                ...priceStockData,
                ...detailsData,
                ...settingsData,
                type: productData.type,
                attribute_family_id: attributeFamilyId,
                product_locale: 'all', // Enable translation to all locales
            };

            // Remove price field for configurable products (only variants have prices)
            if (productType === 'configurable' && 'price' in updateData) {
                delete updateData.price;
            }

            // Update product
            await productsApi.updateSupplierProduct(productId, updateData);

            showToast({
                message: 'Product updated successfully!',
                type: 'success',
            });

            // Navigate back to products list
            router.back();
        } catch (error: any) {
            console.error('Error updating product:', error);
            Alert.alert('Error', error.message || 'Failed to update product. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderContent = () => {
        if (fetchError) {
            return (
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={24} color="#DC2626" />
                    <Text style={styles.errorText}>{fetchError}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.retryButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (isInitialLoading) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Loading product...</Text>
                </View>
            );
        }

        return (
            <>
                {/* Essential Card */}
                <EssentialCard
                    ref={essentialCardRef}
                    attributes={attributes}
                    onNameChange={setProductName}
                    onAttributesRefresh={async () => {
                        const data = await productAttributesApi.getProductAttributes('simple');
                        setAttributes(data.attributes);
                    }}
                    onAIGenerateClick={() => { }}
                />

                {/* Price & Stock Card - Conditional based on product type */}
                {productType === 'simple' ? (
                    <PriceStockCard
                        ref={priceStockCardRef}
                        productName={productName}
                        attributes={attributes}
                    />
                ) : (
                    <PriceStockVariantsCard
                        ref={priceStockVariantsCardRef}
                        productName={productName}
                        attributes={attributes}
                    />
                )}

                {/* Details Card */}
                <DetailsCard
                    ref={detailsCardRef}
                    attributes={attributes}
                    onAttributesRefresh={async () => {
                        const data = await productAttributesApi.getProductAttributes('simple');
                        setAttributes(data.attributes);
                    }}
                />

                {/* Settings Card */}
                <SettingsCard
                    ref={settingsCardRef}
                />
            </>
        );
    };

    return (
        <View style={styles.container}>
            {/* Fixed Header */}
            <View style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                        activeOpacity={0.7}
                        disabled={isSubmitting}
                    >
                        <Ionicons name="arrow-back" size={16} color="#000000" />
                    </TouchableOpacity>

                    <View style={styles.titleContainer}>
                        <Text style={styles.headerTitle}>Edit Product</Text>
                    </View>
                </View>
            </View>

            {/* Content */}
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                scrollEnabled={!isSubmitting}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
            >
                {/* Disabled Tabs - Visual Only */}
                {!fetchError && !isInitialLoading && (
                    <View style={styles.tabsContainer}>
                        <View style={[styles.tab, productType === 'simple' && styles.tabActive]}>
                            <Text style={[styles.tabText, productType === 'simple' && styles.tabTextActive]}>Simple Product</Text>
                        </View>
                        <View style={[styles.tab, productType === 'configurable' && styles.tabActive]}>
                            <Text style={[styles.tabText, productType === 'configurable' && styles.tabTextActive]}>Product with Variants</Text>
                        </View>
                    </View>
                )}

                {renderContent()}

                {/* Save Button */}
                {!fetchError && !isInitialLoading && (
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={[styles.saveButton, isSubmitting && styles.disabledButton]}
                            onPress={handleSave}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator size="small" color="#F5F5F5" />
                            ) : (
                                <Text style={styles.saveButtonText}>Save</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* Submitting Overlay */}
            {isSubmitting && (
                <View style={styles.submittingOverlay}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        backgroundColor: COLORS.background,
        paddingTop: 60,
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        height: 32,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        width: 32,
        height: 32,
        backgroundColor: COLORS.white,
        borderRadius: 8,
        justifyContent: 'center',
    },
    titleContainer: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: 0,
        gap: 4,
        flex: 1,
    },
    headerTitle: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 16,
        color: '#000000',
    },
    content: {
        padding: 16,
        gap: 16,
    },
    tabsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 4,
        height: 42,
        backgroundColor: COLORS.white,
        borderRadius: 8,
        opacity: 0.6,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
        height: 34,
        borderRadius: 4,
    },
    tabActive: {
        backgroundColor: COLORS.primaryLight,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    tabTextActive: {
        color: '#000000',
    },
    tabText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 14,
        color: '#000000',
    },
    tabTextDisabled: {
        color: '#000000',
    },
    actionButtons: {
        width: '100%',
        marginTop: 16,
        marginBottom: 32,
    },
    saveButton: {
        width: '100%',
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: 8,
    },
    saveButtonText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 14,
        color: '#F5F5F5',
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        gap: 16,
        backgroundColor: COLORS.white,
        borderRadius: 16,
    },
    loadingText: {
        fontFamily: 'Inter',
        fontSize: 16,
        color: '#666666',
        textAlign: 'center',
    },
    errorContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        gap: 12,
        backgroundColor: '#FEE2E2',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#FCA5A5',
    },
    errorText: {
        fontFamily: 'Inter',
        fontSize: 14,
        color: '#DC2626',
        textAlign: 'center',
    },
    retryButton: {
        paddingHorizontal: 16,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        marginTop: 8,
    },
    retryButtonText: {
        fontFamily: 'Inter',
        fontSize: 14,
        color: '#FFFFFF',
    },
    disabledButton: {
        opacity: 0.6,
    },
    submittingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
});
