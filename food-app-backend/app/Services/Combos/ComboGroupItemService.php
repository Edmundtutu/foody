<?php

namespace App\Services\Combos;

use App\Models\ComboGroup;
use App\Models\ComboGroupItem;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class ComboGroupItemService
{
    public function list(ComboGroup $group): Collection
    {
        return $group->items()
            ->with(['dish.options'])
            ->orderBy('created_at')
            ->get();
    }

    public function create(ComboGroup $group, array $data): ComboGroupItem
    {
        return DB::transaction(function () use ($group, $data) {
            $item = $group->items()->create($this->extractItemData($data));

            return $item->load(['dish.options']);
        });
    }

    public function update(ComboGroupItem $item, array $data): ComboGroupItem
    {
        return DB::transaction(function () use ($item, $data) {
            $attributes = $this->extractItemData($data, true);

            if (!empty($attributes)) {
                $item->update($attributes);
            }

            return $item->fresh()->load(['dish.options']);
        });
    }

    public function delete(ComboGroupItem $item): void
    {
        $item->delete();
    }

    protected function extractItemData(array $data, bool $isUpdate = false): array
    {
        $fields = Arr::only($data, ['dish_id', 'extra_price']);

        if ($isUpdate) {
            return array_filter($fields, function ($value) {
                return $value !== null;
            });
        }

        $fields['extra_price'] = $fields['extra_price'] ?? 0;

        return $fields;
    }
}
