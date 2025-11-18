import type { User } from './auth';
import type { Dish } from '@/services/menuService';
import type { Restaurant } from '@/services/restaurantService';

/**
 * Represents a single item in an order
 */
export interface OrderItem {
    id: string;
    order_id: string;
    dish_id: string;
    quantity: number;
    unit_price: number;
    notes: string | null;
    created_at: string;
    updated_at: string;
    product?: Dish; // Alias for dish
    dish?: Dish;
}

/**
 * Represents a complete order placed by a customer with a restaurant
 * User role: "customer" creates orders, "restaurant" fulfills them
 */
export interface Order {
    id: string;
    user_id: string;
    restaurant_id: string;
    shop_id?: string; // Legacy alias for restaurant_id
    total: number;
    status: 'pending' | 'confirmed' | 'processing' | 'ready' | 'completed' | 'cancelled';
    notes: string | null;
    delivery_address?: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;

    // Relations
    user?: User;
    customer?: User; // Alias for user
    shop?: Restaurant; // Legacy alias for restaurant
    restaurant?: Restaurant;
    items?: OrderItem[];
}

/**
 * Data structure for creating a new order
 */
export interface CreateOrderData {
    restaurant_id: string;
    items: {
        dish_id: string;
        quantity: number;
        unit_price: number;
        notes?: string;
    }[];
    notes?: string;
    delivery_address?: string;
}

/**
 * Data structure for updating order status
 * Only "restaurant" role can update order status
 */
export interface UpdateOrderStatusData {
    status: 'pending' | 'confirmed' | 'processing' | 'ready' | 'completed' | 'cancelled';
}

/**
 * Filters for querying orders
 */
export interface OrderFilters {
    restaurant_id?: string;
    status?: string;
    user_id?: string;
}
