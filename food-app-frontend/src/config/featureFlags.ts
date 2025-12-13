/**
 * Feature flags for progressive rollout of new features
 * 
 * These can be controlled via environment variables or
 * toggled during runtime for A/B testing
 */

export const FEATURE_FLAGS = {
    /**
     * Enable unified discovery (dishes + combos mixed)
     * When false, falls back to dish-only discovery
     */
    UNIFIED_DISCOVERY: import.meta.env.VITE_UNIFIED_DISCOVERY === 'true' || false,

    /**
     * Enable combos in search results
     * When false, search returns dishes only
     */
    COMBO_IN_SEARCH: import.meta.env.VITE_COMBO_IN_SEARCH === 'true' || false,

    /**
     * Enable combo-specific horizontal sections
     * Shows "Build Your Combo" section
     */
    COMBO_SECTIONS: import.meta.env.VITE_COMBO_SECTIONS === 'true' || true,

    /**
     * Interleaving ratio for mixed discovery
     * Format: "dishes:combos" (e.g., "3:1" = 3 dishes per 1 combo)
     */
    INTERLEAVE_RATIO: import.meta.env.VITE_INTERLEAVE_RATIO || '3:1',
} as const;

/**
 * Parse interleave ratio from string format "3:1" to object
 */
export function getInterleaveConfig() {
    const [dishRatio, comboRatio] = FEATURE_FLAGS.INTERLEAVE_RATIO
        .split(':')
        .map(Number);

    return {
        dishRatio: dishRatio || 3,
        comboRatio: comboRatio || 1,
    };
}

/**
 * Check if any discovery features are enabled
 */
export function isDiscoveryEnhanced(): boolean {
    return FEATURE_FLAGS.UNIFIED_DISCOVERY ||
        FEATURE_FLAGS.COMBO_IN_SEARCH ||
        FEATURE_FLAGS.COMBO_SECTIONS;
}
