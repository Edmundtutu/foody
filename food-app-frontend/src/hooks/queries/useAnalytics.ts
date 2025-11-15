import { useQuery } from '@tanstack/react-query';
import analyticsService, { type AnalyticsData } from '@/services/analyticsService';

/**
 * Hook to fetch restaurant analytics
 */
export function useRestaurantAnalytics(
  restaurantId: string | null,
  days: number = 7
) {
  return useQuery<AnalyticsData>({
    queryKey: ['analytics', restaurantId, days],
    queryFn: () => analyticsService.getRestaurantAnalytics(restaurantId!, days),
    enabled: !!restaurantId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

