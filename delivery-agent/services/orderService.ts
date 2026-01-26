import { create } from 'zustand';
import { Order, OrderStatus, RiderProfile } from '@/types/delivery';
import { apiService } from './apiService';

interface OrderState {
  orders: Order[];
  activeOrder: Order | null;
  rider: RiderProfile | null; // Changed to nullable - no mock fallback
  isLoading: boolean;
  error: string | null;
  lastGPSLocation: { lat: number; lng: number; ts: number } | null;
  lastFirebaseWrite: {
    type: 'location' | 'status';
    success: boolean;
    timestamp: number;
    data?: any;
    error?: string;
  } | null;

  initializeRider: () => Promise<void>;
  loadOrders: () => Promise<void>;
  acceptOrder: (orderId: string) => void;
  setActiveOrder: (order: Order | null) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  updateGPSLocation: (lat: number, lng: number) => void;
  recordFirebaseWrite: (
    type: 'location' | 'status',
    success: boolean,
    timestamp: number,
    data?: any,
    error?: string
  ) => void;
  getOrderById: (orderId: string) => Order | undefined;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  activeOrder: null,
  rider: null, // Start as null - will be set by API or show error
  isLoading: false,
  error: null,
  lastGPSLocation: null,
  lastFirebaseWrite: null,

  initializeRider: async () => {
    set({ isLoading: true, error: null });
    
    await apiService.init();
    const result = await apiService.getAgentProfile();
    
    if (result.success && result.agent) {
      set({ rider: result.agent, isLoading: false });
      return;
    }
    
    // NO FALLBACK - Set error state instead
    console.log('[OrderService] Failed to load rider profile:', result.error);
    set({ 
      error: result.error || 'Failed to load rider profile. Check network connection.', 
      isLoading: false,
      rider: null // Explicitly null to indicate failure
    });
  },

  loadOrders: async () => {
    set({ isLoading: true, error: null, orders: [] }); // Clear existing orders
    
    const result = await apiService.getAssignedDeliveries();
    
    if (result.success && result.orders) {
      set({ orders: result.orders, isLoading: false });
      return;
    }
    
    // NO FALLBACK - Set error state instead
    set({ 
      error: result.error || 'Failed to load delivery orders. Check API connection.', 
      isLoading: false,
      orders: [] // Ensure empty array on failure
    });
  },

  acceptOrder: (orderId: string) => {
    const orders = get().orders;
    const updated = orders.map((order) =>
      order.orderId === orderId ? { ...order, status: 'ASSIGNED' as OrderStatus } : order
    );
    set({ orders: updated });
  },

  setActiveOrder: (order: Order | null) => {
    set({ activeOrder: order });
  },

  updateOrderStatus: async (orderId: string, status: OrderStatus) => {
    const { orders, activeOrder } = get();
    const order = orders.find(o => o.orderId === orderId);
    
    if (!order?.logisticsId) {
      set({ error: 'Order not found or missing logistics ID' });
      return;
    }
    
    set({ isLoading: true, error: null });
    const result = await apiService.updateDeliveryStatus(order.logisticsId, status);
    
    if (result.success && result.order) {
      const updated = orders.map((o) =>
        o.orderId === orderId ? result.order! : o
      );
      set({ 
        orders: updated, 
        isLoading: false,
        activeOrder: activeOrder?.orderId === orderId ? result.order : activeOrder
      });
      return;
    }
    
    // NO FALLBACK - Set error and stop
    set({ 
      error: result.error || 'Failed to update delivery status. Please try again.', 
      isLoading: false 
    });
  },

  updateGPSLocation: (lat: number, lng: number) => {
    set({
      lastGPSLocation: {
        lat,
        lng,
        ts: Date.now(),
      },
    });
  },

  recordFirebaseWrite: (type, success, timestamp, data, error) => {
    set({
      lastFirebaseWrite: {
        type,
        success,
        timestamp,
        data,
        error,
      },
    });
  },

  getOrderById: (orderId: string) => {
    return get().orders.find((order) => order.orderId === orderId);
  },
}));
