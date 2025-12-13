<?php

namespace App\Http\Controllers\Api\Combos;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreComboRequest;
use App\Http\Requests\UpdateComboRequest;
use App\Http\Resources\ComboResource;
use App\Models\Combo;
use App\Services\Combos\ComboService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;

class ComboController extends Controller
{
    use ApiResponseTrait;

    public function __construct(private readonly ComboService $comboService)
    {
        //
    }

    public function index(Request $request)
    {
        $withRelations = $request->boolean('include_relations', true);
        
        $filters = $request->only([
            'restaurant_id',
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
            $combos = $this->comboService->getTopPicks($filters);
        } elseif ($type === 'popular') {
            $combos = $this->comboService->getPopular($filters);
        } elseif ($type === 'recently_ordered' && $request->user()) {
            $combos = $this->comboService->getRecentlyOrdered($request->user()->id, $filters);
        } else {
            $combos = $this->comboService->list($withRelations, $filters);
        }

        // Calculate distance and delivery time if location provided
        $lat = $request->query('lat');
        $lng = $request->query('lng');
        
        if ($lat && $lng) {
            $combos = $combos->map(function ($combo) use ($lat, $lng) {
                if ($combo->restaurant && $combo->restaurant->latitude && $combo->restaurant->longitude) {
                    // Calculate distance in km
                    $distance = $this->calculateDistance(
                        (float) $lat,
                        (float) $lng,
                        (float) $combo->restaurant->latitude,
                        (float) $combo->restaurant->longitude
                    );
                    $combo->distance = round($distance, 2);
                    
                    // Estimate delivery time (rough estimate: 5 min base + 2 min per km)
                    $combo->delivery_time = max(15, round(5 + ($distance * 2)));
                }
                return $combo;
            });
        }

        return $this->success(ComboResource::collection($combos));
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

    public function getRestaurantCombos(string $id, Request $request)
    {
        $withRelations = $request->boolean('include_relations', true);
        $filters = ['restaurant_id' => $id];
        
        $combos = $this->comboService->list($withRelations, $filters);

        return $this->success(ComboResource::collection($combos));
    }

    public function store(StoreComboRequest $request)
    {
        $this->authorize('create', Combo::class);
        
        $combo = $this->comboService->create($request->validated());

        return $this->success(new ComboResource($combo), 'Combo created successfully', 201);
    }

    public function show(Combo $combo)
    {
        $combo = $this->comboService->get($combo, true);

        return $this->success(new ComboResource($combo));
    }

    public function update(UpdateComboRequest $request, Combo $combo)
    {
        $this->authorize('update', $combo);
        
        $combo = $this->comboService->update($combo, $request->validated());

        return $this->success(new ComboResource($combo), 'Combo updated successfully');
    }

    public function destroy(Combo $combo)
    {
        $this->authorize('delete', $combo);
        
        $this->comboService->delete($combo);

        return $this->success(null, 'Combo deleted successfully');
    }

    /**
     * Get popular tags for filtering
     */
    public function getPopularTags(Request $request)
    {
        $limit = (int) $request->query('limit', 10);
        $tags = $this->comboService->getPopularTags($limit);

        return $this->success($tags);
    }
}
