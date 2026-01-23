import { Order } from '@/types/delivery';

export const MOCK_RIDER_PROFILE = {
  riderId: 'RIDER-001',
  name: 'Demo Rider',
  restaurantId: 'REST-101',
  vehicle: 'Motorbike',
  phone: '+256700000000',
};

export const MOCK_ORDERS: Order[] = [
  {
    orderId: 'ORD-9001',
    restaurantId: 'REST-101',
    customer: {
      name: 'John Doe',
      phone: '+256700000001',
    },  
    pickup: {
      name: 'Demo Restaurant',
      lat: -1.2921,
      lng: 36.8219,
    },
    dropoff: {
      name: 'Customer Address',
      lat: -1.3005,
      lng: 36.8052,
    },
    items: [
      { name: 'Burger', qty: 2 },
      { name: 'Soda', qty: 1 },
    ],
    status: 'ASSIGNED',
    createdAt: Date.now() - 600000,
  },
  {
    orderId: 'ORD-9002',
    restaurantId: 'REST-101',
    customer: {
      name: 'Jane Smith',
      phone: '+256700000002',
    },
    pickup: {
      name: 'Demo Restaurant',
      lat: -1.2921,
      lng: 36.8219,
    },
    dropoff: {
      name: 'Jane Residence',
      lat: -1.2850,
      lng: 36.8100,
    },
    items: [
      { name: 'Pizza', qty: 1 },
      { name: 'Salad', qty: 1 },
    ],
    status: 'ASSIGNED',
    createdAt: Date.now() - 300000,
  },
  {
    orderId: 'ORD-9003',
    restaurantId: 'REST-101',
    customer: {
      name: 'Bob Johnson',
      phone: '+256700000003',
    },
    pickup: {
      name: 'Demo Restaurant',
      lat: -1.2921,
      lng: 36.8219,
    },
    dropoff: {
      name: 'Bob Office',
      lat: -1.2780,
      lng: 36.8300,
    },
    items: [
      { name: 'Chicken Wings', qty: 3 },
      { name: 'Fries', qty: 2 },
    ],
    status: 'ASSIGNED',
    createdAt: Date.now() - 100000,
  },
];
