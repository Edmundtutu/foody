import api from './api';
import type { ApiResponse } from '@/types/api';

export interface AnalyticsPeriod {
  start: string;
  end: string;
  days: number;
}

export interface AnalyticsSummary {
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
  orders_by_status: Record<string, number>;
}

export interface AnalyticsData {
  period: AnalyticsPeriod;
  summary: AnalyticsSummary;
  orders_per_day: Record<string, number>;
  revenue_per_day: Record<string, number>;
  top_dishes: Array<{
    id: string;
    name: string;
    quantity: number;
  }>;
}

const analyticsService = {
  /**
   * Get analytics for a restaurant (authenticated)
   */
  async getRestaurantAnalytics(
    restaurantId: string,
    days: number = 7
  ): Promise<AnalyticsData> {
    const response = await api.get<ApiResponse<AnalyticsData>>(
      `/v1/vendor/${restaurantId}/analytics`,
      {
        params: { days },
      }
    );
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch analytics');
  },
};

export default analyticsService;

