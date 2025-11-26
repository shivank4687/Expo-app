// Theme Colors
export const colors = {
  // Primary Brand Colors
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Main primary
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },

  // Secondary Colors
  secondary: {
    50: '#fdf4ff',
    100: '#fae8ff',
    200: '#f5d0fe',
    300: '#f0abfc',
    400: '#e879f9',
    500: '#d946ef', // Main secondary
    600: '#c026d3',
    700: '#a21caf',
    800: '#86198f',
    900: '#701a75',
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

  // Background Colors
  background: {
    default: '#ffffff',
    paper: '#f9fafb',
    dark: '#111827',
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
  overlay: 'rgba(0, 0, 0, 0.5)',

  // White & Black
  white: '#ffffff',
  black: '#000000',
};

export type Colors = typeof colors;
