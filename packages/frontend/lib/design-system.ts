/**
 * Design System Constants
 * 
 * Centralized design tokens for TrustCircle UI
 * Following WCAG 2.1 AA accessibility standards
 */

// Spacing scale (consistent with Tailwind)
export const spacing = {
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  '2xl': '3rem',    // 48px
  '3xl': '4rem',    // 64px
} as const;

// Typography scale
export const typography = {
  sizes: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
  },
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// Animation durations
export const animations = {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  slower: '500ms',
} as const;

// Z-index layers
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modalBackdrop: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
} as const;

// Breakpoints (mobile-first)
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Shadow system
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
} as const;

// Border radius
export const radius = {
  none: '0',
  sm: '0.25rem',    // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  full: '9999px',
} as const;

// Financial UI specific constants
export const financial = {
  // Credit score ranges
  creditScore: {
    excellent: { min: 800, max: 1000, color: 'success' },
    good: { min: 700, max: 799, color: 'primary' },
    fair: { min: 600, max: 699, color: 'warning' },
    poor: { min: 500, max: 599, color: 'danger' },
    bad: { min: 0, max: 499, color: 'danger' },
  },
  // Interest rate display
  interestRate: {
    low: { max: 10, color: 'success' },
    moderate: { min: 10, max: 15, color: 'primary' },
    high: { min: 15, max: 25, color: 'warning' },
    veryHigh: { min: 25, color: 'danger' },
  },
  // Currency formatting
  currencyDecimals: 2,
  cryptoDecimals: 6,
} as const;

// Accessibility constants
export const a11y = {
  // Minimum touch target size (WCAG 2.1 AA)
  minTouchTarget: '44px',
  // Focus ring
  focusRing: '2px solid rgb(59 130 246)',
  focusRingOffset: '2px',
  // Minimum contrast ratios
  contrastRatios: {
    normal: 4.5,    // WCAG AA for normal text
    large: 3,       // WCAG AA for large text
  },
} as const;
