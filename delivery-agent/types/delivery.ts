export interface Location {
  lat: number;
  lng: number;
}

export interface LocationWithName extends Location {
  name: string;
}

export interface Order {
  orderId: string;
  restaurantId: string;
  customer: {
    name: string;
    phone: string;
  };
  pickup: LocationWithName;
  dropoff: LocationWithName;
  items: Array<{
    name: string;
    qty: number;
  }>;
  status: OrderStatus;
  createdAt: number;
}

export type OrderStatus = 'ASSIGNED' | 'PICKED_UP' | 'ON_THE_WAY' | 'DELIVERED';

export interface RiderProfile {
  riderId: string;
  name: string;
  restaurantId: string;
  vehicle: string;
  phone?: string;
}

export interface LiveLocation {
  riderId: string;
  orderId: string;
  lat: number;
  lng: number;
  speed: number;
  bearing: number;
  ts: number;
  accuracy?: number;
}

export interface OrderStatusUpdate {
  status: OrderStatus;
  updatedAt: number;
  riderId: string;
  orderId: string;
}

export interface FirebaseLocationPayload {
  riderId: string;
  lat: number;
  lng: number;
  speed: number;
  bearing: number;
  ts: number;
}

export interface FirebaseStatusPayload {
  status: OrderStatus;
  updatedAt: number;
  riderId: string;
}
