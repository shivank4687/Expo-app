/**
 * Centralized Color Constants for Supplier Panel
 * 
 * All colors used in the supplier panel should be defined here
 * to ensure consistency across all screens and components.
 */

export const COLORS = {
    // Primary Brand Colors
    primary: '#00615E',           // Main teal color
    primaryLight: '#E0FFFE',      // Light teal for backgrounds/badges
    primaryDark: '#004e4b',       // Darker teal for hover states

    // Background Colors
    background: '#FCF7EA',        // Cream background
    backgroundPaper: '#FFFFFF',   // White card backgrounds
    backgroundDark: '#00615E',    // Dark teal background

    // Text Colors
    textPrimary: '#000000',       // Primary text (black)
    textSecondary: '#666666',     // Secondary text (gray)
    textTertiary: '#999999',      // Tertiary text (light gray)
    textInverse: '#FFFFFF',       // White text on dark backgrounds

    // Semantic Colors
    success: '#00AA00',           // Green for positive changes
    error: '#CC0000',             // Red for errors/negative changes
    warning: '#E5A75F',           // Orange/amber for warnings
    info: '#0ea5e9',              // Blue for info

    // Border Colors
    border: '#EEEEEF',            // Light gray border
    borderDark: '#CCCCCC',        // Darker border
    borderPrimary: '#00615E',     // Primary teal border

    // Utility Colors
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',

    // Shadow Color
    shadow: '#000000',

    // Gradient Colors (for LinearGradient)
    gradientColors: ['#00615E', '#1a7470', '#4d9892', '#8bbbb7', '#c4dbd9', '#FCF7EA'],
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
