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

