// Standardized API response format matching backend
import type { Restaurant } from '@/services/restaurantService';// To be refactored 
import { type AuthUser } from './auth';
import type { Dish } from '@/services/menuService';


export interface ApiResponse<T> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// Laravel resource paginator shape
export interface LaravelPaginatedResponse<T> {
  data: T[];
  links?: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface ApiError {
  status: 'error';
  message: string;
  errors?: Record<string, string[]>;
}

// Placeholder Post type for tentantive use in postService.ts: To be refactored later
export interface Post {
  id: string;
  user_id: string;
  user: AuthUser;
  content: string;
  images: string[];
  captions?: string[];
  hashtags?: string[];
  dish_id?: string;
  dish?: Dish;
  restaurant_id?: string;
  restaurant?: Restaurant;
  likes_count: number;
  comments_count: number;
  liked_by_user: boolean;
  created_at: string;
  updated_at: string;
}
