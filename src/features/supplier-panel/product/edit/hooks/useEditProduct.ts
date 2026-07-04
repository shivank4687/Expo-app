import { useState, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import React from 'react';
import productsApi from '@/services/api/products.api';
import { productAttributesApi } from '../../shared/api/product-attributes.api';
import type { ProductAttribute } from '../../shared/api/product-attributes.api';
import type { ProductType } from '../../shared/types';
import type { CardRefs } from '../../shared/types';

interface UseEditProductResult {
    productData: any;
    productType: ProductType;
    productName: string;
    setProductName: (name: string) => void;
    attributes: ProductAttribute[];
    attributeFamilyId: number | null;
    isInitialLoading: boolean;
    fetchError: string | null;
    refreshAttributes: () => Promise<void>;
}

/**
 * Hook that manages all data-fetching and card population for EditProductScreen.
 * Extracts the complex useFocusEffect block from the screen into a reusable hook.
 */
export function useEditProduct(productId: number | null, cardRefs: CardRefs): UseEditProductResult {
    const [productData, setProductData] = useState<any>(null);
    const [productType, setProductType] = useState<ProductType>('simple');
    const [productName, setProductName] = useState('');
    const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
    const [attributeFamilyId, setAttributeFamilyId] = useState<number | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    useFocusEffect(
        React.useCallback(() => {
            let isMounted = true;

            const fetchData = async () => {
                if (!productId) {
                    if (isMounted) {
                        setFetchError('Invalid product ID');
                        setIsInitialLoading(false);
                    }
                    return;
                }

                try {
                    if (isMounted) {
                        setIsInitialLoading(true);
                        setFetchError(null);
                        setProductData(null);
                        setProductName('');
                        setAttributes([]);
                        setAttributeFamilyId(null);
                        setProductType('simple');
                    }

                    // Fetch product to determine its type
                    const product = await productsApi.getSupplierProductById(productId);
                    if (!isMounted) return;

                    setProductData(product);
                    setProductName(product.name || '');

                    const type: ProductType = product.type === 'configurable' ? 'configurable' : 'simple';
                    setProductType(type);

                    // Fetch attributes based on type
                    const attributesData = await productAttributesApi.getProductAttributes(type);
                    if (!isMounted) return;

                    setAttributes(attributesData.attributes);
                    setAttributeFamilyId(attributesData.attribute_family.id);

                    // Stop loading before populating cards
                    setIsInitialLoading(false);

                    // Populate card refs after they've rendered
                    setTimeout(() => {
                        if (!isMounted) return;
                        populateCards(product, type, cardRefs);
                    }, 100);
                } catch (err) {
                    console.error('Error fetching product data:', err);
                    if (isMounted) {
                        setFetchError('Failed to load product data. Please try again.');
                        setIsInitialLoading(false);
                    }
                }
            };

            fetchData();
            return () => { isMounted = false; };
        }, [productId])
    );

    const refreshAttributes = async () => {
        try {
            const attributesData = await productAttributesApi.getProductAttributes(productType);
            setAttributes(attributesData.attributes);
            setAttributeFamilyId(attributesData.attribute_family.id);
        } catch (error) {
            console.error('Error refreshing attributes:', error);
            throw error;
        }
    };

    return {
        productData,
        productType,
        productName,
        setProductName,
        attributes,
        attributeFamilyId,
        isInitialLoading,
        fetchError,
        refreshAttributes,
    };
}

// ---------------------------------------------------------------------------
// Internal: populate all card refs with server data
// ---------------------------------------------------------------------------
function populateCards(product: any, type: ProductType, refs: CardRefs) {
    if (refs.essentialCardRef.current) {
        refs.essentialCardRef.current.updateFields({
            name: product.name || '',
            description: product.description || '',
            short_description: product.short_description || '',
            weight: type === 'simple' ? product.weight?.toString() || '' : '',
            length: type === 'simple' ? product.length?.toString() || '' : '',
            width: type === 'simple' ? product.width?.toString() || '' : '',
            height: type === 'simple' ? product.height?.toString() || '' : '',
            material_type: product.material_type || '',
            manufacturing_origin: product.manufacturing_origin || '',
            images: product.images || [],
            video: product.videos?.[0] || null,
            categories: product.categories || [],
        });
    }

    if (type === 'simple' && refs.priceStockCardRef.current) {
        let discountValue = '';
        let discountType: 'percentage' | 'price' = 'percentage';

        if (product.special_price && product.price) {
            const today = new Date();
            const from = product.special_price_from ? new Date(product.special_price_from) : null;
            const to = product.special_price_to ? new Date(product.special_price_to) : null;
            const isActive = (!from || from <= today) && (!to || to >= today);

            if (isActive) {
                const price = parseFloat(product.price);
                const special = parseFloat(product.special_price);
                const diff = price - special;
                const pct = (diff / price) * 100;

                if (Math.abs(pct - Math.round(pct)) < 0.01) {
                    discountValue = Math.round(pct).toString();
                    discountType = 'percentage';
                } else {
                    discountValue = diff.toFixed(2);
                    discountType = 'price';
                }
            }
        }

        refs.priceStockCardRef.current.updateFields({
            price: product.price?.toString() || '',
            sku: product.sku || '',
            in_order_qty: product.inventories?.[0]?.qty?.toString() || product.in_order_qty?.toString() || '',
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
    } else if (type === 'configurable' && refs.priceStockVariantsCardRef.current) {
        refs.priceStockVariantsCardRef.current.updateFields({
            sku: product.sku || '',
            variants: product.variants || [],
            super_attributes: product.super_attributes || [],
            immediate_shipping: product.immediate_shipping || false,
            made_to_order: product.made_to_order || false,
            in_order_qty: product.in_order_qty?.toString() || '',
            in_order_qty_type: product.in_order_qty_type || '',
            made_to_order_qty: product.made_to_order_qty?.toString() || '',
            made_to_order_days: product.made_to_order_days?.toString() || '',
            height: product.height?.toString() || '',
            weight: product.weight?.toString() || '',
            length: product.length?.toString() || '',
            width: product.width?.toString() || '',
        });
    }

    if (refs.detailsCardRef.current) {
        refs.detailsCardRef.current.updateFields({
            manufacturing_value: product.manufacturing_value || '',
            manufacturing_origin: product.manufacturing_origin || '',
            meta_title: product.meta_title || '',
            meta_keywords: product.meta_keywords || '',
            meta_description: product.meta_description || '',
        });
    }

    if (refs.specificationsCardRef.current) {
        refs.specificationsCardRef.current.updateFields({
            specifications: product.specifications || [],
        });
    }

    if (refs.settingsCardRef.current) {
        refs.settingsCardRef.current.updateFields({
            new: product.new || false,
            featured: product.featured || false,
            guest_checkout: product.guest_checkout || false,
            visible_individually: product.visible_individually !== false,
            status: product.status || false,
        });
    }
}
