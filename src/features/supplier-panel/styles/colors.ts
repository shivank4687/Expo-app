/**
 * Centralized Color Constants for Supplier Panel
 * 
 * All colors used in the supplier panel should be defined here
 * to ensure consistency across all screens and components.
 */

import { supplierTheme } from '@/theme';

const { colors } = supplierTheme;
const { primary, background, text, border, success, error, warning, info } = colors;

export const COLORS = {
    // Primary Brand Colors
    primary: primary[500],
    primaryLight: primary[100],
    primaryDark: primary[700],

    // Background Colors
    background: background.default,
    backgroundPaper: background.paper,
    backgroundDark: background.dark,

    // Text Colors
    textPrimary: text.primary,
    textSecondary: text.secondary,
    textTertiary: text.disabled,
    textInverse: text.inverse,

    // Semantic Colors
    success: success.main,
    error: error.main,
    warning: warning.main,
    info: info.main,

    // Border Colors
    border: border.light,
    borderDark: border.dark,
    borderPrimary: border.main,

    // Utility Colors
    white: colors.white,
    black: colors.black,
    transparent: 'transparent',

    // Shadow Color
    shadow: '#000000',

    // Gradient Colors (for LinearGradient)
    gradientColors: [primary[500], '#1a7470', '#4d9892', '#8bbbb7', '#c4dbd9', background.default],
} as const;

// Type for color keys
export type ColorKey = keyof typeof COLORS;

// Helper function to get color with opacity
export const withOpacity = (color: string, opacity: number): string => {
    // Convert hex to rgba
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};
