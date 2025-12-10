import type { Combo } from '@/services/menuService';

/**
 * Get pricing mode explanation for tooltip/display
 */
export const getPricingModeExplanation = (mode: 'FIXED' | 'DYNAMIC' | 'HYBRID'): string => {
  switch (mode) {
    case 'FIXED':
      return 'Customers pay a fixed base price regardless of item selection. Only dish options (extras) add to the total.';
    case 'DYNAMIC':
      return 'Price is calculated by summing the base prices of all selected items plus any extras and options.';
    case 'HYBRID':
      return 'Combines a fixed base price with item-specific extra charges and dish options.';
    default:
      return '';
  }
};

/**
 * Get pricing mode formula for display
 */
export const getPricingModeFormula = (mode: 'FIXED' | 'DYNAMIC' | 'HYBRID'): string => {
  switch (mode) {
    case 'FIXED':
      return 'Base Price + Options';
    case 'DYNAMIC':
      return '∑(Dish Prices) + Extras + Options';
    case 'HYBRID':
      return 'Base Price + Extras + Options';
    default:
      return '';
  }
};

/**
 * Get short hint for pricing mode
 */
export const getPricingModeHint = (mode: 'FIXED' | 'DYNAMIC' | 'HYBRID'): string => {
  switch (mode) {
    case 'FIXED':
      return 'Fixed + options';
    case 'DYNAMIC':
      return 'Sum of items';
    case 'HYBRID':
      return 'Base + extras';
    default:
      return '';
  }
};

/**
 * Calculate price range for a combo based on its configuration
 * This gives vendors an idea of min/max prices without making API call
 */
export const calculatePriceRange = (combo: Combo): { min: number; max: number } | null => {
  if (!combo.groups || combo.groups.length === 0) return null;

  let minPrice = 0;
  let maxPrice = 0;

  combo.groups.forEach(group => {
    const items = group.items || [];
    if (items.length === 0) return;

    // Calculate price contribution for each item based on pricing mode
    const itemPrices = items.map(item => {
      const dishPrice = item.dish?.price || 0;
      const extra = item.extra_price;

      switch (combo.pricing_mode) {
        case 'FIXED':
          // Only extras count in FIXED mode (dish prices ignored)
          return 0;
        case 'DYNAMIC':
          // Both dish price and extra count
          return dishPrice + extra;
        case 'HYBRID':
          // Only extras count (dish prices ignored, but extras add on top of base)
          return extra;
        default:
          return 0;
      }
    });

    // Sort to find cheapest and most expensive combinations
    const sortedPrices = [...itemPrices].sort((a, b) => a - b);

    // Min: select the cheapest allowed_min items
    const minSelections = sortedPrices.slice(0, group.allowed_min);
    minPrice += minSelections.reduce((sum, price) => sum + price, 0);

    // Max: select the most expensive allowed_max items
    const maxSelections = sortedPrices.slice(-group.allowed_max);
    maxPrice += maxSelections.reduce((sum, price) => sum + price, 0);
  });

  // Add base price for FIXED and HYBRID modes
  if (combo.pricing_mode !== 'DYNAMIC') {
    minPrice += combo.base_price;
    maxPrice += combo.base_price;
  }

  return { min: minPrice, max: maxPrice };
};

/**
 * Helper function to format date from ISO string to readable format
 */
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch {
    return dateString;
  }
};

/**
 * Helper function to get full image URL
 */
export const getImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  // If URL is already absolute (starts with http:// or https://), use it directly
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // If relative URL (shouldn't happen if backend is correct, but handle as fallback)
  // Only prepend if it's a relative path starting with /storage
  if (url.startsWith('/storage/')) {
    const apiBaseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    return `${apiBaseUrl}${url}`;
  }
  // If it's a malformed URL or just a path, return null to avoid broken images
  return null;
};
