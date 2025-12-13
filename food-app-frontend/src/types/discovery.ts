import type { Dish, Combo } from '@/services/menuService';
import type { Restaurant } from '@/services/restaurantService';

/**
 * Resource types available in the discovery flow
 */
export type ResourceType = 'dish' | 'combo';

/**
 * Base interface for all discoverable resources
 * Contains common fields needed for rendering cards
 */
export interface BaseResource {
    id: string;
    type: ResourceType;
    name: string;
    price: number;
    images: string[];
    restaurant?: Restaurant;
    distance?: number;
    rating?: number;
    delivery_time?: number;
}

/**
 * Dish resource with normalized structure
 */
export interface DishResource extends BaseResource {
    type: 'dish';
    data: Dish;
}

/**
 * Combo resource with normalized structure
 */
export interface ComboResource extends BaseResource {
    type: 'combo';
    data: Combo;
}

/**
 * Union type for any discoverable resource
 */
export type DiscoveryResource = DishResource | ComboResource;

/**
 * Filters that can be applied to discovery queries
 */
export interface DiscoveryFilters {
    name?: string;
    tag?: string;
    lat?: number;
    lng?: number;
    radius?: number;
    restaurant_id?: string;
}

/**
 * Interleaving configuration for mixing resources
 */
export interface InterleaveConfig {
    dishRatio: number;
    comboRatio: number;
}

/**
 * Default interleave ratio: 3 dishes to 1 combo
 */
export const DEFAULT_INTERLEAVE_RATIO: InterleaveConfig = {
    dishRatio: 3,
    comboRatio: 1,
};
