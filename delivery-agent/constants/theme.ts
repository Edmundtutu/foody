/**
 * Unified Design System for Delivery Agent App
 * Aligned with Food App Frontend design tokens
 */

export const Colors = {
    // Primary palette
    primary: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',  // Main primary
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a',
    },

    // Neutral (Slate)
    slate: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a',
    },

    // Semantic colors
    success: {
        50: '#f0fdf4',
        100: '#dcfce7',
        200: '#bbf7d0',
        500: '#22c55e',
        600: '#16a34a',
        700: '#15803d',
    },

    warning: {
        50: '#fffbeb',
        100: '#fef3c7',
        200: '#fde68a',
        500: '#f59e0b',
        600: '#d97706',
        700: '#b45309',
    },

    error: {
        50: '#fef2f2',
        100: '#fee2e2',
        200: '#fecaca',
        500: '#ef4444',
        600: '#dc2626',
        700: '#b91c1c',
    },

    // Status colors for orders
    status: {
        assigned: '#f59e0b',   // Amber
        pickedUp: '#3b82f6',   // Blue
        onTheWay: '#8b5cf6',   // Purple
        delivered: '#22c55e',  // Green
    },

    // Backgrounds
    background: '#f8fafc',
    card: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.5)',
};

export const Typography = {
    // Font family - uses system font by default, Rubik if loaded
    fontFamily: {
        sans: undefined, // undefined uses system default on both iOS & Android
        display: 'Rubik', // For headings if Rubik is loaded
        mono: 'monospace',
    },

    // Font sizes
    fontSize: {
        xs: 11,
        sm: 12,
        base: 14,
        md: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
        '3xl': 32,
    },

    // Font weights
    fontWeight: {
        normal: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '700' as const,
    },

    // Line heights
    lineHeight: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
    },
};

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 48,
};

export const BorderRadius = {
    sm: 6,
    base: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
};

export const Shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    base: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
    },
};

// Common style presets
export const CommonStyles = {
    screenContainer: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    card: {
        backgroundColor: Colors.card,
        borderRadius: BorderRadius.md,
        ...Shadows.base,
    },
    headerTitle: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.slate[900],
    },
    sectionTitle: {
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.slate[900],
    },
    bodyText: {
        fontSize: Typography.fontSize.base,
        color: Colors.slate[700],
        fontWeight: Typography.fontWeight.normal,
    },
    captionText: {
        fontSize: Typography.fontSize.sm,
        color: Colors.slate[500],
        fontWeight: Typography.fontWeight.medium,
    },
    primaryButton: {
        backgroundColor: Colors.primary[500],
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.base,
        borderRadius: BorderRadius.base,
        alignItems: 'center' as const,
    },
    primaryButtonText: {
        color: '#ffffff',
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.semibold,
    },
    secondaryButton: {
        backgroundColor: Colors.primary[50],
        borderWidth: 1,
        borderColor: Colors.primary[500],
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.base,
        borderRadius: BorderRadius.base,
        alignItems: 'center' as const,
    },
    secondaryButtonText: {
        color: Colors.primary[600],
        fontSize: Typography.fontSize.base,
        fontWeight: Typography.fontWeight.semibold,
    },
};
