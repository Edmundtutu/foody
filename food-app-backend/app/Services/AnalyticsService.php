<?php

namespace App\Services;

use App\Models\Dish;
use App\Models\Order;
use App\Models\OrderItem;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AnalyticsService
{
    /**
     * Get analytics summary for a restaurant
     */
    public function getRestaurantAnalytics(string $restaurantId, int $days = 7): array
    {
        $startDate = Carbon::now()->subDays($days);
        $endDate = Carbon::now();

        // Total orders count
        $totalOrders = Order::where('restaurant_id', $restaurantId)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->count();

        // Orders by status
        $ordersByStatus = Order::where('restaurant_id', $restaurantId)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        // Total revenue (sum of all order totals)
        $totalRevenue = Order::where('restaurant_id', $restaurantId)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->where('status', '!=', 'cancelled')
            ->sum('total');

        // Average order value
        $averageOrderValue = $totalOrders > 0 ? (int) ($totalRevenue / $totalOrders) : 0;

        // Orders per day (last 7 days)
        $ordersPerDay = Order::where('restaurant_id', $restaurantId)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as count'))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->mapWithKeys(function ($item) {
                return [$item->date => $item->count];
            })
            ->toArray();

        // Top dishes (by quantity ordered)
        // Using polymorphic relationship: order_items can be either Dish or ComboSelection
        // Filter by orderable_type to get only dish-based orders for this metric
        $topDishes = OrderItem::whereHas('order', function ($query) use ($restaurantId, $startDate, $endDate) {
                $query->where('restaurant_id', $restaurantId)
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->where('status', '!=', 'cancelled');
            })
            ->where('order_items.orderable_type', Dish::class)
            ->join('dishes', 'order_items.orderable_id', '=', 'dishes.id')
            ->select('dishes.id', 'dishes.name', DB::raw('sum(order_items.quantity) as total_quantity'))
            ->groupBy('dishes.id', 'dishes.name')
            ->orderByDesc('total_quantity')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'name' => $item->name,
                    'quantity' => (int) $item->total_quantity,
                ];
            })
            ->toArray();

        // Revenue per day
        $revenuePerDay = Order::where('restaurant_id', $restaurantId)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->where('status', '!=', 'cancelled')
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('sum(total) as revenue'))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->mapWithKeys(function ($item) {
                return [$item->date => (int) $item->revenue];
            })
            ->toArray();

        return [
            'period' => [
                'start' => $startDate->toDateString(),
                'end' => $endDate->toDateString(),
                'days' => $days,
            ],
            'summary' => [
                'total_orders' => $totalOrders,
                'total_revenue' => (int) $totalRevenue,
                'average_order_value' => $averageOrderValue,
                'orders_by_status' => $ordersByStatus,
            ],
            'orders_per_day' => $ordersPerDay,
            'revenue_per_day' => $revenuePerDay,
            'top_dishes' => $topDishes,
        ];
    }
}

