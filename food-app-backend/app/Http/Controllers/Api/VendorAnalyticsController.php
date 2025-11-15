<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AnalyticsService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;

class VendorAnalyticsController extends Controller
{
    use ApiResponseTrait;

    protected $analyticsService;

    public function __construct(AnalyticsService $analyticsService)
    {
        $this->analyticsService = $analyticsService;
    }

    /**
     * Get analytics for a restaurant
     */
    public function index(Request $request, string $restaurantId)
    {
        // Verify user owns the restaurant
        $user = auth()->user();
        $restaurant = \App\Models\Restaurant::findOrFail($restaurantId);

        if ($user->id !== $restaurant->owner_id && $user->role !== 'admin') {
            return $this->error('Unauthorized', 403);
        }

        $days = $request->query('days', 7);
        $days = min(max((int) $days, 1), 90); // Limit between 1 and 90 days

        $analytics = $this->analyticsService->getRestaurantAnalytics($restaurantId, $days);

        return $this->success($analytics, 'Analytics retrieved successfully');
    }
}

