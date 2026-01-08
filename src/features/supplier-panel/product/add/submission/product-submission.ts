import { Alert } from 'react-native';
import { ProductAttribute } from '../api/product-attributes.api';
import productsApi from '@/services/api/products.api';
import { EssentialCardRef } from '../components/EssentialCard';
import { PriceStockCardRef } from '../components/PriceStockCard';
import { PriceStockVariantsCardRef } from '../components/PriceStockVariantsCard';
import { DetailsCardRef } from '../components/DetailsCard';
import { SettingsCardRef } from '../components/SettingsCard';

export interface SubmissionRefs {
    essentialCardRef: React.RefObject<EssentialCardRef | null>;
    priceStockCardRef: React.RefObject<PriceStockCardRef | null>;
    priceStockVariantsCardRef: React.RefObject<PriceStockVariantsCardRef | null>;
    detailsCardRef: React.RefObject<DetailsCardRef | null>;
    settingsCardRef: React.RefObject<SettingsCardRef | null>;
}

export interface SubmissionParams {
    refs: SubmissionRefs;
    activeTab: 'simple' | 'configurable';
    attributeFamilyId: number | null;
    attributes: ProductAttribute[];
}

/**
 * Validates product attributes based on API metadata
 */
export const validateAttributes = (data: any, attributes: ProductAttribute[]): string[] => {
    const errors: string[] = [];

    // Create a flattened version of the data for easier validation
    const flattenedData = {
        ...data,
        ...(data.size || {}),
    };

    // Check required attributes based on API metadata
    attributes.forEach(attr => {
        if (!(['url_key', 'visible_individually', 'status', 'guest_checkout'].includes(attr.code)) && attr.is_required) {
            const value = flattenedData[attr.code];
            if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
                errors.push(`${attr.admin_name} is required.`);
            }
        }
    });

    // Category check
    if (!data.categories?.parent_id) {
        errors.push('Category is required.');
    }

    return errors;
};

/**
 * Saves product as draft
 */
export const handleSaveDraft = (params: SubmissionParams): void => {
    const { refs, activeTab } = params;

    const essentialData = refs.essentialCardRef.current?.getData();
    const priceStockData = activeTab === 'simple'
        ? refs.priceStockCardRef.current?.getData()
        : refs.priceStockVariantsCardRef.current?.getData();
    const detailsData = refs.detailsCardRef.current?.getData();

    const fullProductData = {
        type: activeTab === 'simple' ? 'simple' : 'configurable',
        ...essentialData,
        ...priceStockData,
        ...detailsData,
        status: 0, // Draft
        created_at: new Date().toISOString(),
    };

    console.log('--- SAVE DRAFT DATA ---');
    console.log(JSON.stringify(fullProductData, null, 2));
    console.log('-----------------------');

    Alert.alert('Success', 'Draft Information saved successfully!');
};

/**
 * Validates and publishes a product
 */
export const handlePublish = async (
    params: SubmissionParams,
    setIsSubmitting: (value: boolean) => void
): Promise<void> => {
    const { refs, activeTab, attributeFamilyId, attributes } = params;

    const essentialData = refs.essentialCardRef.current?.getData();
    const priceStockData = activeTab === 'simple'
        ? refs.priceStockCardRef.current?.getData()
        : refs.priceStockVariantsCardRef.current?.getData();
    const detailsData = refs.detailsCardRef.current?.getData();
    const settingsData = refs.settingsCardRef.current?.getData();

    const fullProductData = {
        type: activeTab,
        attribute_family_id: attributeFamilyId || 1,
        ...essentialData,
        ...priceStockData,
        ...detailsData,
    };

    // Validate required fields in both cards
    const isEssentialValid = refs.essentialCardRef.current?.validate();
    const isPriceStockValid = activeTab === 'simple'
        ? refs.priceStockCardRef.current?.validate()
        : true;

    // Check if any validation failed
    if (!isEssentialValid || !isPriceStockValid) {
        // const errorSections = [];
        // if (!isEssentialValid) errorSections.push('Essential');
        // if (!isPriceStockValid) errorSections.push('Price & Stock');

        // Alert.alert(
        //     'Validation Error',
        //     `Please fill in all required fields in the ${errorSections.join(' and ')} section${errorSections.length > 1 ? 's' : ''}.`
        // );
        return;
    }

    // Validate
    // const validationErrors = validateAttributes(fullProductData, attributes);
    // if (validationErrors.length > 0) {
    //     Alert.alert('Validation Error', validationErrors.join('\n'));
    //     return;
    // }

    try {
        setIsSubmitting(true);
        const defaultAttributes = {
            product_locale: 'all',
            url_key: fullProductData.sku,
            ...settingsData, // Use dynamic settings from the card
            status: 1
        };
        await productsApi.createSupplierProduct({ ...fullProductData, ...defaultAttributes });
        Alert.alert('Success', 'Product published successfully!');
    } catch (err: any) {
        console.error('Error publishing product:', err);
        Alert.alert('Error', err.response?.data?.message || 'Failed to publish product. Please check your inputs.');
    } finally {
        setIsSubmitting(false);
    }
};
