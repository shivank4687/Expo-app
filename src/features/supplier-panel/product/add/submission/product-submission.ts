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

// validateAttributes and other helpers can stay if needed, but handleSaveDraft is deprecated
// since we now use handlePublish(..., 0) for drafts.

/**
 * Validates and publishes a product
 */
export const handlePublish = async (
    params: SubmissionParams,
    setIsSubmitting: (value: boolean) => void,
    showToast?: (options: { message: string; type: 'success' | 'error' | 'info' }) => void,
    status: number = 1
): Promise<boolean> => {
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
        : refs.priceStockVariantsCardRef.current?.validate();

    // Check if any validation failed
    if (!isEssentialValid || !isPriceStockValid) {
        if (showToast) {
            showToast({
                message: 'Please fill in all required fields correctly.',
                type: 'error',
            });
        }
        return false;
    }

    try {
        setIsSubmitting(true);
        const defaultAttributes = {
            product_locale: 'all',
            url_key: fullProductData.sku,
            ...settingsData, // Use dynamic settings from the card
            status: status
        };

        await productsApi.createSupplierProduct({ ...fullProductData, ...defaultAttributes });

        // Use toast notification instead of Alert
        if (showToast) {
            showToast({
                message: status === 1 ? 'Product published successfully!' : 'Product saved as draft successfully!',
                type: 'success',
            });
        }
        return true;
    } catch (err: any) {
        console.error('❌ Error submitting product:', err);

        // Use toast notification for errors
        if (showToast) {
            showToast({
                message: err.response?.data?.message || `Failed to ${status === 1 ? 'publish' : 'save'} product. Please check your inputs.`,
                type: 'error',
            });
        }
        return false;
    } finally {
        setIsSubmitting(false);
    }
};
