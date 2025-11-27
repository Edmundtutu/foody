import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import menuService, {
  type CreateDishData,
  type Dish,
  type DishFilters,
  type UpdateDishData,
} from '@/services/menuService';

/**
 * Hook to fetch dishes with optional filters
 */
export function useDishes(filters?: DishFilters) {
  return useQuery<Dish[]>({
    queryKey: ['dishes', filters],
    queryFn: () => menuService.getDishes(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch a single dish
 */
export function useDish(dishId: string | null) {
  return useQuery<Dish>({
    queryKey: ['dish', dishId],
    queryFn: () => menuService.getDish(dishId!),
    enabled: !!dishId,
  });
}

/**
 * Hook to create a dish
 */
export function useCreateDish() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDishData) => menuService.createDish(data),
    onSuccess: (createdDish, variables) => {
      // Invalidate dishes list for the restaurant
      queryClient.invalidateQueries({
        queryKey: ['dishes', { restaurant_id: variables.restaurant_id }],
      });
      // Also invalidate category queries since dishes are grouped by category
      queryClient.invalidateQueries({
        queryKey: ['menuCategories', variables.restaurant_id],
      });
    },
  });
}

/**
 * Hook to update a dish
 */
export function useUpdateDish() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dishId, data }: { dishId: string; data: UpdateDishData }) =>
      menuService.updateDish(dishId, data),
    onSuccess: (updatedDish) => {
      // Invalidate dishes list and single dish
      queryClient.invalidateQueries({
        queryKey: ['dishes', { restaurant_id: updatedDish.restaurant_id }],
      });
      queryClient.invalidateQueries({
        queryKey: ['dish', updatedDish.id],
      });
      // Also invalidate category queries
      queryClient.invalidateQueries({
        queryKey: ['menuCategories', updatedDish.restaurant_id],
      });
    },
  });
}

/**
 * Hook to delete a dish
 */
export function useDeleteDish() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dishId: string) => menuService.deleteDish(dishId),
    onSuccess: () => {
      // Invalidate all dish queries
      queryClient.invalidateQueries({ queryKey: ['dishes'] });
      queryClient.invalidateQueries({ queryKey: ['dish'] });
      queryClient.invalidateQueries({ queryKey: ['menuCategories'] });
    },
  });
}

/**
 * Hook to fetch dishes by location within radius
 */
export function useDishesByLocation(
  lat: number | null,
  lng: number | null,
  radius: number = 10,
  additionalFilters?: Omit<DishFilters, 'lat' | 'lng' | 'radius'>
) {
  return useQuery<Dish[]>({
    queryKey: ['dishes', 'location', lat, lng, radius, additionalFilters],
    queryFn: () => menuService.getDishesByLocation(lat!, lng!, radius, additionalFilters),
    enabled: !!lat && !!lng,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch top picks dishes
 */
export function useTopPicks(filters?: DishFilters) {
  return useQuery<Dish[]>({
    queryKey: ['dishes', 'top_picks', filters],
    queryFn: () => menuService.getTopPicks(filters),
    staleTime: 1000 * 60 * 10, // 10 minutes (top picks change less frequently)
  });
}

/**
 * Hook to fetch popular dishes
 */
export function usePopularDishes(filters?: DishFilters) {
  return useQuery<Dish[]>({
    queryKey: ['dishes', 'popular', filters],
    queryFn: () => menuService.getPopular(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch recently ordered dishes for authenticated user
 */
export function useRecentlyOrdered(filters?: DishFilters) {
  return useQuery<Dish[]>({
    queryKey: ['dishes', 'recently_ordered', filters],
    queryFn: () => menuService.getRecentlyOrdered(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch popular tags for filtering
 */
export function usePopularTags(limit: number = 10) {
  return useQuery<string[]>({
    queryKey: ['dish-tags', 'popular', limit],
    queryFn: () => menuService.getPopularTags(limit),
    staleTime: 1000 * 60 * 15, // 15 minutes (tags don't change frequently)
  });
}

