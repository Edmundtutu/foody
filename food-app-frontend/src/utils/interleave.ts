import type { DiscoveryResource, InterleaveConfig } from '@/types/discovery';
import { DEFAULT_INTERLEAVE_RATIO } from '@/types/discovery';

/**
 * Interleaves dishes and combos based on a ratio
 * Example: ratio 3:1 produces [D, D, D, C, D, D, D, C, ...]
 * 
 * Maintains the original order within each resource type,
 * respecting any sorting (distance, popularity, etc.)
 * 
 * @param dishes - Array of normalized dish resources
 * @param combos - Array of normalized combo resources
 * @param config - Interleaving ratio configuration
 * @returns Mixed array of resources
 */
export function interleaveResources(
    dishes: DiscoveryResource[],
    combos: DiscoveryResource[],
    config: InterleaveConfig = DEFAULT_INTERLEAVE_RATIO
): DiscoveryResource[] {
    const result: DiscoveryResource[] = [];
    const { dishRatio, comboRatio } = config;

    let dishIndex = 0;
    let comboIndex = 0;

    // Continue until both arrays are exhausted
    while (dishIndex < dishes.length || comboIndex < combos.length) {
        // Add dishes according to ratio
        for (let i = 0; i < dishRatio && dishIndex < dishes.length; i++) {
            result.push(dishes[dishIndex++]);
        }

        // Add combos according to ratio
        for (let i = 0; i < comboRatio && comboIndex < combos.length; i++) {
            result.push(combos[comboIndex++]);
        }
    }

    return result;
}

/**
 * Shuffles resources randomly while maintaining some ordering
 * Useful for creating variety without losing relevance ranking
 * 
 * @param resources - Array of resources to shuffle
 * @param shuffleIntensity - 0 (no shuffle) to 1 (full random)
 * @returns Shuffled array
 */
export function shuffleResources(
    resources: DiscoveryResource[],
    shuffleIntensity: number = 0.3
): DiscoveryResource[] {
    if (shuffleIntensity === 0) return resources;

    const result = [...resources];
    const length = result.length;

    // Partial shuffle: only swap elements within a limited range
    const swapRange = Math.floor(length * shuffleIntensity);

    for (let i = 0; i < length; i++) {
        const minSwapIndex = Math.max(0, i - swapRange);
        const maxSwapIndex = Math.min(length - 1, i + swapRange);
        const swapIndex = Math.floor(Math.random() * (maxSwapIndex - minSwapIndex + 1)) + minSwapIndex;

        [result[i], result[swapIndex]] = [result[swapIndex], result[i]];
    }

    return result;
}

/**
 * Sorts resources by distance (closest first)
 */
export function sortByDistance(resources: DiscoveryResource[]): DiscoveryResource[] {
    return [...resources].sort((a, b) => {
        const distanceA = a.distance ?? Infinity;
        const distanceB = b.distance ?? Infinity;
        return distanceA - distanceB;
    });
}

/**
 * Sorts resources by rating (highest first)
 */
export function sortByRating(resources: DiscoveryResource[]): DiscoveryResource[] {
    return [...resources].sort((a, b) => {
        const ratingA = a.rating ?? 0;
        const ratingB = b.rating ?? 0;
        return ratingB - ratingA;
    });
}

/**
 * Filters resources by type
 */
export function filterByType(
    resources: DiscoveryResource[],
    type: 'dish' | 'combo'
): DiscoveryResource[] {
    return resources.filter(resource => resource.type === type);
}
