import api from './api';
import type { ApiResponse } from '@/types/api';
import type { Restaurant } from './restaurantService';

const apiVersion = import.meta.env.VITE_API_VERSION || 'v1';

export interface MenuCategory {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  display_order: number;
  color_code: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  dishes?: Dish[];
}

export interface DishOption {
  id: string;
  dish_id: string;
  name: string;
  extra_cost: number;
  required: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Dish {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  unit: string | null;
  available: boolean;
  images: string[] | null;
  tags: string[] | null;
  rating?: number;
  total_reviews?: number;
  distance?: number;
  delivery_time?: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  category?: MenuCategory;
  restaurant?: Restaurant;
  options?: DishOption[];
}

export interface CreateMenuCategoryData {
  restaurant_id: string;
  name: string;
  description?: string;
  display_order?: number;
  color_code?: string;
}

export interface UpdateMenuCategoryData extends Partial<CreateMenuCategoryData> {}

export interface CreateDishData {
  restaurant_id: string;
  category_id: string;
  name: string;
  description?: string;
  price: number;
  unit?: string;
  available?: boolean;
  images?: string[];
  tags?: string[];
}

export interface UpdateDishData extends Partial<CreateDishData> {}

export interface CreateDishOptionData {
  dish_id: string;
  name: string;
  extra_cost: number;
  required?: boolean;
}

export interface UpdateDishOptionData extends Partial<CreateDishOptionData> {}

export interface DishFilters {
  restaurant_id?: string;
  category_id?: string;
  available?: boolean;
  name?: string;
  tag?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  sort?: 'popular' | 'rating' | 'distance' | 'price';
}

const menuService = {
  /**
   * Get all menu categories for a restaurant (public)
   */
  async getMenuCategories(restaurantId: string): Promise<MenuCategory[]> {
    const response = await api.get<ApiResponse<MenuCategory[]>>(
      `/${apiVersion}/menu-categories`,
      {
        params: { restaurant_id: restaurantId },
      }
    );
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch menu categories');
  },

  /**
   * Get a single menu category by ID (public)
   */
  async getMenuCategory(categoryId: string): Promise<MenuCategory> {
    const response = await api.get<ApiResponse<MenuCategory>>(
      `/${apiVersion}/menu-categories/${categoryId}`
    );
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch menu category');
  },

  /**
   * Create a new menu category (authenticated)
   */
  async createMenuCategory(
    data: CreateMenuCategoryData
  ): Promise<MenuCategory> {
    const response = await api.post<ApiResponse<MenuCategory>>(
      `/${apiVersion}/menu-categories`,
      data
    );
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to create menu category');
  },

  /**
   * Update a menu category (authenticated)
   */
  async updateMenuCategory(
    categoryId: string,
    data: UpdateMenuCategoryData
  ): Promise<MenuCategory> {
    const response = await api.put<ApiResponse<MenuCategory>>(
      `/${apiVersion}/menu-categories/${categoryId}`,
      data
    );
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to update menu category');
  },

  /**
   * Delete a menu category (authenticated)
   */
  async deleteMenuCategory(categoryId: string): Promise<void> {
    const response = await api.delete<ApiResponse<null>>(
      `/${apiVersion}/menu-categories/${categoryId}`
    );
    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Failed to delete menu category');
    }
  },

  /**
   * Get all dishes (public)
   */
  async getDishes(filters?: DishFilters): Promise<Dish[]> {
    const response = await api.get<ApiResponse<Dish[]>>(`/${apiVersion}/dishes`, {
      params: filters,
    });
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch dishes');
  },

  /**
   * Get dishes by location within radius
   */
  async getDishesByLocation(
    lat: number,
    lng: number,
    radius: number = 10,
    additionalFilters?: Omit<DishFilters, 'lat' | 'lng' | 'radius'>
  ): Promise<Dish[]> {
    const filters: DishFilters = {
      ...additionalFilters,
      lat,
      lng,
      radius,
    };
    return this.getDishes(filters);
  },

  /**
   * Get top picks dishes
   */
  async getTopPicks(filters?: DishFilters): Promise<Dish[]> {
    const response = await api.get<ApiResponse<Dish[]>>(`/${apiVersion}/dishes`, {
      params: {
        ...filters,
        type: 'top_picks',
      },
    });
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch top picks');
  },

  /**
   * Get popular dishes
   */
  async getPopular(filters?: DishFilters): Promise<Dish[]> {
    const response = await api.get<ApiResponse<Dish[]>>(`/${apiVersion}/dishes`, {
      params: {
        ...filters,
        type: 'popular',
      },
    });
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch popular dishes');
  },

  /**
   * Get recently ordered dishes for authenticated user
   */
  async getRecentlyOrdered(filters?: DishFilters): Promise<Dish[]> {
    const response = await api.get<ApiResponse<Dish[]>>(`/${apiVersion}/dishes`, {
      params: {
        ...filters,
        type: 'recently_ordered',
      },
    });
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch recently ordered dishes');
  },

  /**
   * Get a single dish by ID (public)
   */
  async getDish(dishId: string): Promise<Dish> {
    const response = await api.get<ApiResponse<Dish>>(`/${apiVersion}/dishes/${dishId}`);
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch dish');
  },

  /**
   * Create a new dish (authenticated)
   */
  async createDish(data: CreateDishData): Promise<Dish> {
    const response = await api.post<ApiResponse<Dish>>(`/${apiVersion}/dishes`, data);
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to create dish');
  },

  /**
   * Update a dish (authenticated)
   */
  async updateDish(dishId: string, data: UpdateDishData): Promise<Dish> {
    const response = await api.put<ApiResponse<Dish>>(
      `/${apiVersion}/dishes/${dishId}`,
      data
    );
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to update dish');
  },

  /**
   * Delete a dish (authenticated)
   */
  async deleteDish(dishId: string): Promise<void> {
    const response = await api.delete<ApiResponse<null>>(
      `/${apiVersion}/dishes/${dishId}`
    );
    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Failed to delete dish');
    }
  },

  /**
   * Get all dish options for a dish (public)
   */
  async getDishOptions(dishId: string): Promise<DishOption[]> {
    const response = await api.get<ApiResponse<DishOption[]>>(
      `/${apiVersion}/dish-options`,
      {
        params: { dish_id: dishId },
      }
    );
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch dish options');
  },

  /**
   * Get a single dish option by ID (public)
   */
  async getDishOption(optionId: string): Promise<DishOption> {
    const response = await api.get<ApiResponse<DishOption>>(
      `/${apiVersion}/dish-options/${optionId}`
    );
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch dish option');
  },

  /**
   * Create a new dish option (authenticated)
   */
  async createDishOption(
    data: CreateDishOptionData
  ): Promise<DishOption> {
    const response = await api.post<ApiResponse<DishOption>>(
      `/${apiVersion}/dish-options`,
      data
    );
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to create dish option');
  },

  /**
   * Update a dish option (authenticated)
   */
  async updateDishOption(
    optionId: string,
    data: UpdateDishOptionData
  ): Promise<DishOption> {
    const response = await api.put<ApiResponse<DishOption>>(
      `/${apiVersion}/dish-options/${optionId}`,
      data
    );
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to update dish option');
  },

  /**
   * Delete a dish option (authenticated)
   */
  async deleteDishOption(optionId: string): Promise<void> {
    const response = await api.delete<ApiResponse<null>>(
      `/${apiVersion}/dish-options/${optionId}`
    );
    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Failed to delete dish option');
    }
  },

  /**
   * Get popular tags for filtering (public)
   */
  async getPopularTags(limit: number = 10): Promise<string[]> {
    const response = await api.get<ApiResponse<string[]>>(
      `/${apiVersion}/dishes/tags/popular`,
      {
        params: { limit },
      }
    );
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch popular tags');
  },
};

export default menuService;

