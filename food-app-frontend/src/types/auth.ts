export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email?: string;
  phone?: string;
  password: string;
  password_confirmation: string;
  role?: 'customer' | 'restaurant' | 'admin';
}

// User type matching backend User model
export interface User {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role: 'customer' | 'restaurant' | 'admin';
  avatar?: string | null;
  phone_verified_at?: string | null;
  email_verified_at?: string | null;
  followers?: number;
  following?: number;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email?: string | null;
  name: string;
  phone?: string | null;
  role: 'customer' | 'restaurant' | 'admin';
  avatar?: string | null;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
  followers?: number;
  following?: number;
  isInfluencer: boolean; // computed: followers >= INFLUENCER_THRESHOLD
  verified?: boolean; // computed from email_verified_at or phone_verified_at
  createdAt: Date;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}