import React from 'react';
import { View } from 'react-native';
import {
    ThemeCustomization as ThemeCustomizationType,
    ThemeCustomizationType as CustomizationType,
    ImageCarouselOptions,
    StaticContentOptions,
    CategoryCarouselOptions,
    ProductCarouselOptions,
} from '@/types/theme.types';
import { ImageCarousel } from './ImageCarousel';
import { StaticContent } from './StaticContent';
import { CategoryCarouselCustomization } from './CategoryCarouselCustomization';
import { ProductCarouselCustomization } from './ProductCarouselCustomization';

interface ThemeCustomizationProps {
    customization: ThemeCustomizationType;
}

/**
 * ThemeCustomization Component
 * Renders different types of theme customizations based on the type
 * Mimics the web application's theme customization system
 */
export const ThemeCustomization: React.FC<ThemeCustomizationProps> = ({
    customization,
}) => {
    switch (customization.type) {
        case CustomizationType.IMAGE_CAROUSEL:
            return (
                <ImageCarousel
                    options={customization.options as ImageCarouselOptions}
                />
            );

        case CustomizationType.STATIC_CONTENT:
            return (
                <StaticContent
                    options={customization.options as StaticContentOptions}
                />
            );

        case CustomizationType.CATEGORY_CAROUSEL:
            return (
                <CategoryCarouselCustomization
                    options={customization.options as CategoryCarouselOptions}
                />
            );

        case CustomizationType.PRODUCT_CAROUSEL:
            return (
                <ProductCarouselCustomization
                    options={customization.options as ProductCarouselOptions}
                />
            );

        // FOOTER_LINKS and SERVICES_CONTENT are typically not used on mobile home screen
        case CustomizationType.FOOTER_LINKS:
        case CustomizationType.SERVICES_CONTENT:
            return null;

        default:
            console.warn('Unknown customization type:', customization.type);
            return null;
    }
};

