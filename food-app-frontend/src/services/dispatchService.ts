import api from './api';
import type { ApiResponse } from '@/types/api';
import type {
    OrderLogistics,
    AssignAgentData,
    UpdateDeliveryStatusData,
    LogisticsFilters,
    DeliveryStatus,
} from '@/types/delivery';

const apiVersion = import.meta.env.VITE_API_VERSION || 'v1';

const dispatchService = {
    /**
     * Get all logistics/deliveries for a restaurant
     */
    async getLogistics(restaurantId: string, filters?: LogisticsFilters): Promise<OrderLogistics[]> {
        const response = await api.get<ApiResponse<OrderLogistics[]>>(
            `/${apiVersion}/restaurants/${restaurantId}/logistics`,
            { params: filters }
        );
        if (response.data.status === 'success' && response.data.data) {
            return response.data.data;
        }
        throw new Error(response.data.message || 'Failed to fetch logistics');
    },

    /**
     * Get pending (unassigned) deliveries for a restaurant
     */
    async getPendingDeliveries(restaurantId: string): Promise<OrderLogistics[]> {
        const response = await api.get<ApiResponse<OrderLogistics[]>>(
            `/${apiVersion}/restaurants/${restaurantId}/logistics/pending`
        );
        if (response.data.status === 'success' && response.data.data) {
            return response.data.data;
        }
        throw new Error(response.data.message || 'Failed to fetch pending deliveries');
    },

    /**
     * Create logistics entry for an order (initiate delivery)
     */
    async createLogistics(orderId: string): Promise<OrderLogistics> {
        const response = await api.post<ApiResponse<OrderLogistics>>(
            `/${apiVersion}/orders/${orderId}/logistics`
        );
        if (response.data.status === 'success' && response.data.data) {
            return response.data.data;
        }
        throw new Error(response.data.message || 'Failed to create logistics');
    },

    /**
     * Assign an agent to a delivery
     */
    async assignAgent(orderId: string, data: AssignAgentData): Promise<OrderLogistics> {
        const response = await api.post<ApiResponse<OrderLogistics>>(
            `/${apiVersion}/orders/${orderId}/logistics/assign`,
            data
        );
        if (response.data.status === 'success' && response.data.data) {
            return response.data.data;
        }
        throw new Error(response.data.message || 'Failed to assign agent');
    },

    /**
     * Unassign agent from a delivery
     */
    async unassignAgent(orderId: string): Promise<OrderLogistics> {
        const response = await api.post<ApiResponse<OrderLogistics>>(
            `/${apiVersion}/orders/${orderId}/logistics/unassign`
        );
        if (response.data.status === 'success' && response.data.data) {
            return response.data.data;
        }
        throw new Error(response.data.message || 'Failed to unassign agent');
    },

    /**
     * Update delivery status
     */
    async updateStatus(logisticsId: string, data: UpdateDeliveryStatusData): Promise<OrderLogistics> {
        const response = await api.patch<ApiResponse<OrderLogistics>>(
            `/${apiVersion}/logistics/${logisticsId}/status`,
            data
        );
        if (response.data.status === 'success' && response.data.data) {
            return response.data.data;
        }
        throw new Error(response.data.message || 'Failed to update delivery status');
    },

    /**
     * Customer confirms delivery receipt
     */
    async confirmDelivery(orderId: string): Promise<OrderLogistics> {
        const response = await api.post<ApiResponse<OrderLogistics>>(
            `/${apiVersion}/orders/${orderId}/confirm-delivery`
        );
        if (response.data.status === 'success' && response.data.data) {
            return response.data.data;
        }
        throw new Error(response.data.message || 'Failed to confirm delivery');
    },

    /**
     * Get delivery status progression
     */
    getStatusProgression(): DeliveryStatus[] {
        return ['PENDING', 'ASSIGNED', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED'];
    },

    /**
     * Check if status transition is valid
     */
    isValidTransition(currentStatus: DeliveryStatus, newStatus: DeliveryStatus): boolean {
        const transitions: Record<DeliveryStatus, DeliveryStatus[]> = {
            PENDING: ['ASSIGNED'],
            ASSIGNED: ['PICKED_UP', 'PENDING'],
            PICKED_UP: ['ON_THE_WAY'],
            ON_THE_WAY: ['DELIVERED'],
            DELIVERED: [],
        };
        return transitions[currentStatus]?.includes(newStatus) ?? false;
    },
};

export default dispatchService;
