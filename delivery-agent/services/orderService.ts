import { create } from 'zustand';
import { Order, OrderStatus, RiderProfile } from '@/types/delivery';
import { MOCK_ORDERS, MOCK_RIDER_PROFILE } from '@/data/mockOrders';

interface OrderState {
  orders: Order[];
  activeOrder: Order | null;
  rider: RiderProfile;
  lastGPSLocation: { lat: number; lng: number; ts: number } | null;
  lastFirebaseWrite: {
    type: 'location' | 'status';
    success: boolean;
    timestamp: number;
    data?: any;
    error?: string;
  } | null;

  initializeRider: () => void;
  loadOrders: () => void;
  acceptOrder: (orderId: string) => void;
  setActiveOrder: (order: Order | null) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
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
  rider: MOCK_RIDER_PROFILE,
  lastGPSLocation: null,
  lastFirebaseWrite: null,

  initializeRider: () => {
    set({ rider: MOCK_RIDER_PROFILE });
  },

  loadOrders: () => {
    set({ orders: MOCK_ORDERS });
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

  updateOrderStatus: (orderId: string, status: OrderStatus) => {
    const orders = get().orders;
    const updated = orders.map((order) =>
      order.orderId === orderId ? { ...order, status } : order
    );
    set({ orders: updated });

    if (get().activeOrder?.orderId === orderId) {
      set({ activeOrder: { ...get().activeOrder!, status } });
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
}));
