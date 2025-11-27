<?php

namespace App\Http\Controllers\Api\Dishes;

use App\Http\Controllers\Controller;
use App\Http\Requests\DishRequest;
use App\Http\Resources\DishResource;
use App\Services\DishService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;

class DishController extends Controller
{
    use ApiResponseTrait;

    protected $dishService;

    public function __construct(DishService $dishService)
    {
        $this->dishService = $dishService;
    }

    public function index(Request $request)
    {
        $filters = $request->only([
            'restaurant_id', 
            'category_id', 
            'available', 
            'name',
            'tag',
            'lat',
            'lng',
            'radius',
            'sort'
        ]);

        // Handle special query types
        $type = $request->query('type'); // 'top_picks', 'popular', 'recently_ordered'

        if ($type === 'top_picks') {
            $dishes = $this->dishService->getTopPicks($filters);
        } elseif ($type === 'popular') {
            $dishes = $this->dishService->getPopular($filters);
        } elseif ($type === 'recently_ordered' && $request->user()) {
            $dishes = $this->dishService->getRecentlyOrdered($request->user()->id, $filters);
        } else {
            $dishes = $this->dishService->getAllDishes($filters);
        }

        // Calculate distance and delivery time if location provided
        $lat = $request->query('lat');
        $lng = $request->query('lng');
        
        if ($lat && $lng) {
            $dishes = $dishes->map(function ($dish) use ($lat, $lng) {
                if ($dish->restaurant && $dish->restaurant->latitude && $dish->restaurant->longitude) {
                    // Calculate distance in km
                    $distance = $this->calculateDistance(
                        (float) $lat,
                        (float) $lng,
                        (float) $dish->restaurant->latitude,
                        (float) $dish->restaurant->longitude
                    );
                    $dish->distance = round($distance, 2);
                    
                    // Estimate delivery time (rough estimate: 5 min base + 2 min per km)
                    $dish->delivery_time = max(15, round(5 + ($distance * 2)));
                }
                return $dish;
            });
        }

        return $this->success(DishResource::collection($dishes));
    }

    /**
     * Calculate distance between two coordinates using Haversine formula
     */
    private function calculateDistance(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadius = 6371; // in kilometers

        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLng / 2) * sin($dLng / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    public function show($id)
    {
        $dish = $this->dishService->getDishById($id);

        return $this->success(new DishResource($dish));
    }

    public function store(DishRequest $request)
    {
        $dish = new \App\Models\Dish($request->validated());
        $this->authorize('create', $dish);

        $dish = $this->dishService->createDish($request->validated());

        return $this->success(new DishResource($dish), 'Dish created successfully', 201);
    }

    public function update(DishRequest $request, $id)
    {
        $dish = $this->dishService->getDishById($id);
        $this->authorize('update', $dish);

        $dish = $this->dishService->updateDish($id, $request->validated());

        return $this->success(new DishResource($dish), 'Dish updated successfully');
    }

    public function destroy($id)
    {
        $dish = $this->dishService->getDishById($id);
        $this->authorize('delete', $dish);

        $this->dishService->deleteDish($id);

        return $this->success(null, 'Dish deleted');
    }

    /**
     * Get popular tags for filtering
     */
    public function getPopularTags(Request $request)
    {
        $limit = (int) $request->query('limit', 10);
        $tags = $this->dishService->getPopularTags($limit);

        return $this->success($tags);
    }
}
