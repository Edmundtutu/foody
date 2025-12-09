<?php

namespace App\Services\Combos;

use App\Models\Combo;
use App\Models\ComboGroup;
use App\Models\ComboGroupItem;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class ComboPricingService
{
    public function calculate(Combo $combo, array $payload): array
    {
        $combo->loadMissing(['groups.items.dish.options']);

        $selections = collect($payload['groups'] ?? []);
        $lineItems = [];
        $breakdown = [
            'combo_base' => 0,
            'dish_base' => 0,
            'dish_surcharges' => 0,
            'options_surcharges' => 0,
        ];

        $groupsMap = $combo->groups->keyBy('id');
        $selectedGroupIds = $selections->pluck('group_id')->filter()->values()->all();

        $selections->each(function (array $groupSelection) use (
            $combo,
            $groupsMap,
            &$lineItems,
            &$breakdown
        ) {
            $group = $this->resolveGroup($groupsMap, $groupSelection['group_id'] ?? null);
            $selectedItems = collect($groupSelection['selected'] ?? []);

            $this->assertSelectionCount($group, $selectedItems->count());

            $selectedItems->each(function (array $itemSelection) use ($combo, $group, &$lineItems, &$breakdown) {
                $groupItem = $this->resolveGroupItem($group, $itemSelection['dish_id'] ?? null);
                $dish = $groupItem->dish;

                $optionIds = collect($itemSelection['option_ids'] ?? [])->filter()->values();
                $options = [];
                $optionsTotal = 0;

                if ($optionIds->isNotEmpty()) {
                    $options = $optionIds->map(function ($optionId) use ($dish, &$optionsTotal) {
                        $option = $dish->options->firstWhere('id', $optionId);
                        if (!$option) {
                            throw ValidationException::withMessages([
                                'groups' => [__('Selected option is not available for the chosen dish.')],
                            ]);
                        }

                        $optionsTotal += (int) $option->extra_cost;

                        return [
                            'id' => $option->id,
                            'name' => $option->name,
                            'extra_cost' => (int) $option->extra_cost,
                        ];
                    })->all();
                }

                $dishPrice = (int) $dish->price;
                $extra = $combo->pricing_mode === 'HYBRID' ? (int) $groupItem->extra_price : 0;
                $lineTotal = $this->lineTotalForMode($combo->pricing_mode, $dishPrice, $extra, $optionsTotal);

                $breakdown['dish_base'] += $dishPrice;
                $breakdown['options_surcharges'] += $optionsTotal;
                $breakdown['dish_surcharges'] += (int) $groupItem->extra_price;

                $lineItems[] = [
                    'group_id' => $group->id,
                    'group_name' => $group->name,
                    'dish_id' => $dish->id,
                    'dish_name' => $dish->name,
                    'dish_base_price' => $dishPrice,
                    'combo_item_extra' => (int) $groupItem->extra_price,
                    'applied_extra' => $extra,
                    'option_ids' => $optionIds->all(),
                    'options' => $options,
                    'options_total' => $optionsTotal,
                    'line_total' => $lineTotal,
                ];
            });
        });

        $this->assertRequiredGroupsSelected($combo, $selectedGroupIds);

        if (in_array($combo->pricing_mode, ['FIXED', 'HYBRID'], true)) {
            $breakdown['combo_base'] = (int) $combo->base_price;
        }

        $total = $this->resolveTotal($combo, $breakdown);

        return [
            'combo_id' => $combo->id,
            'pricing_mode' => $combo->pricing_mode,
            'total' => $total,
            'breakdown' => $breakdown,
            'items' => $lineItems,
        ];
    }

    protected function resolveGroup(Collection $groupsMap, ?string $groupId): ComboGroup
    {
        $group = $groupId ? $groupsMap->get($groupId) : null;

        if (!$group) {
            throw ValidationException::withMessages([
                'groups' => [__('Selected group is not part of this combo.')],
            ]);
        }

        return $group;
    }

    protected function resolveGroupItem(ComboGroup $group, ?string $dishId): ComboGroupItem
    {
        $item = $dishId ? $group->items->firstWhere('dish_id', $dishId) : null;

        if (!$item) {
            throw ValidationException::withMessages([
                'groups' => [__('Dish is not allowed inside this combo group.')],
            ]);
        }

        return $item;
    }

    protected function assertSelectionCount(ComboGroup $group, int $count): void
    {
        if ($count < $group->allowed_min || $count > $group->allowed_max) {
            throw ValidationException::withMessages([
                'groups' => [__(
                    'You must select between :min and :max item(s) in :group.',
                    [
                        'min' => $group->allowed_min,
                        'max' => $group->allowed_max,
                        'group' => $group->name,
                    ]
                )],
            ]);
        }
    }

    protected function assertRequiredGroupsSelected(Combo $combo, array $selectedGroupIds): void
    {
        foreach ($combo->groups as $group) {
            if ($group->allowed_min > 0 && !in_array($group->id, $selectedGroupIds, true)) {
                throw ValidationException::withMessages([
                    'groups' => [__(
                        'Group :group requires at least :min item(s).',
                        [
                            'group' => $group->name,
                            'min' => $group->allowed_min,
                        ]
                    )],
                ]);
            }
        }
    }

    protected function resolveTotal(Combo $combo, array $breakdown): int
    {
        return match ($combo->pricing_mode) {
            'FIXED' => (int) $combo->base_price + $breakdown['options_surcharges'],
            'HYBRID' => (int) $combo->base_price + $breakdown['dish_surcharges'] + $breakdown['options_surcharges'],
            default => $breakdown['dish_base'] + $breakdown['options_surcharges'],
        };
    }

    protected function lineTotalForMode(string $mode, int $dishPrice, int $extra, int $optionsTotal): int
    {
        return match ($mode) {
            'FIXED' => $optionsTotal,
            'HYBRID' => $extra + $optionsTotal,
            default => $dishPrice + $optionsTotal,
        };
    }
}
