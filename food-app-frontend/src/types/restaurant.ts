import { type AuthUser } from './auth';
import  {type Dish,}  from '@/services/menuService';

export interface Review {
  id: string;
  user_id: string;
  user: AuthUser;
  dish_id?: string;
  dish?: Dish;
  restaurant_id?: string;
  restaurant?: Restaurant;
  rating: number;
  comment?: string;
  images?: string[];
  created_at: string;
  updated_at: string;
}

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

export interface Comment {
  id: string;
  user_id: string;
  user: AuthUser;
  body: string;
  parent_id?: string;
  depth: number;
  likes_count: number;
  replies_count: number;
  liked_by_user: boolean;
  replies?: Comment[];
  created_at: string;
  updated_at: string;
}


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
  rating?: number;
  total_reviews?: number;
  distance?: number;
  hours?: {
    [key: string]: { open: string; close: string } | null;
  };
  verified: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}