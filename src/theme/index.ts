// Central Theme Export
import { colors } from './colors';
import { typography } from './typography';
import { spacing, borderRadius, shadows } from './spacing';
import { supplierTheme, supplierColors } from './supplierTheme';

export const theme = {
    colors,
    typography,
    spacing,
    borderRadius,
    shadows,
};

export type Theme = typeof theme;

// Re-export for convenience
export { colors, typography, spacing, borderRadius, shadows, supplierTheme, supplierColors };
