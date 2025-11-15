import api from './api';
import type { ApiResponse } from '@/types/api';

export interface Restaurant {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  verification_status: string;
  config: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateRestaurantData {
  name: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  verification_status?: string;
  config?: Record<string, any>;
}

export interface UpdateRestaurantData extends Partial<CreateRestaurantData> {}

export interface RestaurantFilters {
  name?: string;
  verification_status?: string;
}

const restaurantService = {
  /**
   * Get all restaurants (public)
   */
  async getRestaurants(filters?: RestaurantFilters): Promise<Restaurant[]> {
    const response = await api.get<ApiResponse<Restaurant[]>>('/v1/restaurants', {
      params: filters,
    });
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch restaurants');
  },

  /**
   * Get a single restaurant by ID (public)
   */
  async getRestaurant(restaurantId: string): Promise<Restaurant> {
    const response = await api.get<ApiResponse<Restaurant>>(
      `/v1/restaurants/${restaurantId}`
    );
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch restaurant');
  },

  /**
   * Create a new restaurant (authenticated)
   */
  async createRestaurant(data: CreateRestaurantData): Promise<Restaurant> {
    const response = await api.post<ApiResponse<Restaurant>>(
      '/v1/restaurants',
      data
    );
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to create restaurant');
  },

  /**
   * Update a restaurant (authenticated)
   */
  async updateRestaurant(
    restaurantId: string,
    data: UpdateRestaurantData
  ): Promise<Restaurant> {
    const response = await api.put<ApiResponse<Restaurant>>(
      `/v1/restaurants/${restaurantId}`,
      data
    );
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to update restaurant');
  },

  /**
   * Delete a restaurant (authenticated)
   */
  async deleteRestaurant(restaurantId: string): Promise<void> {
    const response = await api.delete<ApiResponse<null>>(
      `/v1/restaurants/${restaurantId}`
    );
    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Failed to delete restaurant');
    }
  },

  /**
   * Get restaurants by owner ID (helper method)
   */
  async getRestaurantsByOwner(ownerId: string): Promise<Restaurant[]> {
    // Note: This is a helper method that filters restaurants by owner
    // The backend may need to implement a filter for this, or we can filter on the frontend
    // For now, we'll fetch all restaurants and filter client-side
    const restaurants = await this.getRestaurants();
    return restaurants.filter((r) => r.owner_id === ownerId);
  },
};

export default restaurantService;

