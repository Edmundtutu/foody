import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import menuService, {
  type CreateMenuCategoryData,
  type MenuCategory,
  type UpdateMenuCategoryData,
} from '@/services/menuService';

/**
 * Hook to fetch menu categories for a restaurant
 */
export function useMenuCategories(restaurantId: string | null) {
  return useQuery<MenuCategory[]>({
    queryKey: ['menuCategories', restaurantId],
    queryFn: () => menuService.getMenuCategories(restaurantId!),
    enabled: !!restaurantId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch a single menu category
 */
export function useMenuCategory(categoryId: string | null) {
  return useQuery<MenuCategory>({
    queryKey: ['menuCategory', categoryId],
    queryFn: () => menuService.getMenuCategory(categoryId!),
    enabled: !!categoryId,
  });
}

/**
 * Hook to create a menu category
 */
export function useCreateMenuCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMenuCategoryData) =>
      menuService.createMenuCategory(data),
    onSuccess: (_, variables) => {
      // Invalidate categories list for the restaurant
      queryClient.invalidateQueries({
        queryKey: ['menuCategories', variables.restaurant_id],
      });
    },
  });
}

/**
 * Hook to update a menu category
 */
export function useUpdateMenuCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      categoryId,
      data,
    }: {
      categoryId: string;
      data: UpdateMenuCategoryData;
    }) => menuService.updateMenuCategory(categoryId, data),
    onSuccess: (updatedCategory) => {
      // Invalidate categories list and single category
      queryClient.invalidateQueries({
        queryKey: ['menuCategories', updatedCategory.restaurant_id],
      });
      queryClient.invalidateQueries({
        queryKey: ['menuCategory', updatedCategory.id],
      });
    },
  });
}

/**
 * Hook to delete a menu category
 */
export function useDeleteMenuCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: string) =>
      menuService.deleteMenuCategory(categoryId),
    onSuccess: () => {
      // Invalidate all category queries
      queryClient.invalidateQueries({ queryKey: ['menuCategories'] });
      queryClient.invalidateQueries({ queryKey: ['menuCategory'] });
    },
  });
}

