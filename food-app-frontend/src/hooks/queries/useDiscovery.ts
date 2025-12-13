import { useMemo, useState } from 'react';
import type { DiscoveryFilters, InterleaveConfig } from '@/types/discovery';
import { useDishes } from './useDishes';
import { useCombos } from './useCombos';
import { normalizeDishes, normalizeCombos } from '@/utils/resourceNormalizer';
import { interleaveResources } from '@/utils/interleave';

// Import the default ratio as a regular value
const DEFAULT_INTERLEAVE_RATIO = { dishRatio: 3, comboRatio: 1 };
const DEFAULT_PAGE_SIZE = 10;

/**
 * Hook to fetch and merge dishes with combos for unified discovery
 * 
 * @param filters - Filters to apply to both dishes and combos
 * @param config - Interleaving ratio configuration
 * @returns Mixed array of resources with loading state
 */
export function useDiscoveryResources(
    filters?: DiscoveryFilters,
    config: InterleaveConfig = DEFAULT_INTERLEAVE_RATIO
) {
    // Fetch dishes
    const {
        data: dishes = [],
        isLoading: loadingDishes,
        error: dishError
    } = useDishes(filters);

    // Fetch combos (currently using same filters, will be enhanced in Phase 1)
    const {
        data: combos = [],
        isLoading: loadingCombos,
        error: comboError
    } = useCombos(filters);

    // Normalize and interleave resources
    const resources = useMemo(() => {
        const normalizedDishes = normalizeDishes(dishes);
        const normalizedCombos = normalizeCombos(combos);
        return interleaveResources(normalizedDishes, normalizedCombos, config);
    }, [dishes, combos, config]);

    return {
        resources,
        isLoading: loadingDishes || loadingCombos,
        error: dishError || comboError,
        dishes,
        combos,
    };
}

/**
 * Hook for location-based resource discovery
 */
export function useDiscoveryByLocation(
    lat: number | null,
    lng: number | null,
    radius: number = 20,
    additionalFilters?: Partial<DiscoveryFilters>,
    config?: InterleaveConfig
) {
    const filters = useMemo(() => {
        if (!lat || !lng) return undefined;

        return {
            lat,
            lng,
            radius,
            ...additionalFilters,
        };
    }, [lat, lng, radius, additionalFilters]);

    return useDiscoveryResources(filters, config);
}

/**
 * Hook for recently ordered resources (dishes + combos)
 * Fetches unified history from backend
 */
export function useRecentlyOrderedResources(filters?: DiscoveryFilters) {
    const [page, setPage] = useState(1);

    // Fetch dishes with type=recently_ordered
    const {
        data: dishes = [],
        isLoading: loadingDishes
    } = useDishes({ ...filters, type: 'recently_ordered' });

    // Fetch combos with type=recently_ordered
    const {
        data: combos = [],
        isLoading: loadingCombos
    } = useCombos({ ...filters, type: 'recently_ordered' });

    const allResources = useMemo(() => {
        const normalizedDishes = normalizeDishes(dishes);
        const normalizedCombos = normalizeCombos(combos);
        return interleaveResources(normalizedDishes, normalizedCombos, DEFAULT_INTERLEAVE_RATIO);
    }, [dishes, combos]);

    const paginatedResources = useMemo(() => {
        return allResources.slice(0, page * DEFAULT_PAGE_SIZE);
    }, [allResources, page]);

    const hasMore = paginatedResources.length < allResources.length;

    const loadMore = () => {
        if (hasMore && !loadingDishes && !loadingCombos) {
            setPage(prev => prev + 1);
        }
    };

    return {
        resources: paginatedResources,
        isLoading: loadingDishes || loadingCombos,
        hasMore,
        loadMore,
    };
}

/**
 * Hook for top picks resources (personalized dishes + combos)
 * Fetches unified recommendations from backend
 */
export function useTopPicksResources(filters?: DiscoveryFilters) {
    const [page, setPage] = useState(1);

    // Fetch dishes with type=top_picks
    const {
        data: dishes = [],
        isLoading: loadingDishes
    } = useDishes({ ...filters, type: 'top_picks' });

    // Fetch combos with type=top_picks
    const {
        data: combos = [],
        isLoading: loadingCombos
    } = useCombos({ ...filters, type: 'top_picks' });

    const allResources = useMemo(() => {
        const normalizedDishes = normalizeDishes(dishes);
        const normalizedCombos = normalizeCombos(combos);
        return interleaveResources(normalizedDishes, normalizedCombos, DEFAULT_INTERLEAVE_RATIO);
    }, [dishes, combos]);

    const paginatedResources = useMemo(() => {
        return allResources.slice(0, page * DEFAULT_PAGE_SIZE);
    }, [allResources, page]);

    const hasMore = paginatedResources.length < allResources.length;

    const loadMore = () => {
        if (hasMore && !loadingDishes && !loadingCombos) {
            setPage(prev => prev + 1);
        }
    };

    return {
        resources: paginatedResources,
        isLoading: loadingDishes || loadingCombos,
        hasMore,
        loadMore,
    };
}

/**
 * Hook for popular resources (trending dishes + combos)
 * Fetches unified popularity data from backend
 */
export function usePopularResources(filters?: DiscoveryFilters) {
    const [page, setPage] = useState(1);

    // Fetch dishes with type=popular
    const {
        data: dishes = [],
        isLoading: loadingDishes
    } = useDishes({ ...filters, type: 'popular' });

    // Fetch combos with type=popular
    const {
        data: combos = [],
        isLoading: loadingCombos
    } = useCombos({ ...filters, type: 'popular' });

    const allResources = useMemo(() => {
        const normalizedDishes = normalizeDishes(dishes);
        const normalizedCombos = normalizeCombos(combos);
        return interleaveResources(normalizedDishes, normalizedCombos, DEFAULT_INTERLEAVE_RATIO);
    }, [dishes, combos]);

    const paginatedResources = useMemo(() => {
        return allResources.slice(0, page * DEFAULT_PAGE_SIZE);
    }, [allResources, page]);

    const hasMore = paginatedResources.length < allResources.length;

    const loadMore = () => {
        if (hasMore && !loadingDishes && !loadingCombos) {
            setPage(prev => prev + 1);
        }
    };

    return {
        resources: paginatedResources,
        isLoading: loadingDishes || loadingCombos,
        hasMore,
        loadMore,
    };
}

/**
 * Hook for paginated discovery of all nearby resources
 * Shows all available dishes and combos near the user's location
 * Ordered by distance (nearest first)
 */
export function useNearbyResources(
    filters?: DiscoveryFilters,
    config: InterleaveConfig = DEFAULT_INTERLEAVE_RATIO
) {
    const [page, setPage] = useState(1);

    // Fetch dishes (no special type filter, just location-based)
    const {
        data: dishes = [],
        isLoading: loadingDishes
    } = useDishes(filters);

    // Fetch combos (no special type filter, just location-based)
    const {
        data: combos = [],
        isLoading: loadingCombos
    } = useCombos(filters);

    // Normalize and interleave all resources
    const allInterleaved = useMemo(() => {
        const normalizedDishes = normalizeDishes(dishes);
        const normalizedCombos = normalizeCombos(combos);
        return interleaveResources(normalizedDishes, normalizedCombos, config);
    }, [dishes, combos, config]);

    // Paginate resources
    const paginatedResources = useMemo(() => {
        return allInterleaved.slice(0, page * DEFAULT_PAGE_SIZE);
    }, [allInterleaved, page]);

    const hasMore = paginatedResources.length < allInterleaved.length;

    const loadMore = () => {
        if (hasMore && !loadingDishes && !loadingCombos) {
            setPage(prev => prev + 1);
        }
    };

    return {
        resources: paginatedResources,
        isLoading: loadingDishes || loadingCombos,
        hasMore,
        loadMore,
        totalCount: allInterleaved.length,
    };
}
