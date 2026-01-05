/**
 * Common Styles for Supplier Panel
 * 
 * Reusable style objects that can be used across all supplier panel components.
 * These styles follow the design system defined in the mockups.
 */

import { StyleSheet } from 'react-native';
import { COLORS } from './colors';

export const commonStyles = StyleSheet.create({
    // Card Styles
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 16,
        shadowColor: COLORS.shadow,
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
    },

    cardSmall: {
        backgroundColor: COLORS.white,
        borderRadius: 8,
        padding: 8,
        shadowColor: COLORS.shadow,
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 3,
    },

    // Typography Styles
    heading1: {
        fontFamily: 'Inter',
        fontWeight: '700',
        fontSize: 24,
        lineHeight: 24,
        color: COLORS.textPrimary,
    },

    heading2: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 20,
        lineHeight: 24,
        color: COLORS.textPrimary,
    },

    heading3: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 16,
        lineHeight: 19,
        color: COLORS.textPrimary,
    },

    bodyText: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 14,
        lineHeight: 20,
        color: COLORS.textPrimary,
    },

    bodyTextSecondary: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 14,
        lineHeight: 20,
        color: COLORS.textSecondary,
    },

    caption: {
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 12,
        lineHeight: 17,
        color: COLORS.textSecondary,
    },

    label: {
        fontFamily: 'Inter',
        fontWeight: '500',
        fontSize: 14,
        lineHeight: 17,
        color: COLORS.textPrimary,
    },

    // Badge Styles
    badge: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 4,
        paddingHorizontal: 8,
        backgroundColor: COLORS.primaryLight,
        borderRadius: 50,
    },

    badgeText: {
        fontFamily: 'Inter',
        fontWeight: '600',
        fontSize: 12,
        lineHeight: 17,
        color: COLORS.primary,
    },

    // Button Base Styles
    buttonBase: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
    },

    buttonSmall: {
        paddingVertical: 8,
        paddingHorizontal: 12,
    },

    buttonLarge: {
        paddingVertical: 16,
        paddingHorizontal: 24,
    },

    // Layout Styles
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },

    contentPadding: {
        padding: 16,
    },

    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    rowSpaceBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    column: {
        flexDirection: 'column',
    },

    // Spacing Utilities
    gap4: {
        gap: 4,
    },

    gap8: {
        gap: 8,
    },

    gap12: {
        gap: 12,
    },

    gap16: {
        gap: 16,
    },

    // State Styles
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    loadingContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        gap: 12,
    },

    errorContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        gap: 12,
    },

    emptyContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        gap: 12,
    },
});

// Export individual style groups for easier imports
export const cardStyles = {
    card: commonStyles.card,
    cardSmall: commonStyles.cardSmall,
};

export const textStyles = {
    heading1: commonStyles.heading1,
    heading2: commonStyles.heading2,
    heading3: commonStyles.heading3,
    bodyText: commonStyles.bodyText,
    bodyTextSecondary: commonStyles.bodyTextSecondary,
    caption: commonStyles.caption,
    label: commonStyles.label,
};

export const layoutStyles = {
    container: commonStyles.container,
    contentPadding: commonStyles.contentPadding,
    row: commonStyles.row,
    rowSpaceBetween: commonStyles.rowSpaceBetween,
    column: commonStyles.column,
};
