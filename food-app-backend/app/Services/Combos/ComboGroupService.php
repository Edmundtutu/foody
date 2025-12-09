<?php

namespace App\Services\Combos;

use App\Models\Combo;
use App\Models\ComboGroup;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class ComboGroupService
{
    public function list(Combo $combo): Collection
    {
        return $combo->groups()
            ->with(['categoryHints', 'items.dish.options'])
            ->orderBy('name')
            ->get();
    }

    public function create(Combo $combo, array $data): ComboGroup
    {
        return DB::transaction(function () use ($combo, $data) {
            $group = $combo->groups()->create($this->extractGroupData($data));
            $this->syncHints($group, $data['category_hint_ids'] ?? []);

            return $group->load(['categoryHints', 'items.dish.options']);
        });
    }

    public function update(ComboGroup $group, array $data): ComboGroup
    {
        return DB::transaction(function () use ($group, $data) {
            $attributes = $this->extractGroupData($data, true);
            if (!empty($attributes)) {
                $group->update($attributes);
            }

            if (array_key_exists('category_hint_ids', $data)) {
                $this->syncHints($group, $data['category_hint_ids'] ?? []);
            }

            return $group->fresh()->load(['categoryHints', 'items.dish.options']);
        });
    }

    public function delete(ComboGroup $group): void
    {
        DB::transaction(function () use ($group) {
            $group->items()->delete();
            $group->categoryHints()->detach();
            $group->delete();
        });
    }

    protected function extractGroupData(array $data, bool $isUpdate = false): array
    {
        $fields = Arr::only($data, ['name', 'allowed_min', 'allowed_max']);

        if ($isUpdate) {
            return array_filter($fields, function ($value) {
                return $value !== null;
            });
        }

        return $fields;
    }

    protected function syncHints(ComboGroup $group, array $categoryIds): void
    {
        if (empty($categoryIds)) {
            $group->categoryHints()->detach();
            return;
        }

        $group->categoryHints()->sync($categoryIds);
    }
}
