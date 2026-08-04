import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/features/supplier-panel/styles';
import { Dropdown } from '@/features/supplier-panel/components';
import { AiIcon } from '@/assets/icons';
import { ProductAttribute, productAttributesApi } from '../api/product-attributes.api';
import { InputModal } from '@/shared/components';
import { useToast } from '@/shared/components/Toast';
import * as ImagePicker from 'expo-image-picker';
import { AttachIcon } from '@/assets/icons';
import { useFormValidation } from '@/shared/hooks/useFormValidation';
import { productsApi } from '@/services/api/products.api';
import { useAppSelector } from '@/store/hooks';

export interface PriceStockVariantsCardProps {
    productName: string;
    attributes?: ProductAttribute[];
    onAttributesRefresh?: () => Promise<void>;
}

export interface PriceStockVariantsCardRef {
    getData: () => any;
    validate: () => boolean;
    updateFields: (data: any) => void;
    /**
     * Highlight server-side sync errors on specific fields.
     * Call this after updateFields() so the errors are not cleared.
     * @param fieldErrors - Record<fieldName, string[]> from SyncError.fieldErrors
     */
    highlightSyncErrors: (fieldErrors: Record<string, string[]>) => void;
}

const MAX_VARIANT_IMAGE_SIZE = 1.5 * 1024 * 1024; // 1.5MB

const PriceStockVariantsCard = forwardRef<PriceStockVariantsCardRef, PriceStockVariantsCardProps>(({
    productName,
    attributes = [],
    onAttributesRefresh,
}, ref) => {
    const { supplier } = useAppSelector((state) => state.supplierAuth);
    const shopName = supplier?.company_name || '';

    // Helper to get SKU prefix — strips spaces/special chars before slicing
    // so they never count toward the 3/2 char limit.
    // e.g. "My shop" → "MYS", "A-B C" → "ABC"
    const getSkuPrefix = () => {
        const clean = (str: string, len: number) =>
            str.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, len).padEnd(len, 'X');
        return `${clean(shopName, 3)}-${clean(productName, 2)}-`;
    };

    // Selected attributes for configuration (e.g. Color, Size)
    // Storing IDs as strings
    const [selectedVariantAttributes, setSelectedVariantAttributes] = useState<string[]>([]);

    // Check if Size attribute is selected
    const isSizeVariant = selectedVariantAttributes.some(id => {
        const attr = attributes.find(a => a.id.toString() === id);
        return attr?.code === 'size';
    });

    // Generated Variants
    // Structure: { id: string, attributes: { [attrId]: optionId }, price: string, stock: string, ... }
    const [variants, setVariants] = useState<any[]>([]);
    const [mainVariantId, setMainVariantId] = useState<string | null>(null);

    // Master Product Dimensions (locally managed for configurable products)
    const [masterHeight, setMasterHeight] = useState('');
    const [masterWeight, setMasterWeight] = useState('');
    const [masterLength, setMasterLength] = useState('');
    const [masterWidth, setMasterWidth] = useState('');

    // Temp state for multi-attribute selection
    const [tempSelection, setTempSelection] = useState<Record<string, string>>({});

    // UI States
    const [inStockEnabled, setInStockEnabled] = useState(false);
    const [madeToOrderEnabled, setMadeToOrderEnabled] = useState(false);
    const [isAddingOption, setIsAddingOption] = useState(false);
    const [showOptionModal, setShowOptionModal] = useState(false);
    const [targetAttributeId, setTargetAttributeId] = useState<string | null>(null);
    const [applyToAll, setApplyToAll] = useState(false);

    // Stock and Order States
    const [immediateShipping, setImmediateShipping] = useState(true);
    const [inOrderQty, setInOrderQty] = useState('');
    const [inOrderQtyUnit, setInOrderQtyUnit] = useState('');
    const [madeToOrderQty, setMadeToOrderQty] = useState('');
    const [productionTime, setProductionTime] = useState('');

    // Discount States
    const [discounts, setDiscounts] = useState('');
    const [discountType, setDiscountType] = useState<'percentage' | 'price'>('percentage');

    // SKU States
    const [sku, setSku] = useState('');
    const [isSkuChecking, setIsSkuChecking] = useState(false);
    const [skuExists, setSkuExists] = useState(false);
    const [originalSku, setOriginalSku] = useState<string>(''); // Track original SKU for edit mode

    // Variant validation errors
    // Structure: { variant_0: { price: 'Required', weight: 'Required' }, variant_1: { ... } }
    const [variantErrors, setVariantErrors] = useState<Record<string, Record<string, string>>>({});

    const { showToast } = useToast();

    // Form validation
    const { errors, validate, clearError, setError } = useFormValidation({
        sku: [
            { type: 'required', message: 'SKU is required' },
            { type: 'pattern', value: /^\S*$/, message: 'SKU cannot contain spaces' }
        ],
        weight: [
            { type: 'required', message: 'Weight is required' }
        ],
    });

    // Filter relevant attributes for variants (select/multiselect types)
    // Strictly filtering for Color and Size as per user request to match web app
    const validAttributes = attributes.filter(a =>
        ['color', 'size'].includes(a.code)
    );

    // Unit options from attributes
    const dynamicUnitOptions = attributes.find(a => a.code === 'in_order_qty_type')?.options?.map(o => ({
        label: o.admin_name,
        value: o.id.toString()
    })) || [];

    // Helper to filter numeric input only
    const filterNumericInput = (value: string): string => {
        return value.replace(/[^0-9.]/g, '').replace(/(\\.*)\\./g, '$1');
    };


    // Validate SKU uniqueness
    const validateSkuUniqueness = async (skuValue: string) => {
        if (!skuValue) return true;

        const fullSku = getSkuPrefix() + skuValue;

        // Skip validation if SKU hasn't changed from original (edit mode)
        if (originalSku && fullSku === originalSku) {
            clearError('sku');
            setSkuExists(false);
            return true;
        }

        setIsSkuChecking(true);
        try {
            const exists = await productsApi.checkSkuExists(fullSku);
            setSkuExists(exists);
            if (exists) {
                setError('sku', 'This SKU is already taken');
                return false;
            } else {
                clearError('sku');
                return true;
            }
        } catch (error) {
            console.error('Error checking SKU uniqueness:', error);
            return true; // Assume valid on error
        } finally {
            setIsSkuChecking(false);
        }
    };

    // Re-check SKU if productName changes (affects prefix)
    useEffect(() => {
        if (sku) {
            validateSkuUniqueness(sku);
        }
    }, [productName]);

    useImperativeHandle(ref, () => ({
        getData: () => {
            const masterSku = getSkuPrefix() + sku;

            // Format super_attributes as object with attribute codes as keys
            // Example: { color: [48], size: [6, 47] }
            const superAttributesObj: Record<string, number[]> = {};
            selectedVariantAttributes.forEach(attrId => {
                const attr = attributes.find(a => a.id.toString() === attrId);
                if (attr) {
                    // Get all unique option IDs for this attribute from variants
                    const optionIds = new Set<number>();
                    variants.forEach(v => {
                        if (v.attributes[attrId]) {
                            optionIds.add(parseInt(v.attributes[attrId]));
                        }
                    });
                    superAttributesObj[attr.code] = Array.from(optionIds);
                }
            });

            // Format variants with proper structure
            const formattedVariants: Record<string, any> = {};
            variants.forEach((variant, index) => {
                // Get attribute option labels for name generation
                const variantLabels: string[] = [];
                const variantAttributeValues: Record<string, number> = {};

                selectedVariantAttributes.forEach(attrId => {
                    const attr = attributes.find(a => a.id.toString() === attrId);
                    if (attr && variant.attributes[attrId]) {
                        const optionId = variant.attributes[attrId];
                        const option = attr.options?.find(o => o.id.toString() === optionId);
                        if (option) {
                            variantLabels.push(option.admin_name);
                        }
                        // Store attribute code with option ID for variant
                        variantAttributeValues[attr.code] = parseInt(optionId);
                    }
                });

                // Generate variant SKU: masterSKU-variant-color-size
                const variantSkuSuffix = selectedVariantAttributes
                    .map(attrId => variant.attributes[attrId])
                    .join('-');
                const generatedSku = variant.sku || `${masterSku}-variant-${variantSkuSuffix}`;

                // Generate variant name: "Variant Red Small" or use custom name
                const generatedName = variant.name || `Variant ${variantLabels.join(' ')}`;

                // Use actual variant ID for existing variants (edit mode)
                // Use variant_0, variant_1, etc. for new variants (create mode)
                // Check if variant.id is a database ID (numeric string like "265") vs timestamp (13+ digits)
                const isExistingVariant = variant.id && variant.id.length < 13;
                const variantKey = isExistingVariant ? variant.id : `variant_${index}`;
                const sizeAttributes = isSizeVariant ? {
                    length: variant.length,
                    width: variant.width,
                    height: variant.height,
                    weight: variant.weight,
                } : {
                    length: masterLength,
                    width: masterWidth,
                    height: masterHeight,
                    weight: masterWeight,
                };
                formattedVariants[variantKey] = {
                    sku: generatedSku,
                    name: generatedName,
                    price: variant.price || '',
                    status: 1,
                    ...variantAttributeValues, // Add color: 48, size: 6, etc.
                    inventories: variant.stock ? { 1: variant.stock } : {},
                    // If size is a variant attribute, use variant-specific dimensions
                    // Otherwise, use master product dimensions
                    ...sizeAttributes,
                    // Send all variant images to the API
                    // Map image objects to include uri and id for the API
                    ...(variant.images && variant.images.length > 0 && {
                        images: variant.images.map((img: any) => ({
                            id: img.id,
                            uri: img.uri
                        }))
                    }),
                };
            });

            return {
                sku: masterSku,
                super_attributes: superAttributesObj,
                variants: formattedVariants,
                immediate_shipping: immediateShipping ? 1 : 0,
                in_order_qty: inOrderQty,
                in_order_qty_type: inOrderQtyUnit,
                made_to_order: madeToOrderEnabled ? 1 : 0,
                made_to_order_qty: madeToOrderQty,
                made_to_order_days: productionTime,
                discounts: discounts,
                discount_type: discountType,
                apply_to_all_variants: applyToAll ? 1 : 0,
                height: masterHeight,
                weight: masterWeight,
                length: masterLength,
                width: masterWidth,
            };
        },
        validate: () => {
            console.log('🔍 PriceStockVariantsCard validate() called');
            console.log('Variants count:', variants.length);
            console.log('SKU:', sku);
            console.log('SKU exists:', skuExists);
            console.log('Is size variant:', isSizeVariant);

            const formData = {
                sku,
                weight: !isSizeVariant && selectedVariantAttributes.length > 0 ? masterWeight : '0' // Temporary bypass if not needed
            };
            const isFormValid = validate(formData);
            console.log('Form valid:', isFormValid);

            // Weight is actually required if it's the master dimension being used
            let finalWeightValid = true;
            if (!isSizeVariant && selectedVariantAttributes.length > 0) {
                if (!masterWeight || masterWeight.trim() === '') {
                    setError('weight', 'Weight is required');
                    finalWeightValid = false;
                } else {
                    clearError('weight');
                }
            }

            // Check if SKU already exists
            if (skuExists) {
                setError('sku', 'This SKU is already taken');
            }

            // Validate all variants
            const newVariantErrors: Record<string, Record<string, string>> = {};
            let hasVariantError = false;

            variants.forEach((variant, index) => {
                const variantKey = `variant_${index}`;
                const errors: Record<string, string> = {};

                console.log(`Validating variant ${index}:`, {
                    price: variant.price,
                    weight: variant.weight,
                    stock: variant.stock,
                    isSizeVariant
                });

                // Always required fields
                if (!variant.price || variant.price.trim() === '') {
                    errors.price = 'Price is required';
                    hasVariantError = true;
                    console.log(`❌ Variant ${index}: Price missing`);
                }
                if (!variant.stock || variant.stock.trim() === '') {
                    errors.stock = 'Stock is required';
                    hasVariantError = true;
                    console.log(`❌ Variant ${index}: Stock missing`);
                }

                // Weight is only required if size attribute is selected
                if (isSizeVariant) {
                    if (!variant.weight || variant.weight.trim() === '') {
                        errors.weight = 'Weight is required';
                        hasVariantError = true;
                        console.log(`❌ Variant ${index}: Weight missing (size variant)`);
                    }
                }

                // Optional dimension fields - only validate if size variant is selected
                if (isSizeVariant) {
                    // Dimensions are optional, no validation needed
                }

                if (Object.keys(errors).length > 0) {
                    newVariantErrors[variantKey] = errors;
                }
            });

            setVariantErrors(newVariantErrors);

            const finalResult = isFormValid && !skuExists && !hasVariantError && finalWeightValid;
            console.log('Final validation result:', finalResult);
            console.log('Has variant errors:', hasVariantError);

            return finalResult;
        },
        /**
         * Apply server-side sync validation errors directly to form fields.
         * Re-uses the existing useFormValidation error state so the same
         * red-border + error-text UI appears as with normal validation.
         * The errors auto-clear when the supplier edits the field.
         */
        highlightSyncErrors: (fieldErrors: Record<string, string[]>) => {
            if (fieldErrors.sku?.length) {
                setError('sku', fieldErrors.sku[0]);
                // Also mark skuExists so validate() blocks submission
                setSkuExists(true);
            }
        },
        updateFields: (data: any) => {
            console.log('📦 PriceStockVariantsCard updateFields called', data);

            // Reset all state first to prevent stale data
            setSku('');
            setOriginalSku('');
            setMasterHeight('');
            setMasterWeight('');
            setMasterLength('');
            setMasterWidth('');
            setImmediateShipping(true);
            setMadeToOrderEnabled(false);
            setInOrderQty('');
            setInOrderQtyUnit('');
            setMadeToOrderQty('');
            setProductionTime('');
            setDiscounts('');
            setDiscountType('percentage');
            setSelectedVariantAttributes([]);
            setVariants([]);
            setSkuExists(false);
            clearError('sku');

            // Now populate with new data
            if (data.sku !== undefined) {
                const skuWithoutPrefix = data.sku.replace(getSkuPrefix(), '');
                setSku(skuWithoutPrefix);
                // Store original SKU when loading product data (edit mode)
                setOriginalSku(data.sku);
            }

            if (data.height !== undefined) setMasterHeight(data.height?.toString() || '');
            if (data.weight !== undefined) setMasterWeight(data.weight?.toString() || '');
            if (data.length !== undefined) setMasterLength(data.length?.toString() || '');
            if (data.width !== undefined) setMasterWidth(data.width?.toString() || '');

            if (data.immediate_shipping !== undefined) setImmediateShipping(true);
            if (data.made_to_order !== undefined) setMadeToOrderEnabled(!!data.made_to_order);
            if (data.in_order_qty !== undefined) setInOrderQty(data.in_order_qty);
            if (data.in_order_qty_type !== undefined) setInOrderQtyUnit(data.in_order_qty_type?.toString() || '');
            if (data.made_to_order_qty !== undefined) setMadeToOrderQty(data.made_to_order_qty);
            if (data.made_to_order_days !== undefined) setProductionTime(data.made_to_order_days);
            if (data.discounts !== undefined) setDiscounts(data.discounts);
            if (data.discount_type !== undefined) setDiscountType(data.discount_type);
            if (data.apply_to_all_variants !== undefined) setApplyToAll(!!data.apply_to_all_variants);

            if (data.super_attributes && Array.isArray(data.super_attributes)) {
                const variantAttrIds = data.super_attributes.map((attr: any) => attr.id.toString());
                setSelectedVariantAttributes(variantAttrIds);
            } else if (data.super_attributes && typeof data.super_attributes === 'object') {
                const variantAttrIds: string[] = [];
                Object.keys(data.super_attributes).forEach(code => {
                    const attr = attributes.find(a => a.code === code);
                    if (attr) {
                        variantAttrIds.push(attr.id.toString());
                    }
                });
                setSelectedVariantAttributes(variantAttrIds);
            } else if (data.variants) {
                const variantList = Array.isArray(data.variants)
                    ? data.variants
                    : Object.values(data.variants);
                if (variantList.length > 0) {
                    const firstVariant = variantList[0];
                    const variantAttrIds: string[] = [];
                    attributes.forEach(attr => {
                        if (firstVariant[attr.code] !== undefined) {
                            variantAttrIds.push(attr.id.toString());
                        }
                    });
                    setSelectedVariantAttributes(variantAttrIds);
                }
            }

            if (data.variants) {
                const variantsArray = Array.isArray(data.variants)
                    ? data.variants
                    : Object.entries(data.variants).map(([key, value]: [string, any]) => ({
                        id: key,
                        ...value
                    }));

                const mappedVariants = variantsArray.map((v: any, index: number) => {
                    const variantAttrs: Record<string, string> = {};
                    attributes.forEach(attr => {
                        if (v[attr.code] !== undefined && v[attr.code] !== null) {
                            variantAttrs[attr.id.toString()] = v[attr.code].toString();
                        }
                    });

                    return {
                        id: v.id ? v.id.toString() : `variant_${index}`,
                        sku: v.sku,
                        name: v.name,
                        price: v.price?.toString() || '',
                        stock: (() => {
                            if (v.inventories !== undefined) {
                                if (Array.isArray(v.inventories)) {
                                    return v.inventories[0]?.qty?.toString() || '0';
                                } else if (typeof v.inventories === 'object' && v.inventories !== null) {
                                    const keys = Object.keys(v.inventories);
                                    if (keys.length > 0) {
                                        return v.inventories[keys[0]]?.toString() || '0';
                                    }
                                }
                            }
                            return v.stock?.toString() || '0';
                        })(),
                        weight: v.weight?.toString() || '0',
                        length: v.length?.toString() || '',
                        width: v.width?.toString() || '',
                        height: v.height?.toString() || '',
                        attributes: variantAttrs,
                        images: v.images?.length > 0
                            ? v.images.map((img: any) => ({ uri: img.url || img.uri, id: img.id }))
                            : (v.base_image ? [{ uri: v.base_image.original_image_url }] : [])
                    };
                });
                setVariants(mappedVariants);
            }
        }
    }), [sku, variants, selectedVariantAttributes, attributes, immediateShipping, inOrderQty, inOrderQtyUnit, madeToOrderEnabled, madeToOrderQty, productionTime, discounts, discountType, skuExists, originalSku, applyToAll, masterHeight, masterWeight, masterLength, masterWidth, isSizeVariant]);

    // Reset variants when variant group changes
    useEffect(() => {
        setVariants(prev => prev.filter(v => {
            // Keep variant only if it has keys for all selected attributes
            return selectedVariantAttributes.every(attrId => v.attributes && v.attributes[attrId]);
        }));
    }, [selectedVariantAttributes]);


    const handleAddVariantOption = async (optionName: string) => {
        if (!targetAttributeId) return;

        setIsAddingOption(true);
        try {
            const attr = attributes.find(a => a.id.toString() === targetAttributeId);
            if (!attr) throw new Error('Attribute not found');

            const newOption = await productAttributesApi.createAttributeOption(
                attr.code,
                optionName
            );

            if (onAttributesRefresh) {
                await onAttributesRefresh();
            }

            // Auto-select the new option if in Single Attribute Mode
            if (selectedVariantAttributes.length === 1) {
                toggleVariantSingleAttr(targetAttributeId, newOption.id.toString());
            }

            showToast({
                message: `Option "${optionName}" added successfully!`,
                type: 'success',
            });

        } catch (error) {
            console.error('Error adding option:', error);
            showToast({
                message: 'Failed to add option.',
                type: 'error',
            });
        } finally {
            setIsAddingOption(false);
            setShowOptionModal(false);
        }
    };

    const toggleVariantSingleAttr = (attrId: string, optionId: string) => {
        // Check if variant exists
        const exists = variants.find(v => v.attributes[attrId] === optionId);

        if (exists) {
            // Remove
            setVariants(prev => prev.filter(v => v.id !== exists.id));
            if (mainVariantId === exists.id) setMainVariantId(null);
        } else {
            // Auto-generate variant name from option label
            const attr = attributes.find(a => a.id.toString() === attrId);
            const option = attr?.options?.find(o => o.id.toString() === optionId);
            const autoName = option?.admin_name || '';

            // Add
            const newVariant = {
                id: Date.now().toString(),
                name: autoName,
                attributes: { [attrId]: optionId },
                sku: '',
                price: '',
                stock: '',
                weight: '',
                length: '',
                width: '',
                height: '',
                images: [],
            };
            setVariants(prev => [...prev, newVariant]);
            if (!mainVariantId) setMainVariantId(newVariant.id);
        }
    };

    const addMultiAttrVariant = () => {
        // Check if all selected attributes have a value in tempSelection
        const allSelected = selectedVariantAttributes.every(id => tempSelection[id]);
        if (!allSelected) {
            showToast({
                message: 'Please select values for all attributes.',
                type: 'warning',
            });
            return;
        }

        // Check if duplicate
        const isDuplicate = variants.some(v =>
            selectedVariantAttributes.every(attrId => v.attributes[attrId] === tempSelection[attrId])
        );

        if (isDuplicate) {
            showToast({
                message: 'This variant already exists.',
                type: 'warning',
            });
            return;
        }

        // Auto-generate variant name from selected option labels
        const autoName = selectedVariantAttributes.map(attrId => {
            const attr = attributes.find(a => a.id.toString() === attrId);
            const option = attr?.options?.find(o => o.id.toString() === tempSelection[attrId]);
            return option?.admin_name || '';
        }).filter(Boolean).join(' - ');

        const newVariant = {
            id: Date.now().toString(),
            name: autoName,
            attributes: { ...tempSelection },
            sku: '',
            price: '',
            stock: '',
            weight: '',
            length: '',
            width: '',
            height: '',
            images: [],
        };

        setVariants(prev => [...prev, newVariant]);
        if (!mainVariantId) setMainVariantId(newVariant.id);
    };

    const removeVariant = (id: string) => {
        setVariants(prev => prev.filter(v => v.id !== id));
        if (mainVariantId === id) setMainVariantId(null);
    };

    const updateVariantField = (id: string, field: string, value: any) => {
        setVariants(prev => prev.map(v =>
            v.id === id ? { ...v, [field]: value } : v
        ));
    };

    const pickVariantImage = async (variantId: string) => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                showToast({
                    message: 'Please grant permission to access your media library.',
                    type: 'warning',
                });
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1], // Square aspect ratio for variant images
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const fileSize = result.assets[0].fileSize || 0;
                if (fileSize > MAX_VARIANT_IMAGE_SIZE) {
                    showToast({
                        message: 'Image size exceeds 1.5MB limit.',
                        type: 'warning',
                    });
                    return;
                }
                const newImage = { uri: result.assets[0].uri };
                setVariants(prev => prev.map(v => {
                    if (v.id === variantId) {
                        const newImages = [...(v.images || [])];
                        if (newImages.length > 0) {
                            newImages[0] = newImage;
                        } else {
                            newImages.push(newImage);
                        }
                        return { ...v, images: newImages };
                    }
                    return v;
                }));
            }
        } catch (error) {
            console.error('Error picking image:', error);
            showToast({
                message: 'Failed to pick image.',
                type: 'error',
            });
        }
    };

    const takeVariantPhoto = async (variantId: string) => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                showToast({
                    message: 'Please grant permission to access your camera.',
                    type: 'warning',
                });
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const fileSize = result.assets[0].fileSize || 0;
                if (fileSize > MAX_VARIANT_IMAGE_SIZE) {
                    showToast({
                        message: 'Image size exceeds 1.5MB limit.',
                        type: 'warning',
                    });
                    return;
                }
                const newImage = { uri: result.assets[0].uri };
                setVariants(prev => prev.map(v => {
                    if (v.id === variantId) {
                        const newImages = [...(v.images || [])];
                        if (newImages.length > 0) {
                            newImages[0] = newImage;
                        } else {
                            newImages.push(newImage);
                        }
                        return { ...v, images: newImages };
                    }
                    return v;
                }));
            }
        } catch (error) {
            console.error('Error taking photo:', error);
            showToast({
                message: 'Failed to take photo.',
                type: 'error',
            });
        }
    };

    const removeVariantImage = (variantId: string) => {
        setVariants(prev => prev.map(v => {
            if (v.id === variantId) {
                const newImages = [...(v.images || [])];
                if (newImages.length > 0) {
                    newImages.splice(0, 1); // Remove only the first photo as requested
                }
                return { ...v, images: newImages };
            }
            return v;
        }));
    };

    const isOptionSelected = (attrId: string, optionId: string) => {
        return variants.some(v => v.attributes[attrId] === optionId);
    };

    const getVariantLabel = (variant: any) => {
        return selectedVariantAttributes.map(attrId => {
            const attr = attributes.find(a => a.id.toString() === attrId);
            const opt = attr?.options?.find(o => o.id.toString() === variant.attributes[attrId]);
            return opt?.admin_name || '?';
        }).join(' - ');
    };

    return (
        <View style={styles.card}>
            {/* Card Title */}
            <Text style={styles.cardTitle}>2) Price & Stock & Variants</Text>

            {/* SKU Section */}
            <View style={styles.section}>
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
                            value={sku}
                            onChangeText={(val) => {
                                setSku(val);
                                if (skuExists) setSkuExists(false);
                                if (errors.sku) clearError('sku');
                            }}
                            onBlur={() => validateSkuUniqueness(sku)}
                        />
                    </View>
                    {/* {isSkuChecking && <Text style={styles.checkingText}>Checking SKU availability...</Text>} */}
                    {errors.sku && <Text style={styles.errorText}>{errors.sku}</Text>}
                </View>
            </View>

            {/* Master Size and Weight Section - Only show when attributes are selected but size is NOT one of them */}
            {selectedVariantAttributes.length > 0 && !isSizeVariant && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Master Size and Weight</Text>

                    <View style={styles.gridInputs}>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.gridInput}
                                placeholder="Length (cm)"
                                placeholderTextColor="#666666"
                                value={masterLength}
                                onChangeText={setMasterLength}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.gridInput}
                                placeholder="Width (cm)"
                                placeholderTextColor="#666666"
                                value={masterWidth}
                                onChangeText={setMasterWidth}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.gridInput}
                                placeholder="Height (cm)"
                                placeholderTextColor="#666666"
                                value={masterHeight}
                                onChangeText={setMasterHeight}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={[styles.gridInput, errors.weight && styles.inputError]}
                                placeholder="Weight (kg)"
                                placeholderTextColor="#666666"
                                value={masterWeight}
                                onChangeText={(v) => {
                                    setMasterWeight(v);
                                    if (errors.weight) clearError('weight');
                                }}
                                keyboardType="numeric"
                            />
                            {errors.weight && <Text style={styles.errorText}>{errors.weight}</Text>}
                        </View>
                    </View>

                    <Text style={styles.tipText}>
                        This improves the automatic shipping quote.
                    </Text>
                </View>
            )}

            {/* Variant Group Section */}
            <View style={styles.section}>
                <View style={styles.inputGroup}>
                    <Text style={styles.sectionTitle}>Variant Group</Text>
                    <Text style={styles.tipText}>Choose or create your group.</Text>
                    <Dropdown
                        placeholder="Choose attributes (e.g. Color, Size)..."
                        options={validAttributes.map(a => ({ label: a.admin_name, value: a.id.toString() }))}
                        value={selectedVariantAttributes}
                        onSelect={setSelectedVariantAttributes}
                        multiple
                    />
                </View>
            </View>

            {/* Values Section */}
            <View style={styles.section}>
                <View style={styles.valuesHeader}>
                    <Text style={styles.sectionTitle}>Values</Text>
                    <Text style={styles.tipText}>
                        {selectedVariantAttributes.length > 1
                            ? 'Select values and click Add Variant.'
                            : 'Tap a value to add/remove it as a variant.'}
                    </Text>
                </View>

                {/* Single Attribute Selection */}
                {selectedVariantAttributes.length === 1 && (() => {
                    const attrId = selectedVariantAttributes[0];
                    const attr = attributes.find(a => a.id.toString() === attrId);

                    if (!attr) return null;

                    return (
                        <View style={styles.chipsContainer}>
                            {(attr.options || []).map((option, index) => {
                                const selected = isOptionSelected(attrId, option.id.toString());
                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.chip,
                                            selected && styles.chipActive
                                        ]}
                                        onPress={() => toggleVariantSingleAttr(attrId, option.id.toString())}
                                    >
                                        <Text style={styles.chipText}>{option.admin_name}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                            <TouchableOpacity
                                style={styles.addChipButton}
                                onPress={() => {
                                    setTargetAttributeId(attrId);
                                    setShowOptionModal(true);
                                }}
                            >
                                <Ionicons name="add" size={24} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    );
                })()}

                {/* Multiple Attribute Selection */}
                {selectedVariantAttributes.length > 1 && (
                    <View style={styles.multiSelectContainer}>
                        {selectedVariantAttributes.map(attrId => {
                            const attr = attributes.find(a => a.id.toString() === attrId);
                            return (
                                <View key={attrId} style={styles.inputGroup}>
                                    <Text style={styles.label}>{attr?.admin_name}</Text>
                                    <Dropdown
                                        placeholder={`Select ${attr?.admin_name}...`}
                                        options={(attr?.options || []).map(o => ({ label: o.admin_name, value: o.id.toString() }))}
                                        value={tempSelection[attrId] || ''}
                                        onSelect={(val) => setTempSelection(prev => ({ ...prev, [attrId]: val }))}
                                    />
                                </View>
                            );
                        })}
                        <TouchableOpacity style={styles.addButton} onPress={addMultiAttrVariant}>
                            <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                            <Text style={styles.addButtonText}>Add Variant</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* AI Suggestion */}
                {/* <TouchableOpacity style={styles.aiButton}>
                    <AiIcon width={16} height={16} color="#000000" />
                    <Text style={styles.buttonText}>Auto-generate information</Text>
                </TouchableOpacity> */}
            </View>

            {/* Main Variant Selector */}
            {variants.length > 0 && (
                <View style={styles.section}>
                    <View style={styles.valuesHeader}>
                        <Text style={styles.sectionTitle}>Main Variant (Default)</Text>
                        <Text style={styles.tipText}>Select the default variant to show.</Text>
                    </View>

                    <View style={styles.variantChipsContainer}>
                        {variants.map((variant, index) => (
                            <TouchableOpacity
                                key={variant.id}
                                style={[
                                    styles.variantChip,
                                    mainVariantId === variant.id && styles.chipActive
                                ]}
                                onPress={() => setMainVariantId(variant.id)}
                            >
                                <Text style={styles.chipText}>{getVariantLabel(variant)}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {/* Generated Variants Editors */}
            {variants.map((variant, index) => (
                <View key={variant.id} style={styles.variantEditorCard}>
                    <View style={styles.variantHeader}>
                        <View style={styles.variantHeaderLeft}>
                            <Text style={styles.variantAttrLabel}>{getVariantLabel(variant)}</Text>
                            <TextInput
                                style={styles.variantNameInput}
                                value={variant.name || ''}
                                onChangeText={v => updateVariantField(variant.id, 'name', v)}
                                placeholder="Variant name..."
                                placeholderTextColor="#999999"
                            />
                        </View>
                        <TouchableOpacity onPress={() => removeVariant(variant.id)}>
                            <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                        </TouchableOpacity>
                    </View>


                    <View style={styles.rowInputs}>
                        <View style={styles.halfInputContainer}>
                            <Text style={styles.sectionTitle}>Price</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    variantErrors[`variant_${index}`]?.price && styles.inputError
                                ]}
                                placeholder="Price"
                                placeholderTextColor="#666666"
                                keyboardType="numeric"
                                value={variant.price}
                                onChangeText={v => {
                                    const filtered = filterNumericInput(v);
                                    updateVariantField(variant.id, 'price', filtered);
                                    // Clear error
                                    if (variantErrors[`variant_${index}`]?.price) {
                                        setVariantErrors(prev => {
                                            const newErrors = { ...prev };
                                            if (newErrors[`variant_${index}`]) {
                                                delete newErrors[`variant_${index}`].price;
                                                if (Object.keys(newErrors[`variant_${index}`]).length === 0) {
                                                    delete newErrors[`variant_${index}`];
                                                }
                                            }
                                            return newErrors;
                                        });
                                    }
                                }}
                            />
                            {variantErrors[`variant_${index}`]?.price && (
                                <Text style={styles.errorText}>{variantErrors[`variant_${index}`].price}</Text>
                            )}
                        </View>
                        <View style={styles.halfInputContainer}>
                            <Text style={styles.sectionTitle}>Stock</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    variantErrors[`variant_${index}`]?.stock && styles.inputError
                                ]}
                                placeholder="Qty"
                                placeholderTextColor="#666666"
                                keyboardType="numeric"
                                value={variant.stock}
                                onChangeText={v => {
                                    const filtered = filterNumericInput(v);
                                    updateVariantField(variant.id, 'stock', filtered);
                                    // Clear error
                                    if (variantErrors[`variant_${index}`]?.stock) {
                                        setVariantErrors(prev => {
                                            const newErrors = { ...prev };
                                            if (newErrors[`variant_${index}`]) {
                                                delete newErrors[`variant_${index}`].stock;
                                                if (Object.keys(newErrors[`variant_${index}`]).length === 0) {
                                                    delete newErrors[`variant_${index}`];
                                                }
                                            }
                                            return newErrors;
                                        });
                                    }
                                }}
                            />
                            {variantErrors[`variant_${index}`]?.stock && (
                                <Text style={styles.errorText}>{variantErrors[`variant_${index}`].stock}</Text>
                            )}
                        </View>
                    </View>

                    {/* Size and Weight Inputs - Only if Size attribute is selected */}
                    {isSizeVariant && (
                        <View style={styles.sizeWeightSection}>
                            <Text style={styles.subSectionTitle}>Size and Weight</Text>
                            <View style={styles.gridInputs}>
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.gridInput}
                                        placeholder="Length (cm)"
                                        placeholderTextColor="#666666"
                                        keyboardType="numeric"
                                        value={variant.length}
                                        onChangeText={v => updateVariantField(variant.id, 'length', filterNumericInput(v))}
                                    />
                                </View>
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.gridInput}
                                        placeholder="Width (cm)"
                                        placeholderTextColor="#666666"
                                        keyboardType="numeric"
                                        value={variant.width}
                                        onChangeText={v => updateVariantField(variant.id, 'width', filterNumericInput(v))}
                                    />
                                </View>
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.gridInput}
                                        placeholder="Height (cm)"
                                        placeholderTextColor="#666666"
                                        keyboardType="numeric"
                                        value={variant.height}
                                        onChangeText={v => updateVariantField(variant.id, 'height', filterNumericInput(v))}
                                    />
                                </View>
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={[
                                            styles.gridInput,
                                            variantErrors[`variant_${index}`]?.weight && styles.inputError
                                        ]}
                                        placeholder="Weight (kg)"
                                        placeholderTextColor="#666666"
                                        keyboardType="numeric"
                                        value={variant.weight}
                                        onChangeText={v => {
                                            const filtered = filterNumericInput(v);
                                            updateVariantField(variant.id, 'weight', filtered);
                                            // Clear error
                                            if (variantErrors[`variant_${index}`]?.weight) {
                                                setVariantErrors(prev => {
                                                    const newErrors = { ...prev };
                                                    if (newErrors[`variant_${index}`]) {
                                                        delete newErrors[`variant_${index}`].weight;
                                                        if (Object.keys(newErrors[`variant_${index}`]).length === 0) {
                                                            delete newErrors[`variant_${index}`];
                                                        }
                                                    }
                                                    return newErrors;
                                                });
                                            }
                                        }}
                                    />
                                    {variantErrors[`variant_${index}`]?.weight && (
                                        <Text style={styles.errorText}>{variantErrors[`variant_${index}`].weight}</Text>
                                    )}
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Variant Image Section */}
                    <View style={styles.imageSection}>
                        <View style={styles.imageButtonsContainer}>
                            <TouchableOpacity
                                style={styles.uploadButton}
                                onPress={() => pickVariantImage(variant.id)}
                            >
                                <AttachIcon width={16} height={16} />
                                <Text style={styles.uploadButtonText}>Select Photo</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.uploadButton}
                                onPress={() => takeVariantPhoto(variant.id)}
                            >
                                <Ionicons name="camera" size={16} color="#000000" />
                                <Text style={styles.uploadButtonText}>Take Photo</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.imagePreviewContainer}>
                            {variant.images && variant.images.length > 0 ? (
                                <View style={styles.previewWrapper}>
                                    <Image source={{ uri: variant.images[0].uri }} style={styles.previewImage} />
                                    <TouchableOpacity
                                        style={styles.removeImageButton}
                                        onPress={() => removeVariantImage(variant.id)}
                                    >
                                        <Ionicons name="close-circle" size={20} color="#DC2626" />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.placeholderWrapper}>
                                    <Ionicons name="image-outline" size={30} color="#CCCCCC" />
                                    <Text style={styles.placeholderText}>No Image</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            ))}

            {/* In Stock (Immediate Shipping) Section */}
            <View style={styles.borderedSection}>
                <View style={styles.checkboxRow}>
                    <TouchableOpacity
                        style={styles.checkbox}
                        disabled={true}
                    >
                        {immediateShipping && <View style={styles.checkboxChecked} />}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.checkboxContent}
                        disabled={true}
                        activeOpacity={1}
                    >
                        <Text style={styles.sectionTitle}>In Stock (Immediate Shipping)</Text>
                        <Text style={styles.tipText}>
                            A "4" icon will be displayed on the photo when Quantity {'>'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {immediateShipping && (
                    <View style={styles.inputGroup}>
                        <Text style={styles.sectionTitle}>Quantity in Stock</Text>
                        <View style={styles.rowInputs}>
                            <TextInput
                                style={styles.halfInput}
                                placeholder="Quantity"
                                placeholderTextColor="#666666"
                                value={inOrderQty}
                                onChangeText={(val) => setInOrderQty(filterNumericInput(val))}
                                keyboardType="decimal-pad"
                            />
                            <View style={{ flex: 1 }}>
                                <Dropdown
                                    placeholder="Unit"
                                    options={dynamicUnitOptions}
                                    value={inOrderQtyUnit}
                                    onSelect={setInOrderQtyUnit}
                                />
                            </View>
                        </View>
                    </View>
                )}
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
                    <TouchableOpacity
                        style={styles.checkboxContent}
                        onPress={() => setMadeToOrderEnabled(!madeToOrderEnabled)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.sectionTitle}>Made to Order (Made to Order) if necessary</Text>
                        <Text style={styles.tipText}>
                            If Quantity in Stock = 0 (or is insufficient), the buyer will see "Made to Order, production time." with the
                        </Text>
                    </TouchableOpacity>
                </View>

                {madeToOrderEnabled && (
                    <>
                        <View style={styles.inputGroup}>
                            <Text style={styles.sectionTitle}>Quantity (Made to Order)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Quantity"
                                placeholderTextColor="#666666"
                                value={madeToOrderQty}
                                onChangeText={(val) => setMadeToOrderQty(filterNumericInput(val))}
                                keyboardType="decimal-pad"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.sectionTitle}>Production Time (days)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Production Time"
                                placeholderTextColor="#666666"
                                value={productionTime}
                                onChangeText={(val) => setProductionTime(filterNumericInput(val))}
                                keyboardType="decimal-pad"
                            />
                        </View>
                    </>
                )}
            </View>

            {/* Discounts Section */}
            <View style={styles.section}>
                <View style={styles.inputGroup}>
                    <Text style={styles.sectionTitle}>Discounts (Optional)</Text>
                    <View style={styles.discountInputContainer}>
                        <TextInput
                            style={styles.discountInput}
                            placeholder="Enter discount value"
                            placeholderTextColor="#666666"
                            value={discounts}
                            onChangeText={(val) => setDiscounts(filterNumericInput(val))}
                            keyboardType="decimal-pad"
                        />
                        <TouchableOpacity
                            style={styles.discountToggle}
                            onPress={() => {
                                const newType = discountType === 'percentage' ? 'price' : 'percentage';
                                setDiscountType(newType);
                            }}
                        >
                            <Text style={styles.discountToggleText}>
                                {discountType === 'percentage' ? '%' : '$'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* <TouchableOpacity style={styles.aiButton}>
                    <AiIcon width={16} height={16} color="#000000" />
                    <Text style={styles.buttonText}>Standard Price</Text>
                </TouchableOpacity> */}

                <Text style={styles.tipText}>
                    We recommend applying a progressive price based on quantities to encourage larger and recurring orders.
                </Text>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => setApplyToAll(!applyToAll)}
                    activeOpacity={0.7}
                >
                    <View style={styles.checkbox}>
                        {applyToAll && <View style={styles.checkboxChecked} />}
                    </View>
                    <Text style={styles.applyToAllText}>Apply to all variants</Text>
                </TouchableOpacity>

                {/* <TouchableOpacity style={styles.publishButton}>
                    <Text style={styles.publishButtonText}>Save</Text>
                </TouchableOpacity> */}
            </View>

            {/* Option Creation Modal */}
            <InputModal
                visible={showOptionModal}
                onClose={() => setShowOptionModal(false)}
                onSubmit={handleAddVariantOption}
                title={`Add ${targetAttributeId ? attributes.find(a => a.id.toString() === targetAttributeId)?.admin_name : 'Option'}`}
                placeholder="Option name..."
                submitButtonText="Add Option"
                isLoading={isAddingOption}
            />
        </View >
    );
});

export default PriceStockVariantsCard;

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
        marginBottom: 8,
        color: '#000000',
    },
    section: {
        flexDirection: 'column',
        gap: 8,
        width: '100%',
    },
    sectionTitle: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 16,
        color: '#000000',
    },
    valuesHeader: {
        marginBottom: 4,
    },
    tipText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 14,
        color: '#666666',
    },
    inputGroup: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 8,
        width: '100%',
    },
    input: {
        width: '100%',
        height: 40,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontFamily: 'Inter',
        fontSize: 16,
        color: '#000000',
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
        minWidth: 40,
        alignItems: 'center',
    },
    chipActive: {
        backgroundColor: COLORS.primaryLight,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    chipText: {
        fontFamily: 'Inter',
        fontSize: 14,
        color: '#000000',
    },
    addChipButton: {
        width: 40,
        height: 36, // Approximate height to match chips
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    multiSelectContainer: {
        gap: 12,
        padding: 12,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        padding: 10,
        borderRadius: 8,
        gap: 8,
        marginTop: 8,
    },
    addButtonText: {
        color: '#FFF',
        fontWeight: '600',
        fontFamily: 'Inter',
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
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 16,
        lineHeight: 16,
        color: '#000000',
    },
    variantChipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8
    },
    variantChip: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    variantEditorCard: {
        padding: 12,
        backgroundColor: '#FAFAFA',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#EEEEEE',
        gap: 12,
    },
    variantHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
    },
    variantHeaderLeft: {
        flex: 1,
        flexDirection: 'column',
        gap: 4,
    },
    variantAttrLabel: {
        fontWeight: '500',
        fontSize: 12,
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    variantNameInput: {
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Inter',
        color: '#1F2937',
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        height: 38,
    },
    rowInputs: {
        flexDirection: 'row',
        gap: 12,
    },
    halfInputContainer: {
        flex: 1,
        gap: 8,
    },
    footer: {
        marginTop: 16,
        gap: 12,
    },
    applyToAllText: {
        fontFamily: 'Inter',
        fontSize: 14,
        fontWeight: '500',
        color: '#000000',
    },
    publishButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        height: 44,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
    },
    publishButtonText: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 16,
        color: '#F5F5F5',
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
    },
    sizeWeightSection: {
        marginTop: 8,
        gap: 8,
    },
    subSectionTitle: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 16,
        color: '#000000',
    },
    gridInputs: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    inputWrapper: {
        width: '48%', // Approx half with gap
        minWidth: 140,
        flexGrow: 1,
    },
    gridInput: {
        width: '100%',
        height: 40,
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontFamily: 'Inter',
        fontSize: 16,
        color: '#000000',
    },
    imageSection: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
        height: 100, // Fixed height for the image section
    },
    imageButtonsContainer: {
        flex: 1,
        flexDirection: 'column', // Buttons stacked vertically as requested ("half width left side button...")
        justifyContent: 'space-between',
        gap: 8,
    },
    uploadButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EEEEEF',
        borderRadius: 8,
        paddingHorizontal: 8,
        gap: 6,
    },
    uploadButtonText: {
        fontFamily: 'Inter',
        fontSize: 13,
        fontWeight: '500',
        color: '#000000',
    },
    imagePreviewContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        overflow: 'hidden',
    },
    previewWrapper: {
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    previewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    removeImageButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
    },
    placeholderWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    placeholderText: {
        fontFamily: 'Inter',
        fontSize: 12,
        color: '#9CA3AF',
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
    inputError: {
        borderWidth: 1,
        borderColor: '#EF4444',
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
    checkingText: {
        fontFamily: 'Inter',
        fontStyle: 'normal',
        fontWeight: '400',
        fontSize: 12,
        lineHeight: 16,
        color: COLORS.primary,
        marginTop: 4,
    },
});
