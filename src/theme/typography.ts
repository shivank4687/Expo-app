// Typography System
export const typography = {
    // Font Families
    fontFamily: {
        regular: 'System',
        medium: 'System',
        semiBold: 'System',
        bold: 'System',
    },

    // Font Sizes
    fontSize: {
        xs: 12,
        sm: 14,
        md: 16,
        base: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
        '3xl': 30,
        '4xl': 36,
        '5xl': 48,
    },

    // Font Weights
    fontWeight: {
        regular: '400' as const,
        medium: '500' as const,
        semiBold: '600' as const,
        bold: '700' as const,
    },

    // Line Heights
    lineHeight: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
        loose: 2,
    },

    // Letter Spacing
    letterSpacing: {
        tight: -0.5,
        normal: 0,
        wide: 0.5,
        wider: 1,
    },
};

export type Typography = typeof typography;
