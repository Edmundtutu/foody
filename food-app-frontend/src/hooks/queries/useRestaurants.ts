import { useQuery } from '@tanstack/react-query';
import restaurantService from '@/services/restaurantService';

export function useRestaurants(filters?: { name?: string; verification_status?: string }) {
  return useQuery({
    queryKey: ['restaurants', filters],
    queryFn: () => restaurantService.getRestaurants(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useRestaurant(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ['restaurants', restaurantId],
    queryFn: () => restaurantService.getRestaurant(restaurantId!),
    enabled: !!restaurantId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useRestaurantsByOwner(ownerId: string | undefined) {
  return useQuery({
    queryKey: ['restaurants', 'owner', ownerId],
    queryFn: () => restaurantService.getRestaurantsByOwner(ownerId!),
    enabled: !!ownerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useVendorRestaurants() {
  return useQuery({
    queryKey: ['vendor', 'restaurants'],
    queryFn: () => restaurantService.getVendorRestaurants(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useVendorRestaurant(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ['vendor', 'restaurants', restaurantId],
    queryFn: () => restaurantService.getVendorRestaurant(restaurantId!),
    enabled: !!restaurantId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

