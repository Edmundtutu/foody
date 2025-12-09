import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import menuService, {
    type Combo,
    type ComboFilters,
    type CreateComboData,
    type UpdateComboData,
    type CreateComboGroupData,
    type UpdateComboGroupData,
    type CreateComboGroupItemData,
} from '@/services/menuService';

/**
 * Hook to fetch combos with optional filters
 */
export function useCombos(filters?: ComboFilters) {
    return useQuery<Combo[]>({
        queryKey: ['combos', filters],
        queryFn: () => menuService.getCombos(filters),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

/**
 * Hook to fetch combos by restaurant ID
 */
export function useRestaurantCombos(restaurantId: string | null) {
    return useQuery<Combo[]>({
        queryKey: ['combos', 'restaurant', restaurantId],
        queryFn: () => menuService.getRestaurantCombos(restaurantId!),
        enabled: !!restaurantId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

/**
 * Hook to fetch a single combo
 */
export function useCombo(comboId: string | null) {
    return useQuery<Combo>({
        queryKey: ['combo', comboId],
        queryFn: () => menuService.getCombo(comboId!),
        enabled: !!comboId,
    });
}

/**
 * Hook to create a combo
 */
export function useCreateCombo() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateComboData) => menuService.createCombo(data),
        onSuccess: (_createdCombo, variables) => {
            // Invalidate combos list for the restaurant
            queryClient.invalidateQueries({
                queryKey: ['combos', { restaurant_id: variables.restaurant_id }],
            });
            queryClient.invalidateQueries({
                queryKey: ['combos', 'restaurant', variables.restaurant_id],
            });
        },
    });
}

/**
 * Hook to update a combo
 */
export function useUpdateCombo() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ comboId, data }: { comboId: string; data: UpdateComboData }) =>
            menuService.updateCombo(comboId, data),
        onSuccess: (updatedCombo) => {
            // Invalidate combos list and single combo
            queryClient.invalidateQueries({
                queryKey: ['combos', { restaurant_id: updatedCombo.restaurant_id }],
            });
            queryClient.invalidateQueries({
                queryKey: ['combos', 'restaurant', updatedCombo.restaurant_id],
            });
            queryClient.invalidateQueries({
                queryKey: ['combo', updatedCombo.id],
            });
        },
    });
}

/**
 * Hook to delete a combo
 */
export function useDeleteCombo() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (comboId: string) => menuService.deleteCombo(comboId),
        onSuccess: () => {
            // Invalidate all combo queries
            queryClient.invalidateQueries({ queryKey: ['combos'] });
            queryClient.invalidateQueries({ queryKey: ['combo'] });
        },
    });
}

/**
 * Hook to create a combo group
 */
export function useCreateComboGroup() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateComboGroupData) => menuService.createComboGroup(data),
        onSuccess: (_createdGroup, variables) => {
            // Invalidate the parent combo to refresh groups
            queryClient.invalidateQueries({
                queryKey: ['combo', variables.combo_id],
            });
            queryClient.invalidateQueries({
                queryKey: ['combos'],
            });
        },
    });
}

/**
 * Hook to update a combo group
 */
export function useUpdateComboGroup() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ groupId, data }: { groupId: string; data: UpdateComboGroupData }) =>
            menuService.updateComboGroup(groupId, data),
        onSuccess: () => {
            // Invalidate combo queries to refresh groups
            queryClient.invalidateQueries({ queryKey: ['combos'] });
            queryClient.invalidateQueries({ queryKey: ['combo'] });
        },
    });
}

/**
 * Hook to delete a combo group
 */
export function useDeleteComboGroup() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (groupId: string) => menuService.deleteComboGroup(groupId),
        onSuccess: () => {
            // Invalidate combo queries to refresh groups
            queryClient.invalidateQueries({ queryKey: ['combos'] });
            queryClient.invalidateQueries({ queryKey: ['combo'] });
        },
    });
}

/**
 * Hook to create a combo group item
 */
export function useCreateComboGroupItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateComboGroupItemData) => menuService.createComboGroupItem(data),
        onSuccess: () => {
            // Invalidate combo queries to refresh items
            queryClient.invalidateQueries({ queryKey: ['combos'] });
            queryClient.invalidateQueries({ queryKey: ['combo'] });
        },
    });
}

/**
 * Hook to delete a combo group item
 */
export function useDeleteComboGroupItem() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (itemId: string) => menuService.deleteComboGroupItem(itemId),
        onSuccess: () => {
            // Invalidate combo queries to refresh items
            queryClient.invalidateQueries({ queryKey: ['combos'] });
            queryClient.invalidateQueries({ queryKey: ['combo'] });
        },
    });
}
