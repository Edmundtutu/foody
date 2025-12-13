import type { Dish, Combo } from '@/services/menuService';
import type { DishResource, ComboResource } from '@/types/discovery';

/**
 * Normalizes a Dish into a DishResource with standardized structure
 */
export function normalizeDish(dish: Dish): DishResource {
    return {
        type: 'dish',
        id: dish.id,
        name: dish.name,
        price: dish.price,
        images: dish.images || [],
        restaurant: dish.restaurant,
        distance: dish.distance,
        rating: dish.rating,
        delivery_time: dish.delivery_time,
        data: dish,
    };
}

/**
 * Normalizes a Combo into a ComboResource with standardized structure
 */
export function normalizeCombo(combo: Combo): ComboResource {
    // Use calculated_price if available, otherwise fallback to base_price
    const price = combo.calculated_price ?? combo.base_price;

    // Extract images from combo or use placeholder
    const images = combo.images && combo.images.length > 0
        ? combo.images
        : [];

    return {
        type: 'combo',
        id: combo.id,
        name: combo.name,
        price: price,
        images: images,
        restaurant: combo.restaurant,
        distance: combo.restaurant?.distance,
        rating: combo.restaurant?.rating,
        data: combo,
    };
}

/**
 * Normalizes an array of dishes
 */
export function normalizeDishes(dishes: Dish[]): DishResource[] {
    return dishes.map(normalizeDish);
}

/**
 * Normalizes an array of combos
 */
export function normalizeCombos(combos: Combo[]): ComboResource[] {
    return combos.map(normalizeCombo);
}
