import type { User } from './auth';
import type { Dish } from '@/services/menuService';
import type { Restaurant } from '@/services/restaurantService';
import type { OrderLogistics, DeliveryAddress, DeliveryContact, OrderType } from './delivery';

/**
 * Combo selection item - represents a dish selected within a combo
 */
export interface ComboSelectionItem {
    id: string;
    combo_selection_id: string;
    dish_id: string;
    options: {
        group_id: string;
        group_name: string;
        option_ids: string[];
        options: unknown[];
        dish_base_price: number;
        combo_item_extra: number;
    } | null;
    price: number;
    dish?: Dish;
}

/**
 * Combo selection - user's selection when ordering a combo
 */
export interface ComboSelection {
    id: string;
    combo_id: string;
    user_id: string;
    total_price: number;
    items: ComboSelectionItem[];
    combo?: {
        id: string;
        name: string;
        description?: string;
    };
}

/**
 * Order item type discriminator
 */
export type OrderItemType = 'dish' | 'combo';

/**
 * Represents a single item in an order (polymorphic: dish or combo)
 */
export interface OrderItem {
    id: string;
    order_id: string;
    orderable_type?: string;
    orderable_id?: string;
    type?: OrderItemType;
    dish_id: string | null;
    combo_selection_id: string | null;
    quantity: number;
    unit_price: number;
    total_price?: number;
    options: unknown[] | null;
    notes: string | null;
    created_at?: string;
    updated_at?: string;
    // Relations - polymorphic
    product?: Dish; // Legacy alias for dish
    dish?: Dish;
    combo_selection?: ComboSelection;
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
    status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
    notes: string | null;
    order_type: OrderType;
    delivery_address: DeliveryAddress | null;
    delivery_contact: DeliveryContact | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;

    // Relations
    user?: User;
    customer?: User; // Alias for user
    shop?: Restaurant; // Legacy alias for restaurant
    restaurant?: Restaurant;
    items?: OrderItem[];
    logistics?: OrderLogistics;
}

/**
 * Order item for creating a dish order
 */
export interface CreateDishOrderItem {
    type: 'dish';
    dish_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    notes?: string;
    options?: unknown[];
}

/**
 * Order item for creating a combo order
 */
export interface CreateComboOrderItem {
    type: 'combo';
    combo_selection_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
}

/**
 * Union type for polymorphic order items
 */
export type CreateOrderItem = CreateDishOrderItem | CreateComboOrderItem;

/**
 * Data structure for creating a new order
 */
export interface CreateOrderData {
    restaurant_id: string;
    order_type?: OrderType;
    items: CreateOrderItem[];
    notes?: string;
    delivery_address?: DeliveryAddress;
    delivery_contact?: DeliveryContact;
}

/**
 * Data structure for updating order status
 * Only "restaurant" role can update order status
 */
export interface UpdateOrderStatusData {
    status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
}

/**
 * Filters for querying orders
 */
export interface OrderFilters {
    restaurant_id?: string;
    status?: string;
    user_id?: string;
}
