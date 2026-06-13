/**
 * Shared types for the product add/edit feature
 */

import React from 'react';
import type { EssentialCardRef } from '../add/components/EssentialCard';
import type { PriceStockCardRef } from '../add/components/PriceStockCard';
import type { PriceStockVariantsCardRef } from '../add/components/PriceStockVariantsCard';
import type { DetailsCardRef } from '../add/components/DetailsCard';
import type { SpecificationsCardRef } from '../add/components/SpecificationsCard';
import type { SettingsCardRef } from '../add/components/SettingsCard';

/** Product type — simple or configurable (with variants) */
export type ProductType = 'simple' | 'configurable';

/** All 6 card refs grouped into one object */
export interface CardRefs {
    essentialCardRef: React.RefObject<EssentialCardRef | null>;
    priceStockCardRef: React.RefObject<PriceStockCardRef | null>;
    priceStockVariantsCardRef: React.RefObject<PriceStockVariantsCardRef | null>;
    detailsCardRef: React.RefObject<DetailsCardRef | null>;
    specificationsCardRef: React.RefObject<SpecificationsCardRef | null>;
    settingsCardRef: React.RefObject<SettingsCardRef | null>;
}

// Re-export attribute types from the shared API for convenience
export type { ProductAttribute, AttributeFamily, ProductAttributesResponse, AttributeOption } from './api/product-attributes.api';
