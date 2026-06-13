import React from 'react';
import {
    EssentialCard,
    PriceStockCard,
    PriceStockVariantsCard,
    DetailsCard,
    SpecificationsCard,
    SettingsCard,
} from '../../add/components';
import type { CardRefs, ProductType } from '../types';
import type { ProductAttribute } from '../api/product-attributes.api';

interface ProductCardSetProps {
    refs: CardRefs;
    attributes: ProductAttribute[];
    productName: string;
    productType: ProductType;
    resetKey?: number;
    onAttributesRefresh: () => Promise<void>;
    onNameChange?: (name: string) => void;
    onAIGenerateClick?: () => void;
}

/**
 * Renders the canonical set of 6 product form cards in the correct order.
 * Shared by AddProductScreen and EditProductScreen.
 *
 * resetKey — when provided and incremented, forces remount of all cards
 *            (used by AddProductScreen on tab switch / screen focus).
 *            EditProductScreen omits it (cards are pre-populated via updateFields).
 */
const ProductCardSet: React.FC<ProductCardSetProps> = ({
    refs,
    attributes,
    productName,
    productType,
    resetKey,
    onAttributesRefresh,
    onNameChange,
    onAIGenerateClick,
}) => {
    const keyPrefix = resetKey !== undefined ? `${resetKey}-` : '';

    return (
        <>
            {/* 1) Essential */}
            <EssentialCard
                ref={refs.essentialCardRef}
                key={`${keyPrefix}essential`}
                attributes={attributes}
                onNameChange={onNameChange}
                onAttributesRefresh={onAttributesRefresh}
                onAIGenerateClick={onAIGenerateClick}
                activeTab={productType}
            />

            {/* 2) Price & Stock — conditional on product type */}
            {productType === 'simple' ? (
                <PriceStockCard
                    ref={refs.priceStockCardRef}
                    key={`${keyPrefix}price-stock`}
                    productName={productName}
                    attributes={attributes}
                />
            ) : (
                <PriceStockVariantsCard
                    ref={refs.priceStockVariantsCardRef}
                    key={`${keyPrefix}price-stock-variants`}
                    productName={productName}
                    attributes={attributes}
                    onAttributesRefresh={onAttributesRefresh}
                />
            )}

            {/* 3) Details */}
            <DetailsCard
                ref={refs.detailsCardRef}
                key={`${keyPrefix}details`}
                attributes={attributes}
                onAttributesRefresh={onAttributesRefresh}
            />

            {/* 4) Specifications */}
            <SpecificationsCard
                ref={refs.specificationsCardRef}
                key={`${keyPrefix}specifications`}
            />

            {/* 5) Settings */}
            <SettingsCard
                ref={refs.settingsCardRef}
                key={`${keyPrefix}settings`}
            />
        </>
    );
};

export default ProductCardSet;
