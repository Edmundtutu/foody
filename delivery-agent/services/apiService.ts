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

interface ApiOrderItem {
    id: string;
    type: 'dish' | 'combo';
    quantity: number;
    dish?: {
        id: string;
        name: string;
    };
    combo_selection?: {
        id: string;
        combo_id: string;
        items?: Array<{
            dish?: {
                id: string;
                name: string;
            };
            price: number;
        }>;
    };
}

interface ApiOrderLogistics {
    id: string;
    order_id: string;
    agent_id: string | null;
    pickup_address: {
        street?: string;
        city?: string;
        lat?: number | string;
        lng?: number | string;
    } | null;
    delivery_address: {
        street?: string;
        city?: string;
        lat?: number | string;
        lng?: number | string;
    } | null;
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
        } | null;
        items?: ApiOrderItem[];
        restaurant?: {
            id: string;
            name: string;
        } | null;
        user?: {
            id: string;
            name: string;
        } | null;
    } | null;
}

class ApiService {
    private token: string | null = null;

    private toFiniteNumber(value: unknown, fallback: number): number {
        const n = typeof value === 'number' ? value : Number(value);
        return Number.isFinite(n) ? n : fallback;
    }

    async init(): Promise<void> {
        try {
            this.token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
            console.log('[ApiService] Token loaded:', { hasToken: !!this.token });
        } catch (error) {
            console.error('[ApiService] Error loading token:', error);
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

            // Handle empty responses
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                if (response.ok) {
                    return { status: 'success' as const };
                }
                return {
                    status: 'error',
                    message: `Request failed with status ${response.status}`,
                };
            }

            const data = await response.json();

            if (!response.ok) {
                return {
                    status: 'error',
                    message: data.message || `Request failed with status ${response.status}`,
                };
            }

            // Backend uses ApiResponseTrait which wraps in { status, message, data }
            // Some endpoints return direct JSON, handle both cases
            if (data.status === 'success' || data.status === 'error') {
                return data as ApiResponse<T>;
            }

            // Direct JSON response (like /me endpoint)
            return {
                status: 'success',
                data: data as T,
            };
        } catch (error) {
            console.error('[ApiService] Request error:', error);
            return {
                status: 'error',
                message: error instanceof Error ? error.message : 'Network error',
            };
        }
    }

    // Auth methods - OTP Authentication
    async requestOtp(phoneNumber: string): Promise<{ success: boolean; error?: string }> {
        // Backend returns { message, sms_sent } directly (not wrapped in ApiResponse)
        const url = `${API_BASE_URL}/agent/request-otp`;
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify({ phone_number: phoneNumber }),
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: data.message || `Request failed with status ${response.status}`,
                };
            }

            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Network error',
            };
        }
    }

    async verifyOtp(
        phoneNumber: string,
        otpCode: string
    ): Promise<{ success: boolean; token?: string; error?: string }> {
        // Backend returns { message, token, agent } directly (not wrapped in ApiResponse)
        const url = `${API_BASE_URL}/agent/verify-otp`;
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    phone_number: phoneNumber,
                    otp_code: otpCode,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: data.message || `Request failed with status ${response.status}`,
                };
            }

            // Backend returns { message, token, agent } directly
            const token = data.token;

            if (token) {
                await this.setToken(token);
                return { success: true, token };
            }

            return { success: false, error: 'No token returned' };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Network error',
            };
        }
    }

    async logout(): Promise<void> {
        try {
            await this.request('/logout', { method: 'POST' });
        } catch (error) {
            // Continue even if logout fails
            console.error('Logout error:', error);
        } finally {
            await this.clearToken();
        }
    }

    // Agent profile
    async getAgentProfile(): Promise<{ success: boolean; agent?: RiderProfile; error?: string }> {
        if (!this.token) {
            return { success: false, error: 'Not authenticated' };
        }

        // Backend returns { agent: {...} } directly (not wrapped in ApiResponse format)
        const response = await this.request<{ agent: ApiAgent }>('/me');
        
        if (response.status === 'error') {
            console.log('[ApiService] getAgentProfile error:', response.message);
            return { success: false, error: response.message };
        }
        
        // Backend returns { agent: {...} } directly, check response.data first, then response
        const agentData = response.data?.agent || (response as any).agent;
        
        if (agentData) {
            return { 
                success: true, 
                agent: this.mapApiAgentToRiderProfile(agentData) 
            };
        }
        
        return { success: false, error: 'No agent data returned' };
    }

    // Helper to map API agent to RiderProfile
    private mapApiAgentToRiderProfile(apiAgent: ApiAgent): RiderProfile {
        return {
            riderId: apiAgent.id,
            name: apiAgent.name,
            restaurantId: apiAgent.restaurant_id,
            vehicle: apiAgent.fleet_kind || 'Unknown',
            phone: apiAgent.phone_number,
        };
    }

    // Deliveries
    async getAssignedDeliveries(): Promise<{ success: boolean; orders?: Order[]; error?: string }> {
        const response = await this.request<ApiOrderLogistics[]>('/agent/deliveries');

        if (response.status === 'error') {
            return { success: false, error: response.message };
        }

        // Backend returns { status: 'success', data: [...] } format
        const logisticsArray = response.data || [];
        
        if (!Array.isArray(logisticsArray)) {
            console.log('[ApiService] getAssignedDeliveries - invalid response format');
            return { success: false, error: 'Invalid response format' };
        }

        // Handle empty array case
        if (logisticsArray.length === 0) {
            console.log('[ApiService] getAssignedDeliveries - no orders assigned');
            return { success: true, orders: [] };
        }

        // Map logistics to orders, filter out invalid ones
        const orders: Order[] = logisticsArray
            .filter((logistics) => {
                // Validate required fields
                if (!logistics.order_id || !logistics.id) {
                    console.warn('[ApiService] Invalid logistics record:', logistics);
                    return false;
                }
                return true;
            })
            .map((logistics) => this.mapLogisticsToOrder(logistics));
        
        console.log('[ApiService] getAssignedDeliveries - mapped orders:', orders.length);
        return { success: true, orders };
    }

    async updateDeliveryStatus(
        logisticsId: string,
        status: OrderStatus
    ): Promise<{ success: boolean; order?: Order; error?: string }> {
        console.log('[ApiService] updateDeliveryStatus:', { logisticsId, status });
        
        const response = await this.request<ApiOrderLogistics>(`/logistics/${logisticsId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });

        if (response.status === 'error') {
            console.log('[ApiService] updateDeliveryStatus error:', response.message);
            return { success: false, error: response.message };
        }

        // Backend returns { status: 'success', data: {...} } format
        const logistics = response.data;
        
        if (!logistics) {
            console.log('[ApiService] updateDeliveryStatus - no data returned');
            return { success: false, error: 'No data returned' };
        }

        const order = this.mapLogisticsToOrder(logistics);
        console.log('[ApiService] updateDeliveryStatus - success');
        return { success: true, order };
    }

    // Helper to map API logistics to app Order type
    private mapLogisticsToOrder(logistics: ApiOrderLogistics): Order {
        // Handle polymorphic items (dish vs combo)
        const items = (logistics.order?.items || [])
            .filter((item) => item && item.quantity > 0) // Filter invalid items
            .map((item) => {
                let itemName = 'Item';
                
                if (item.type === 'dish' && item.dish?.name) {
                    itemName = item.dish.name;
                } else if (item.type === 'combo' && item.combo_selection) {
                    // For combo, show combo name or list of dishes
                    const comboItems = item.combo_selection.items || [];
                    if (comboItems.length > 0) {
                        const dishNames = comboItems
                            .map((ci) => ci.dish?.name)
                            .filter(Boolean)
                            .join(', ');
                        itemName = dishNames 
                            ? `Combo (${dishNames})` 
                            : `Combo (${comboItems.length} items)`;
                    } else {
                        itemName = 'Combo';
                    }
                } else if (item.type === 'combo') {
                    itemName = 'Combo';
                }
                
                return {
                    name: itemName,
                    qty: item.quantity || 1,
                };
            });

        // Handle pickup address - prefer logistics pickup_address, fallback to restaurant location
        const pickupAddress = logistics.pickup_address;
        const pickupLat = this.toFiniteNumber(pickupAddress?.lat, 0);
        const pickupLng = this.toFiniteNumber(pickupAddress?.lng, 0);

        // Handle delivery address
        const deliveryAddress = logistics.delivery_address;
        const deliveryLat = this.toFiniteNumber(deliveryAddress?.lat, 0);
        const deliveryLng = this.toFiniteNumber(deliveryAddress?.lng, 0);
        const deliveryStreet = deliveryAddress?.street || 'Delivery Address';

        // Handle customer info - prefer delivery_contact, fallback to user
        const deliveryContact = logistics.order?.delivery_contact;
        const customerName = deliveryContact?.name || 
                            logistics.order?.user?.name || 
                            'Customer';
        const customerPhone = deliveryContact?.phone || '';

        // Handle restaurant name
        const restaurantName = logistics.order?.restaurant?.name || 'Restaurant';

        // Validate required fields
        if (!logistics.order_id || !logistics.id) {
            throw new Error('Invalid logistics data: missing order_id or id');
        }

        return {
            orderId: logistics.order_id,
            logisticsId: logistics.id,
            restaurantId: logistics.order?.restaurant_id || '',
            customer: {
                name: customerName,
                phone: customerPhone,
            },
            pickup: {
                name: restaurantName,
                lat: pickupLat,
                lng: pickupLng,
            },
            dropoff: {
                name: deliveryStreet,
                lat: deliveryLat,
                lng: deliveryLng,
            },
            items: items.length > 0 ? items : [{ name: 'Order items', qty: 1 }], // Fallback if no items
            status: logistics.delivery_status,
            createdAt: logistics.assigned_at 
                ? new Date(logistics.assigned_at).getTime() 
                : Date.now(),
        };
    }
}

export const apiService = new ApiService();
export default apiService;
