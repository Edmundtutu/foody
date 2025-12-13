<?php

namespace App\Services\Combos;

use App\Models\Combo;
use App\Models\ComboGroup;
use App\Models\ComboSelection;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class ComboService
{
    public function list(bool $withRelations = true, array $filters = []): Collection
    {
        $query = Combo::query();
        $hasLocationFilter = isset($filters['lat']) && isset($filters['lng']) && isset($filters['radius']);
        $hasSearchFilter = isset($filters['name']) && !empty(trim($filters['name']));

        // Join restaurants if we need location or search filtering
        if ($hasLocationFilter || $hasSearchFilter) {
            $query->join('restaurants', 'combos.restaurant_id', '=', 'restaurants.id');
        }

        // Restaurant filter
        if (isset($filters['restaurant_id'])) {
            $query->where('combos.restaurant_id', $filters['restaurant_id']);
        }

        // Availability filter
        if (isset($filters['available'])) {
            // Convert string 'true'/'false' to boolean
            $available = filter_var($filters['available'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($available !== null) {
                $query->where('combos.available', $available);
            }
        }

        // Enhanced search: search in combo name, restaurant name, and restaurant address
        if ($hasSearchFilter) {
            $searchTerm = '%' . trim($filters['name']) . '%';
            $query->where(function ($q) use ($searchTerm) {
                $q->where('combos.name', 'like', $searchTerm)
                    ->orWhere('combos.description', 'like', $searchTerm)
                    ->orWhere('restaurants.name', 'like', $searchTerm)
                    ->orWhere('restaurants.address', 'like', $searchTerm);
            });
        }

        // Tag-based filtering
        if (isset($filters['tag'])) {
            $query->whereJsonContains('combos.tags', $filters['tag']);
        }

        // Location-based filtering using Haversine formula
        if ($hasLocationFilter) {
            $lat = (float) $filters['lat'];
            $lng = (float) $filters['lng'];
            $radius = (float) $filters['radius']; // in kilometers

            $query->whereNotNull('restaurants.latitude')
                ->whereNotNull('restaurants.longitude')
                ->whereRaw(
                    "(6371 * acos(cos(radians(?)) * cos(radians(restaurants.latitude)) * cos(radians(restaurants.longitude) - radians(?)) + sin(radians(?)) * sin(radians(restaurants.latitude)))) <= ?",
                    [$lat, $lng, $lat, $radius]
                );
        }

        // Sorting
        if (isset($filters['sort'])) {
            switch ($filters['sort']) {
                case 'price_asc':
                    $query->orderBy('combos.base_price', 'asc');
                    break;
                case 'price_desc':
                    $query->orderBy('combos.base_price', 'desc');
                    break;
                case 'popularity':
                    $query->orderBy('combos.order_count', 'desc');
                    break;
                case 'name':
                    $query->orderBy('combos.name', 'asc');
                    break;
                default:
                    $query->orderBy('combos.created_at', 'desc');
            }
        } else {
            $query->orderBy('combos.name');
        }

        // Use distinct to avoid duplicates when joining
        if ($hasLocationFilter || $hasSearchFilter) {
            $query->select('combos.*')->distinct();
        }

        if ($withRelations) {
            $query->with($this->defaultRelations());
        }

        return $query->get();
    }

    public function get(Combo|string $combo, bool $withRelations = true): Combo
    {
        $model = $combo instanceof Combo ? $combo : Combo::findOrFail($combo);

        if ($withRelations) {
            $model->load($this->defaultRelations());
        }

        return $model;
    }

    public function create(array $data): Combo
    {
        return DB::transaction(function () use ($data) {
            $combo = Combo::create($this->extractComboData($data));

            if (!empty($data['groups'])) {
                $this->syncGroups($combo, $data['groups']);
            }

            return $combo->load($this->defaultRelations());
        });
    }

    public function update(Combo $combo, array $data): Combo
    {
        return DB::transaction(function () use ($combo, $data) {
            $combo->update($this->extractComboData($data, true));

            if (array_key_exists('groups', $data)) {
                $this->syncGroups($combo, $data['groups'] ?? []);
            }

            return $combo->fresh()->load($this->defaultRelations());
        });
    }

    public function delete(Combo $combo): void
    {
        DB::transaction(function () use ($combo) {
            $combo->groups->each(function (ComboGroup $group) {
                $this->purgeGroup($group);
            });

            $combo->delete();
        });
    }

    protected function extractComboData(array $data, bool $isUpdate = false): array
    {
        $fields = ['restaurant_id', 'name', 'description', 'pricing_mode', 'base_price', 'available', 'tags', 'images'];
        $payload = Arr::only($data, $fields);

        if (!$isUpdate) {
            $payload['pricing_mode'] = $payload['pricing_mode'] ?? 'FIXED';
            $payload['available'] = $payload['available'] ?? true;
        }

        if (isset($payload['pricing_mode'])) {
            $payload['pricing_mode'] = strtoupper($payload['pricing_mode']);
        }

        return $payload;
    }

    protected function syncGroups(Combo $combo, array $groups): void
    {
        $existingIds = collect($groups)
            ->pluck('id')
            ->filter()
            ->values()
            ->all();

        if (empty($groups)) {
            $combo->groups->each(fn (ComboGroup $group) => $this->purgeGroup($group));
            return;
        }

        if (!empty($existingIds)) {
            $combo->groups
                ->whereNotIn('id', $existingIds)
                ->each(fn (ComboGroup $group) => $this->purgeGroup($group));
        } else {
            $combo->groups->each(fn (ComboGroup $group) => $this->purgeGroup($group));
        }

        foreach ($groups as $groupData) {
            $group = null;

            if (!empty($groupData['id'])) {
                $group = $combo->groups()->where('id', $groupData['id'])->first();
            }

            $attributes = [
                'name' => $groupData['name'],
                'allowed_min' => $groupData['allowed_min'],
                'allowed_max' => $groupData['allowed_max'],
            ];

            if ($group) {
                $group->update($attributes);
            } else {
                $group = $combo->groups()->create($attributes);
            }

            if (array_key_exists('category_hint_ids', $groupData)) {
                $this->syncGroupHints($group, $groupData['category_hint_ids'] ?? []);
            }

            if (array_key_exists('items', $groupData)) {
                $this->syncGroupItems($group, $groupData['items'] ?? []);
            }
        }
    }

    protected function syncGroupItems(ComboGroup $group, array $items): void
    {
        $existingIds = collect($items)->pluck('id')->filter()->values()->all();

        if (empty($items)) {
            $group->items()->delete();
            return;
        }

        if (!empty($existingIds)) {
            $group->items()->whereNotIn('id', $existingIds)->delete();
        } else {
            $group->items()->delete();
        }

        foreach ($items as $itemData) {
            $payload = [
                'dish_id' => $itemData['dish_id'],
                'extra_price' => $itemData['extra_price'] ?? 0,
            ];

            if (!empty($itemData['id'])) {
                $item = $group->items()->where('id', $itemData['id'])->first();
                if ($item) {
                    $item->update($payload);
                    continue;
                }
            }

            $group->items()->create($payload);
        }
    }

    protected function syncGroupHints(ComboGroup $group, array $categoryIds): void
    {
        if (empty($categoryIds)) {
            $group->categoryHints()->detach();
            return;
        }

        $group->categoryHints()->sync($categoryIds);
    }

    protected function purgeGroup(ComboGroup $group): void
    {
        $group->items()->delete();
        $group->categoryHints()->detach();
        $group->delete();
    }

    protected function defaultRelations(): array
    {
        return [
            'groups.categoryHints',
            'groups.items.dish.options',
        ];
    }

    /**
     * Get top picks based on order count and rating
     */
    public function getTopPicks(array $filters = [], int $limit = 10)
    {
        // Get combo IDs with scoring based on orders and ratings
        $subquery = DB::table('combos')
            ->select('combos.id')
            ->leftJoin('order_items', function ($join) {
                $join->on('combos.id', '=', DB::raw("JSON_UNQUOTE(JSON_EXTRACT(order_items.orderable_id, '$'))"))
                    ->where('order_items.orderable_type', '=', ComboSelection::class);
            })
            ->leftJoin('orders', 'order_items.order_id', '=', 'orders.id')
            ->leftJoin('reviews', function ($join) {
                $join->on('combos.id', '=', 'reviews.reviewable_id')
                    ->where('reviews.reviewable_type', '=', 'App\\Models\\Combo');
            })
            ->where('combos.available', true);

        // Apply filters
        if (isset($filters['restaurant_id'])) {
            $subquery->where('combos.restaurant_id', $filters['restaurant_id']);
        }

        if (isset($filters['tag'])) {
            $subquery->whereJsonContains('combos.tags', $filters['tag']);
        }

        $hasSearchFilter = isset($filters['name']) && !empty(trim($filters['name']));
        $hasLocationFilter = isset($filters['lat']) && isset($filters['lng']) && isset($filters['radius']);

        // Join restaurants for location/search filtering
        if ($hasLocationFilter || $hasSearchFilter) {
            $subquery->join('restaurants', 'combos.restaurant_id', '=', 'restaurants.id');
        }

        if ($hasSearchFilter) {
            $searchTerm = '%' . trim($filters['name']) . '%';
            $subquery->where(function ($q) use ($searchTerm) {
                $q->where('combos.name', 'like', $searchTerm)
                    ->orWhere('combos.description', 'like', $searchTerm)
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

        $subquery->groupBy('combos.id')
            ->orderByRaw('(COUNT(DISTINCT orders.id) * 0.6 + COALESCE(AVG(reviews.rating), 0) * 0.4) DESC')
            ->limit($limit);

        $comboIds = $subquery->pluck('id')->toArray();

        if (empty($comboIds)) {
            return collect();
        }

        // Load full combo models in same order
        return Combo::whereIn('id', $comboIds)
            ->with($this->defaultRelations())
            ->get()
            ->sortBy(function ($combo) use ($comboIds) {
                return array_search($combo->id, $comboIds);
            })
            ->values();
    }

    /**
     * Get popular combos based on order count
     */
    public function getPopular(array $filters = [], int $limit = 10)
    {
        $subquery = DB::table('combos')
            ->select('combos.id')
            ->where('combos.available', true)
            ->orderBy('combos.order_count', 'desc');

        // Apply filters
        if (isset($filters['restaurant_id'])) {
            $subquery->where('combos.restaurant_id', $filters['restaurant_id']);
        }

        if (isset($filters['tag'])) {
            $subquery->whereJsonContains('combos.tags', $filters['tag']);
        }

        $hasSearchFilter = isset($filters['name']) && !empty(trim($filters['name']));
        $hasLocationFilter = isset($filters['lat']) && isset($filters['lng']) && isset($filters['radius']);

        // Join restaurants for location/search filtering
        if ($hasLocationFilter || $hasSearchFilter) {
            $subquery->join('restaurants', 'combos.restaurant_id', '=', 'restaurants.id');
        }

        if ($hasSearchFilter) {
            $searchTerm = '%' . trim($filters['name']) . '%';
            $subquery->where(function ($q) use ($searchTerm) {
                $q->where('combos.name', 'like', $searchTerm)
                    ->orWhere('combos.description', 'like', $searchTerm)
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

        $subquery->limit($limit);

        $comboIds = $subquery->pluck('id')->toArray();

        if (empty($comboIds)) {
            return collect();
        }

        return Combo::whereIn('id', $comboIds)
            ->with($this->defaultRelations())
            ->get()
            ->sortBy(function ($combo) use ($comboIds) {
                return array_search($combo->id, $comboIds);
            })
            ->values();
    }

    /**
     * Get recently ordered combos for a user
     */
    public function getRecentlyOrdered(int $userId, array $filters = [], int $limit = 10)
    {
        // Get combo IDs from user's order history via combo_selections
        $subquery = DB::table('combos')
            ->select('combos.id', DB::raw('MAX(orders.created_at) as last_ordered'))
            ->join('combo_selections', 'combos.id', '=', 'combo_selections.combo_id')
            ->join('order_items', function ($join) {
                $join->on('combo_selections.id', '=', 'order_items.orderable_id')
                    ->where('order_items.orderable_type', '=', ComboSelection::class);
            })
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.user_id', $userId)
            ->where('combos.available', true);

        // Apply filters
        if (isset($filters['restaurant_id'])) {
            $subquery->where('combos.restaurant_id', $filters['restaurant_id']);
        }

        if (isset($filters['tag'])) {
            $subquery->whereJsonContains('combos.tags', $filters['tag']);
        }

        $hasSearchFilter = isset($filters['name']) && !empty(trim($filters['name']));

        if ($hasSearchFilter) {
            $subquery->join('restaurants', 'combos.restaurant_id', '=', 'restaurants.id');
            $searchTerm = '%' . trim($filters['name']) . '%';
            $subquery->where(function ($q) use ($searchTerm) {
                $q->where('combos.name', 'like', $searchTerm)
                    ->orWhere('combos.description', 'like', $searchTerm)
                    ->orWhere('restaurants.name', 'like', $searchTerm)
                    ->orWhere('restaurants.address', 'like', $searchTerm);
            });
        }

        $subquery->groupBy('combos.id')
            ->orderBy('last_ordered', 'desc')
            ->limit($limit);

        $comboIds = $subquery->pluck('id')->toArray();

        if (empty($comboIds)) {
            return collect();
        }

        return Combo::whereIn('id', $comboIds)
            ->with($this->defaultRelations())
            ->get()
            ->sortBy(function ($combo) use ($comboIds) {
                return array_search($combo->id, $comboIds);
            })
            ->values();
    }

    /**
     * Get popular tags from combos
     */
    public function getPopularTags(int $limit = 10): array
    {
        $combos = Combo::where('available', true)
            ->whereNotNull('tags')
            ->orderBy('order_count', 'desc')
            ->limit(100)
            ->pluck('tags')
            ->filter()
            ->toArray();

        // Flatten and count tags
        $tagCounts = [];
        foreach ($combos as $tags) {
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

        arsort($tagCounts);
        $popularTags = array_slice(array_keys($tagCounts), 0, $limit, true);

        return array_values($popularTags);
    }
}
