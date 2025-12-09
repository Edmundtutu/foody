<?php

namespace App\Services\Combos;

use App\Models\Combo;
use App\Models\ComboGroup;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class ComboService
{
    public function list(bool $withRelations = true): Collection
    {
        $query = Combo::query()->orderBy('name');

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
        $fields = ['restaurant_id', 'name', 'description', 'pricing_mode', 'base_price', 'available'];
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
}
