<?php

namespace App\Services;

use App\Models\Dish;
use App\Models\OrderItem;
use Illuminate\Support\Facades\DB;

class DishService
{
    public function getAllDishes(array $filters = [])
    {
        $query = Dish::query();
        $hasLocationFilter = isset($filters['lat']) && isset($filters['lng']) && isset($filters['radius']);
        $hasSearchFilter = isset($filters['name']) && !empty(trim($filters['name']));

        // If we have location filter or search filter, we need to join restaurants
        if ($hasLocationFilter || $hasSearchFilter) {
            $query->join('restaurants', 'dishes.restaurant_id', '=', 'restaurants.id');
        }

        if (isset($filters['restaurant_id'])) {
            $query->where('dishes.restaurant_id', $filters['restaurant_id']);
        }

        // Robust category filtering - check if category exists
        if (isset($filters['category_id'])) {
            $categoryId = $filters['category_id'];
            // Verify category exists before filtering
            $categoryExists = DB::table('menu_categories')
                ->where('id', $categoryId)
                ->whereNull('deleted_at')
                ->exists();
            
            if ($categoryExists) {
                $query->where('dishes.category_id', $categoryId);
            } else {
                // If category doesn't exist, return empty result
                return collect();
            }
        }

        if (isset($filters['available'])) {
            $query->where('dishes.available', $filters['available']);
        }

        // Enhanced search: search in dish name, restaurant name, and restaurant address
        if ($hasSearchFilter) {
            $searchTerm = '%' . trim($filters['name']) . '%';
            $query->where(function ($q) use ($searchTerm) {
                $q->where('dishes.name', 'like', $searchTerm)
                  ->orWhere('restaurants.name', 'like', $searchTerm)
                  ->orWhere('restaurants.address', 'like', $searchTerm);
            });
        }

        // Tag-based filtering
        if (isset($filters['tag'])) {
            $query->whereJsonContains('dishes.tags', $filters['tag']);
        }

        // Location-based filtering
        if ($hasLocationFilter) {
            $lat = (float) $filters['lat'];
            $lng = (float) $filters['lng'];
            $radius = (float) $filters['radius']; // in kilometers

            // Haversine formula for distance calculation
            $query->whereNotNull('restaurants.latitude')
                ->whereNotNull('restaurants.longitude')
                ->whereRaw(
                    "(6371 * acos(cos(radians(?)) * cos(radians(restaurants.latitude)) * cos(radians(restaurants.longitude) - radians(?)) + sin(radians(?)) * sin(radians(restaurants.latitude)))) <= ?",
                    [$lat, $lng, $lat, $radius]
                );
        }

        // Use distinct to avoid duplicates when joining
        if ($hasLocationFilter || $hasSearchFilter) {
            $query->select('dishes.*')->distinct();
        }

        return $query->with(['category', 'restaurant', 'options'])->get();
    }

    public function getDishById(string $id)
    {
        return Dish::with(['category', 'restaurant', 'options', 'reviews.user'])
            ->findOrFail($id);
    }

    public function createDish(array $data)
    {
        return Dish::create($data);
    }

    public function updateDish(string $id, array $data)
    {
        $dish = Dish::findOrFail($id);
        $dish->update($data);

        return $dish->fresh();
    }

    public function deleteDish(string $id)
    {
        $dish = Dish::findOrFail($id);

        return $dish->delete();
    }

    /**
     * Get dishes by location within radius
     */
    public function getDishesByLocation(float $lat, float $lng, float $radius = 10, array $additionalFilters = [])
    {
        $filters = array_merge($additionalFilters, [
            'lat' => $lat,
            'lng' => $lng,
            'radius' => $radius,
        ]);

        return $this->getAllDishes($filters);
    }

    /**
     * Get top picks based on order count and rating
     */
    public function getTopPicks(array $filters = [], int $limit = 10)
    {
        // First, get dish IDs with scoring
        $subquery = DB::table('dishes')
            ->select('dishes.id')
            ->leftJoin('order_items', 'dishes.id', '=', 'order_items.dish_id')
            ->leftJoin('orders', 'order_items.order_id', '=', 'orders.id')
            ->leftJoin('reviews', function ($join) {
                $join->on('dishes.id', '=', 'reviews.reviewable_id')
                    ->where('reviews.reviewable_type', '=', 'App\\Models\\Dish');
            })
            ->where('dishes.available', true)
            ->whereNull('dishes.deleted_at');

        // Apply additional filters
        if (isset($filters['restaurant_id'])) {
            $subquery->where('dishes.restaurant_id', $filters['restaurant_id']);
        }

        // Robust category filtering
        if (isset($filters['category_id'])) {
            $categoryId = $filters['category_id'];
            $categoryExists = DB::table('menu_categories')
                ->where('id', $categoryId)
                ->whereNull('deleted_at')
                ->exists();
            
            if ($categoryExists) {
                $subquery->where('dishes.category_id', $categoryId);
            } else {
                return collect();
            }
        }

        if (isset($filters['tag'])) {
            $subquery->whereJsonContains('dishes.tags', $filters['tag']);
        }

        // Enhanced search: search in dish name, restaurant name, and restaurant address
        $hasSearchFilter = isset($filters['name']) && !empty(trim($filters['name']));
        $hasLocationFilter = isset($filters['lat']) && isset($filters['lng']) && isset($filters['radius']);

        // Join restaurants if we need location or search filtering
        if ($hasLocationFilter || $hasSearchFilter) {
            $subquery->join('restaurants', 'dishes.restaurant_id', '=', 'restaurants.id');
        }

        if ($hasSearchFilter) {
            $searchTerm = '%' . trim($filters['name']) . '%';
            $subquery->where(function ($q) use ($searchTerm) {
                $q->where('dishes.name', 'like', $searchTerm)
                  ->orWhere('restaurants.name', 'like', $searchTerm)
                  ->orWhere('restaurants.address', 'like', $searchTerm);
            });
        }

        // Location filtering
        if ($hasLocationFilter) {
            $lat = (float) $filters['lat'];
            $lng = (float) $filters['lng'];
            $radius = (float) $filters['radius'];

            $subquery->whereNotNull('restaurants.latitude')
                ->whereNotNull('restaurants.longitude')
                ->whereRaw(
                    "(6371 * acos(cos(radians(?)) * cos(radians(restaurants.latitude)) * cos(radians(restaurants.longitude) - radians(?)) + sin(radians(?)) * sin(radians(restaurants.latitude)))) <= ?",
                    [$lat, $lng, $lat, $radius]
                );
        }

        $subquery->groupBy('dishes.id')
            ->orderByRaw('(COUNT(DISTINCT orders.id) * 0.6 + COALESCE(AVG(reviews.rating), 0) * 0.4) DESC')
            ->limit($limit);

        $dishIds = $subquery->pluck('id')->toArray();

        if (empty($dishIds)) {
            return collect();
        }

        // Now load the full dish models in the same order
        return Dish::whereIn('id', $dishIds)
            ->with(['category', 'restaurant', 'options'])
            ->get()
            ->sortBy(function ($dish) use ($dishIds) {
                return array_search($dish->id, $dishIds);
            })
            ->values();
    }

    /**
     * Get popular dishes based on recent orders
     */
    public function getPopular(array $filters = [], int $limit = 10)
    {
        // First, get dish IDs ordered by order count
        $subquery = DB::table('dishes')
            ->select('dishes.id')
            ->join('order_items', 'dishes.id', '=', 'order_items.dish_id')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('dishes.available', true)
            ->where('orders.created_at', '>=', now()->subDays(30)) // Last 30 days
            ->whereNull('dishes.deleted_at');

        // Apply additional filters
        if (isset($filters['restaurant_id'])) {
            $subquery->where('dishes.restaurant_id', $filters['restaurant_id']);
        }

        // Robust category filtering
        if (isset($filters['category_id'])) {
            $categoryId = $filters['category_id'];
            $categoryExists = DB::table('menu_categories')
                ->where('id', $categoryId)
                ->whereNull('deleted_at')
                ->exists();
            
            if ($categoryExists) {
                $subquery->where('dishes.category_id', $categoryId);
            } else {
                return collect();
            }
        }

        if (isset($filters['tag'])) {
            $subquery->whereJsonContains('dishes.tags', $filters['tag']);
        }

        // Enhanced search: search in dish name, restaurant name, and restaurant address
        $hasSearchFilter = isset($filters['name']) && !empty(trim($filters['name']));
        $hasLocationFilter = isset($filters['lat']) && isset($filters['lng']) && isset($filters['radius']);

        // Join restaurants if we need location or search filtering
        if ($hasLocationFilter || $hasSearchFilter) {
            $subquery->join('restaurants', 'dishes.restaurant_id', '=', 'restaurants.id');
        }

        if ($hasSearchFilter) {
            $searchTerm = '%' . trim($filters['name']) . '%';
            $subquery->where(function ($q) use ($searchTerm) {
                $q->where('dishes.name', 'like', $searchTerm)
                  ->orWhere('restaurants.name', 'like', $searchTerm)
                  ->orWhere('restaurants.address', 'like', $searchTerm);
            });
        }

        // Location filtering
        if ($hasLocationFilter) {
            $lat = (float) $filters['lat'];
            $lng = (float) $filters['lng'];
            $radius = (float) $filters['radius'];

            $subquery->whereNotNull('restaurants.latitude')
                ->whereNotNull('restaurants.longitude')
                ->whereRaw(
                    "(6371 * acos(cos(radians(?)) * cos(radians(restaurants.latitude)) * cos(radians(restaurants.longitude) - radians(?)) + sin(radians(?)) * sin(radians(restaurants.latitude)))) <= ?",
                    [$lat, $lng, $lat, $radius]
                );
        }

        $subquery->groupBy('dishes.id')
            ->orderByRaw('COUNT(orders.id) DESC')
            ->limit($limit);

        $dishIds = $subquery->pluck('id')->toArray();

        if (empty($dishIds)) {
            return collect();
        }

        // Now load the full dish models in the same order
        return Dish::whereIn('id', $dishIds)
            ->with(['category', 'restaurant', 'options'])
            ->get()
            ->sortBy(function ($dish) use ($dishIds) {
                return array_search($dish->id, $dishIds);
            })
            ->values();
    }

    /**
     * Get recently ordered dishes for a user
     */
    public function getRecentlyOrdered(int $userId, array $filters = [], int $limit = 10)
    {
        // First, get dish IDs ordered by most recent order
        $subquery = DB::table('dishes')
            ->select('dishes.id')
            ->join('order_items', 'dishes.id', '=', 'order_items.dish_id')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.user_id', $userId)
            ->where('dishes.available', true)
            ->whereNull('dishes.deleted_at');

        // Apply additional filters
        if (isset($filters['restaurant_id'])) {
            $subquery->where('dishes.restaurant_id', $filters['restaurant_id']);
        }

        // Robust category filtering
        if (isset($filters['category_id'])) {
            $categoryId = $filters['category_id'];
            $categoryExists = DB::table('menu_categories')
                ->where('id', $categoryId)
                ->whereNull('deleted_at')
                ->exists();
            
            if ($categoryExists) {
                $subquery->where('dishes.category_id', $categoryId);
            } else {
                return collect();
            }
        }

        if (isset($filters['tag'])) {
            $subquery->whereJsonContains('dishes.tags', $filters['tag']);
        }

        // Enhanced search: search in dish name, restaurant name, and restaurant address
        $hasSearchFilter = isset($filters['name']) && !empty(trim($filters['name']));

        if ($hasSearchFilter) {
            $subquery->join('restaurants', 'dishes.restaurant_id', '=', 'restaurants.id');
            $searchTerm = '%' . trim($filters['name']) . '%';
            $subquery->where(function ($q) use ($searchTerm) {
                $q->where('dishes.name', 'like', $searchTerm)
                  ->orWhere('restaurants.name', 'like', $searchTerm)
                  ->orWhere('restaurants.address', 'like', $searchTerm);
            });
        }

        $subquery->groupBy('dishes.id')
            ->orderByRaw('MAX(orders.created_at) DESC')
            ->limit($limit);

        $dishIds = $subquery->pluck('id')->toArray();

        if (empty($dishIds)) {
            return collect();
        }

        // Now load the full dish models in the same order
        return Dish::whereIn('id', $dishIds)
            ->with(['category', 'restaurant', 'options'])
            ->get()
            ->sortBy(function ($dish) use ($dishIds) {
                return array_search($dish->id, $dishIds);
            })
            ->values();
    }

    /**
     * Get popular tags from dishes, ordered by recently created dishes
     */
    public function getPopularTags(int $limit = 10): array
    {
        // Get all dishes with tags, ordered by most recently created
        $dishes = Dish::where('available', true)
            ->whereNotNull('tags')
            ->whereNull('deleted_at')
            ->orderBy('created_at', 'desc')
            ->limit(100) // Get recent dishes to extract tags from
            ->pluck('tags')
            ->filter()
            ->toArray();

        // Flatten and count tags
        $tagCounts = [];
        foreach ($dishes as $tags) {
            if (is_string($tags)) {
                $tags = json_decode($tags, true);
            }
            if (is_array($tags)) {
                foreach ($tags as $tag) {
                    if (!empty($tag)) {
                        $tagCounts[$tag] = ($tagCounts[$tag] ?? 0) + 1;
                    }
                }
            }
        }

        // Sort by count (most popular first), then take top N
        arsort($tagCounts);
        $popularTags = array_slice(array_keys($tagCounts), 0, $limit, true);

        return array_values($popularTags);
    }
}
