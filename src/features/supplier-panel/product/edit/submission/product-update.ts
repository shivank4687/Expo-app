import productsApi from '@/services/api/products.api';
import type { CardRefs, ProductType } from '../../shared/types';

export interface UpdateParams {
    refs: CardRefs;
    productType: ProductType;
    productData: any;
    attributeFamilyId: number | null;
}

/**
 * Validates and submits a product update.
 * Mirrors the pattern of add/submission/product-submission.ts.
 *
 * @returns true if the update succeeded, false otherwise
 */
export const handleUpdate = async (
    productId: number,
    params: UpdateParams,
    setIsSubmitting: (value: boolean) => void,
    showToast: (options: { message: string; type: 'success' | 'error' | 'info' }) => void
): Promise<boolean> => {
    const { refs, productType, productData, attributeFamilyId } = params;

    setIsSubmitting(true);

    try {
        // Validate required cards
        const essentialValid = await refs.essentialCardRef.current?.validate();
        const priceStockValid =
            productType === 'simple'
                ? await refs.priceStockCardRef.current?.validate()
                : await refs.priceStockVariantsCardRef.current?.validate();

        if (!essentialValid || !priceStockValid) {
            showToast({
                message: 'Please fill in all required fields correctly.',
                type: 'error',
            });
            return false;
        }

        // Collect data from all cards
        const essentialData = refs.essentialCardRef.current?.getData() || {};
        const priceStockData =
            productType === 'simple'
                ? refs.priceStockCardRef.current?.getData() || {}
                : refs.priceStockVariantsCardRef.current?.getData() || {};
        const detailsData = refs.detailsCardRef.current?.getData() || {};
        const specificationsData = refs.specificationsCardRef.current?.getData() || {};
        const settingsData = refs.settingsCardRef.current?.getData() || {};

        const updateData: Record<string, any> = {
            ...essentialData,
            ...priceStockData,
            ...detailsData,
            ...specificationsData,
            ...settingsData,
            type: productData.type,
            attribute_family_id: attributeFamilyId,
            product_locale: 'all',
        };

        // Configurable products don't have a top-level price (only variants do)
        if (productType === 'configurable' && 'price' in updateData) {
            delete updateData.price;
        }

        await productsApi.updateSupplierProduct(productId, updateData);

        showToast({ message: 'Product updated successfully!', type: 'success' });
        return true;
    } catch (error: any) {
        console.error('Error updating product:', error);
        showToast({
            message: error.message || 'Failed to update product. Please try again.',
            type: 'error',
        });
        return false;
    } finally {
        setIsSubmitting(false);
    }
};
