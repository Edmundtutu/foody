import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import menuService, {
  type CreateDishOptionData,
  type DishOption,
  type UpdateDishOptionData,
} from '@/services/menuService';

/**
 * Hook to fetch dish options for a dish
 */
export function useDishOptions(dishId: string | null) {
  return useQuery<DishOption[]>({
    queryKey: ['dishOptions', dishId],
    queryFn: () => menuService.getDishOptions(dishId!),
    enabled: !!dishId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch a single dish option
 */
export function useDishOption(optionId: string | null) {
  return useQuery<DishOption>({
    queryKey: ['dishOption', optionId],
    queryFn: () => menuService.getDishOption(optionId!),
    enabled: !!optionId,
  });
}

/**
 * Hook to create a dish option
 */
export function useCreateDishOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDishOptionData) =>
      menuService.createDishOption(data),
    onSuccess: (createdOption) => {
      // Invalidate options list for the dish
      queryClient.invalidateQueries({
        queryKey: ['dishOptions', createdOption.dish_id],
      });
      // Also invalidate the dish query since it includes options
      queryClient.invalidateQueries({
        queryKey: ['dish', createdOption.dish_id],
      });
    },
  });
}

/**
 * Hook to update a dish option
 */
export function useUpdateDishOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      optionId,
      data,
    }: {
      optionId: string;
      data: UpdateDishOptionData;
    }) => menuService.updateDishOption(optionId, data),
    onSuccess: (updatedOption) => {
      // Invalidate options list and single option
      queryClient.invalidateQueries({
        queryKey: ['dishOptions', updatedOption.dish_id],
      });
      queryClient.invalidateQueries({
        queryKey: ['dishOption', updatedOption.id],
      });
      // Also invalidate the dish query
      queryClient.invalidateQueries({
        queryKey: ['dish', updatedOption.dish_id],
      });
    },
  });
}

/**
 * Hook to delete a dish option
 */
export function useDeleteDishOption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (optionId: string) => menuService.deleteDishOption(optionId),
    onSuccess: () => {
      // Invalidate all option queries
      queryClient.invalidateQueries({ queryKey: ['dishOptions'] });
      queryClient.invalidateQueries({ queryKey: ['dishOption'] });
      queryClient.invalidateQueries({ queryKey: ['dish'] });
    },
  });
}

