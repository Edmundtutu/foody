import api from './api';
import type { ApiResponse } from '@/types/api';
import type { Order, CreateOrderData, UpdateOrderStatusData, OrderFilters } from '@/types/orders';

const apiVersion = import.meta.env.VITE_API_VERSION || 'v1';

const orderService = {
  /**
   * Get all orders (authenticated)
   */
  async getOrders(filters?: OrderFilters): Promise<Order[]> {
    const response = await api.get<ApiResponse<Order[]>>(`/${apiVersion}/orders`, {
      params: filters,
    });
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch orders');
  },

  /**
   * Get a single order by ID (authenticated)
   */
  async getOrder(orderId: string): Promise<Order> {
    const response = await api.get<ApiResponse<Order>>(`/${apiVersion}/orders/${orderId}`);
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch order');
  },

  /**
   * Create a new order (authenticated)
   */
  async createOrder(data: CreateOrderData): Promise<Order> {
    const response = await api.post<ApiResponse<Order>>(`/${apiVersion}/orders`, data);
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to create order');
  },

  /**
   * Update order status (authenticated)
   */
  async updateOrderStatus(
    orderId: string,
    status: UpdateOrderStatusData['status']
  ): Promise<Order> {
    const response = await api.put<ApiResponse<Order>>(
      `/${apiVersion}/orders/${orderId}`,
      { status }
    );
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to update order status');
  },

  /**
   * Get restaurant orders (authenticated)
   */
  async getRestaurantOrders(restaurantId: string): Promise<Order[]> {
    return this.getOrders({ restaurant_id: restaurantId });
  },
};

export default orderService;

