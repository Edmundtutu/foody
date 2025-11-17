import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { useVendorRestaurants } from '@/hooks/queries/useRestaurants';
import type { Restaurant } from '@/services/restaurantService';

interface VendorContextType {
  restaurantId: string | undefined;
  restaurant: Restaurant | undefined;
  restaurants: Restaurant[];
  isLoading: boolean;
  error: Error | null;
  selectRestaurant: (restaurantId: string) => void;
  hasRestaurant: boolean;
}

const VendorContext = createContext<VendorContextType | undefined>(undefined);

export const useVendor = () => {
  const context = useContext(VendorContext);
  if (!context) {
    throw new Error('useVendor must be used within a VendorProvider');
  }
  return context;
};

interface VendorProviderProps {
  children: React.ReactNode;
}

export const VendorProvider: React.FC<VendorProviderProps> = ({ children }) => {
  // Use vendor-specific endpoint to fetch only user's restaurants
  const { data: restaurants = [], isLoading, error } = useVendorRestaurants();

  // Use first restaurant as default
  const activeRestaurantId = useMemo(
    () => restaurants[0]?.id as string | undefined,
    [restaurants]
  );

  const activeRestaurant = useMemo(
    () => restaurants.find((r: Restaurant) => r.id === activeRestaurantId),
    [restaurants, activeRestaurantId]
  );

  const selectRestaurant = useCallback((restaurantId: string) => {
    // Validate that the selected restaurant belongs to the user
    const exists = restaurants.some((r: Restaurant) => r.id === restaurantId);
    if (!exists) {
      console.warn(`Restaurant ${restaurantId} not found in user's restaurants`);
      return;
    }
    // Implementation could be extended to store selection in localStorage if needed
  }, [restaurants]);

  const value: VendorContextType = {
    restaurantId: activeRestaurantId,
    restaurant: activeRestaurant,
    restaurants,
    isLoading,
    error: error as Error | null,
    selectRestaurant,
    hasRestaurant: restaurants.length > 0,
  };

  return (
    <VendorContext.Provider value={value}>
      {children}
    </VendorContext.Provider>
  );
};
