import { create } from 'zustand';
import { Order, OrderStatus, RiderProfile } from '@/types/delivery';
import { MOCK_ORDERS, MOCK_RIDER_PROFILE } from '@/data/mockOrders';
import { apiService } from './apiService';

interface OrderState {
  orders: Order[];
  activeOrder: Order | null;
  rider: RiderProfile;
  isOnline: boolean; // Whether connected to backend API
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
  setOnlineMode: (online: boolean) => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  activeOrder: null,
  rider: MOCK_RIDER_PROFILE,
  isOnline: false, // Start in offline/mock mode
  isLoading: false,
  error: null,
  lastGPSLocation: null,
  lastFirebaseWrite: null,

  initializeRider: async () => {
    const { isOnline } = get();
    
    if (isOnline) {
      await apiService.init();
      const result = await apiService.getAgentProfile();
      if (result.success && result.agent) {
        set({ rider: result.agent });
        return;
      }
    }
    
    // Fallback to mock data
    set({ rider: MOCK_RIDER_PROFILE });
  },

  loadOrders: async () => {
    const { isOnline } = get();
    set({ isLoading: true, error: null });

    if (isOnline) {
      const result = await apiService.getAssignedDeliveries();
      if (result.success && result.orders) {
        set({ orders: result.orders, isLoading: false });
        return;
      }
      set({ error: result.error || 'Failed to load orders', isLoading: false });
    }
    
    // Fallback to mock data
    set({ orders: MOCK_ORDERS, isLoading: false });
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
    const { isOnline, orders, activeOrder } = get();
    const order = orders.find(o => o.orderId === orderId);
    
    if (isOnline && order?.logisticsId) {
      set({ isLoading: true });
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
      
      set({ error: result.error || 'Failed to update status', isLoading: false });
      // Continue with local update as fallback
    }
    
    // Local update (mock mode or API fallback)
    const updated = orders.map((o) =>
      o.orderId === orderId ? { ...o, status } : o
    );
    set({ orders: updated });

    if (activeOrder?.orderId === orderId) {
      set({ activeOrder: { ...activeOrder, status } });
    }
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
  
  setOnlineMode: (online: boolean) => {
    set({ isOnline: online });
  },
}));
