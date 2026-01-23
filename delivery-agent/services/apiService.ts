import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Order, OrderStatus, RiderProfile } from '@/types/delivery';

const extra = Constants.expoConfig?.extra ?? {};
const API_BASE_URL = extra.apiBaseUrl || 'http://localhost:8000/api/v1';

// Token storage keys
const AUTH_TOKEN_KEY = 'auth_token';

interface ApiResponse<T> {
    status: 'success' | 'error';
    message?: string;
    data?: T;
}

interface ApiAgent {
    id: string;
    restaurant_id: string;
    user_id: string | null;
    nin: string;
    name: string;
    phone_number: string;
    fleet_kind: string;
    plate_number: string | null;
    status: string;
    is_available: boolean;
    current_load: number;
}

interface ApiOrderLogistics {
    id: string;
    order_id: string;
    agent_id: string | null;
    pickup_address: {
        street?: string;
        city?: string;
        lat?: number;
        lng?: number;
    };
    delivery_address: {
        street?: string;
        city?: string;
        lat?: number;
        lng?: number;
    };
    delivery_status: OrderStatus;
    assigned_at: string | null;
    picked_up_at: string | null;
    delivered_at: string | null;
    order?: {
        id: string;
        restaurant_id: string;
        total: number;
        notes: string | null;
        delivery_contact?: {
            name: string;
            phone: string;
        };
        items?: Array<{
            dish?: { name: string };
            quantity: number;
        }>;
        restaurant?: {
            name: string;
        };
    };
}

class ApiService {
    private token: string | null = null;

    async init(): Promise<void> {
        try {
            this.token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        } catch {
            this.token = null;
        }
    }

    async setToken(token: string): Promise<void> {
        this.token = token;
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    }

    async clearToken(): Promise<void> {
        this.token = null;
        await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const url = `${API_BASE_URL}${endpoint}`;

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(options.headers || {}),
        };

        if (this.token) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    status: 'error',
                    message: data.message || `Request failed with status ${response.status}`,
                };
            }

            return data;
        } catch (error) {
            return {
                status: 'error',
                message: error instanceof Error ? error.message : 'Network error',
            };
        }
    }

    // Auth methods
    async login(email: string, password: string): Promise<{ success: boolean; agent?: RiderProfile; error?: string }> {
        const response = await this.request<{ token: string; user: any }>('/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        if (response.status === 'error') {
            return { success: false, error: response.message };
        }

        if (response.data?.token) {
            await this.setToken(response.data.token);
        }

        // Fetch agent profile after login
        const agentResponse = await this.getAgentProfile();
        return agentResponse;
    }

    async logout(): Promise<void> {
        await this.request('/logout', { method: 'POST' });
        await this.clearToken();
    }

    // Agent profile
    async getAgentProfile(): Promise<{ success: boolean; agent?: RiderProfile; error?: string }> {
        // The agent profile would typically be fetched from a dedicated endpoint
        // For now, we'll return success if token exists
        if (!this.token) {
            return { success: false, error: 'Not authenticated' };
        }

        // This would be replaced with actual API call
        // GET /agent/profile or similar
        return {
            success: true,
            agent: {
                riderId: 'agent-1',
                name: 'Delivery Agent',
                restaurantId: 'restaurant-1',
                vehicle: 'Motorcycle',
            },
        };
    }

    // Deliveries
    async getAssignedDeliveries(): Promise<{ success: boolean; orders?: Order[]; error?: string }> {
        const response = await this.request<ApiOrderLogistics[]>('/agent/deliveries');

        if (response.status === 'error') {
            return { success: false, error: response.message };
        }

        const orders: Order[] = (response.data || []).map(this.mapLogisticsToOrder);
        return { success: true, orders };
    }

    async updateDeliveryStatus(
        logisticsId: string,
        status: OrderStatus
    ): Promise<{ success: boolean; order?: Order; error?: string }> {
        const response = await this.request<ApiOrderLogistics>(`/logistics/${logisticsId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });

        if (response.status === 'error') {
            return { success: false, error: response.message };
        }

        if (response.data) {
            return { success: true, order: this.mapLogisticsToOrder(response.data) };
        }

        return { success: false, error: 'No data returned' };
    }

    // Helper to map API logistics to app Order type
    private mapLogisticsToOrder(logistics: ApiOrderLogistics): Order {
        return {
            orderId: logistics.order_id,
            logisticsId: logistics.id,
            restaurantId: logistics.order?.restaurant_id || '',
            customer: {
                name: logistics.order?.delivery_contact?.name || 'Customer',
                phone: logistics.order?.delivery_contact?.phone || '',
            },
            pickup: {
                name: logistics.order?.restaurant?.name || 'Restaurant',
                lat: logistics.pickup_address?.lat || 0,
                lng: logistics.pickup_address?.lng || 0,
            },
            dropoff: {
                name: logistics.delivery_address?.street || 'Delivery Address',
                lat: logistics.delivery_address?.lat || 0,
                lng: logistics.delivery_address?.lng || 0,
            },
            items: (logistics.order?.items || []).map(item => ({
                name: item.dish?.name || 'Item',
                qty: item.quantity,
            })),
            status: logistics.delivery_status,
            createdAt: new Date(logistics.assigned_at || Date.now()).getTime(),
        };
    }
}

export const apiService = new ApiService();
export default apiService;
