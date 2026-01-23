import type { User } from './auth';
import type { Order } from './orders';
import type { Restaurant } from './restaurant';

/**
 * Order types for differentiating dine-in, takeaway, and delivery orders
 */
export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';

/**
 * Agent status for managing courier lifecycle
 */
export type AgentStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED';

/**
 * Fleet/vehicle types for delivery agents
 */
export type FleetKind = 'BICYCLE' | 'MOTORCYCLE' | 'CAR' | 'VAN' | 'ON_FOOT';

/**
 * Delivery status progression
 */
export type DeliveryStatus = 'PENDING' | 'ASSIGNED' | 'PICKED_UP' | 'ON_THE_WAY' | 'DELIVERED';

/**
 * Delivery address structure
 */
export interface DeliveryAddress {
    street: string;
    city: string;
    state?: string;
    postal_code?: string;
    country?: string;
    lat?: number;
    lng?: number;
    instructions?: string;
}

/**
 * Delivery contact information
 */
export interface DeliveryContact {
    name: string;
    phone: string;
    email?: string;
}

/**
 * Delivery agent/courier representation
 */
export interface Agent {
    id: string;
    restaurant_id: string;
    user_id: string | null;
    nin: string;
    name: string;
    phone_number: string;
    fleet_kind: FleetKind;
    plate_number: string | null;
    photo: string | null;
    status: AgentStatus;
    is_available: boolean;
    current_load: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;

    // Relations
    restaurant?: Restaurant;
    user?: User;
    deliveries?: OrderLogistics[];
}

/**
 * Order logistics/delivery tracking
 */
export interface OrderLogistics {
    id: string;
    order_id: string;
    agent_id: string | null;
    pickup_address: DeliveryAddress;
    delivery_address: DeliveryAddress;
    delivery_status: DeliveryStatus;
    assigned_at: string | null;
    picked_up_at: string | null;
    delivered_at: string | null;
    created_at: string;
    updated_at: string;

    // Relations
    order?: Order;
    agent?: Agent;
}

/**
 * Live location data from Firebase
 */
export interface LiveLocation {
    lat: number;
    lng: number;
    heading?: number;
    speed?: number;
    timestamp: number;
    agent_id: string;
}

/**
 * Real-time order status from Firebase
 */
export interface OrderStatusUpdate {
    status: DeliveryStatus;
    updated_at: number;
    eta_minutes?: number;
}

/**
 * Create agent request payload
 */
export interface CreateAgentData {
    user_id?: string;
    nin: string;
    name: string;
    phone_number: string;
    fleet_kind: FleetKind;
    plate_number?: string;
    photo?: string;
}

/**
 * Update agent request payload
 */
export interface UpdateAgentData {
    nin?: string;
    name?: string;
    phone_number?: string;
    fleet_kind?: FleetKind;
    plate_number?: string;
    photo?: string;
}

/**
 * Create order with delivery information
 */
export interface CreateDeliveryOrderData {
    restaurant_id: string;
    order_type: OrderType;
    items: {
        dish_id: string;
        quantity: number;
        unit_price: number;
        total_price: number;
        notes?: string;
        options?: unknown[];
    }[];
    notes?: string;
    delivery_address?: DeliveryAddress;
    delivery_contact?: DeliveryContact;
}

/**
 * Assign agent to delivery request
 */
export interface AssignAgentData {
    agent_id: string;
}

/**
 * Update delivery status request
 */
export interface UpdateDeliveryStatusData {
    status: DeliveryStatus;
}

/**
 * Agent filters for listing
 */
export interface AgentFilters {
    status?: AgentStatus;
    is_available?: boolean;
    fleet_kind?: FleetKind;
}

/**
 * Logistics filters for listing
 */
export interface LogisticsFilters {
    status?: DeliveryStatus;
    agent_id?: string;
    date_from?: string;
    date_to?: string;
}

/**
 * Delivery status display configuration
 */
export const DELIVERY_STATUS_CONFIG: Record<DeliveryStatus, {
    label: string;
    color: string;
    bgColor: string;
    description: string;
}> = {
    PENDING: {
        label: 'Pending',
        color: 'text-yellow-700',
        bgColor: 'bg-yellow-100',
        description: 'Waiting for agent assignment',
    },
    ASSIGNED: {
        label: 'Assigned',
        color: 'text-blue-700',
        bgColor: 'bg-blue-100',
        description: 'Agent assigned, heading to pickup',
    },
    PICKED_UP: {
        label: 'Picked Up',
        color: 'text-purple-700',
        bgColor: 'bg-purple-100',
        description: 'Order collected from restaurant',
    },
    ON_THE_WAY: {
        label: 'On The Way',
        color: 'text-indigo-700',
        bgColor: 'bg-indigo-100',
        description: 'Agent en route to delivery address',
    },
    DELIVERED: {
        label: 'Delivered',
        color: 'text-green-700',
        bgColor: 'bg-green-100',
        description: 'Order delivered successfully',
    },
};

/**
 * Fleet kind display configuration
 */
export const FLEET_KIND_CONFIG: Record<FleetKind, {
    label: string;
    icon: string;
}> = {
    BICYCLE: { label: 'Bicycle', icon: 'bike' },
    MOTORCYCLE: { label: 'Motorcycle', icon: 'motorcycle' },
    CAR: { label: 'Car', icon: 'car' },
    VAN: { label: 'Van', icon: 'truck' },
    ON_FOOT: { label: 'On Foot', icon: 'walk' },
};

/**
 * Agent status display configuration
 */
export const AGENT_STATUS_CONFIG: Record<AgentStatus, {
    label: string;
    color: string;
    bgColor: string;
}> = {
    PENDING: {
        label: 'Pending Approval',
        color: 'text-yellow-700',
        bgColor: 'bg-yellow-100',
    },
    ACTIVE: {
        label: 'Active',
        color: 'text-green-700',
        bgColor: 'bg-green-100',
    },
    SUSPENDED: {
        label: 'Suspended',
        color: 'text-red-700',
        bgColor: 'bg-red-100',
    },
};
