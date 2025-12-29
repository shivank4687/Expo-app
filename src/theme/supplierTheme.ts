// Supplier-specific Theme
import { typography } from './typography';
import { spacing, borderRadius, shadows } from './spacing';

export const supplierColors = {
    // Primary Brand Colors for Supplier
    primary: {
        50: '#e6f2f1',
        100: '#b3d9d6',
        200: '#80c0bb',
        300: '#4da7a0',
        400: '#1a8e85',
        500: '#00615E', // Main supplier primary (dark teal)
        600: '#004e4b',
        700: '#003b39',
        800: '#002827',
        900: '#001515',
    },

    // Secondary Colors
    secondary: {
        50: '#fefdfb',
        100: '#fdfbf7',
        200: '#fcf9f3',
        300: '#fbf7ef',
        400: '#faf5eb',
        500: '#FCF7EA', // Main supplier secondary (cream)
        600: '#cac6bb',
        700: '#97948c',
        800: '#65635e',
        900: '#32312f',
    },

    // Neutral/Gray Scale
    neutral: {
        50: '#fafafa',
        100: '#f5f5f5',
        200: '#e5e5e5',
        300: '#d4d4d4',
        400: '#a3a3a3',
        500: '#737373',
        600: '#525252',
        700: '#404040',
        800: '#262626',
        900: '#171717',
    },
    get gray() { return this.neutral },

    // Semantic Colors
    success: {
        light: '#86efac',
        main: '#22c55e',
        dark: '#16a34a',
    },

    error: {
        light: '#fca5a5',
        main: '#ef4444',
        dark: '#dc2626',
    },

    warning: {
        light: '#fcd34d',
        main: '#f59e0b',
        dark: '#d97706',
    },

    info: {
        light: '#7dd3fc',
        main: '#0ea5e9',
        dark: '#0284c7',
    },

    // Background Colors - Supplier specific
    background: {
        default: '#FCF7EA', // Cream background
        paper: '#ffffff',
        dark: '#00615E',
    },

    // Text Colors
    text: {
        primary: '#111827',
        secondary: '#6b7280',
        disabled: '#9ca3af',
        inverse: '#ffffff',
    },

    // Border Colors
    border: {
        light: '#e5e7eb',
        main: '#d1d5db',
        dark: '#9ca3af',
    },

    // Overlay
    overlay: 'rgba(0, 97, 94, 0.5)', // Teal overlay

    // White & Black
    white: '#ffffff',
    black: '#000000',
};

export const supplierTheme = {
    colors: supplierColors,
    typography,
    spacing,
    borderRadius,
    shadows,
};

export type SupplierTheme = typeof supplierTheme;
