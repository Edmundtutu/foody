import { useQuery } from '@tanstack/react-query';
import kitchenService from '@/services/kitchenService';

export function useKitchenGraph(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ['kitchen', 'graph', restaurantId],
    queryFn: () => kitchenService.getGraph(restaurantId!),
    enabled: !!restaurantId,
    staleTime: 1000 * 60, // 1 minute
  });
}

