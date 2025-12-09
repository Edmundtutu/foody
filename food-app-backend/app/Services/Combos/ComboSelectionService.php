<?php

namespace App\Services\Combos;

use App\Models\Combo;
use App\Models\ComboSelection;
use App\Models\ComboSelectionItem;
use Illuminate\Support\Facades\DB;

class ComboSelectionService
{
    public function createFromCalculation(Combo $combo, array $calculation, ?string $userId = null): ComboSelection
    {
        return DB::transaction(function () use ($combo, $calculation, $userId) {
            $selection = ComboSelection::create([
                'combo_id' => $combo->id,
                'user_id' => $userId,
                'total_price' => $calculation['total'],
            ]);

            foreach ($calculation['items'] as $item) {
                ComboSelectionItem::create([
                    'combo_selection_id' => $selection->id,
                    'dish_id' => $item['dish_id'],
                    'options' => [
                        'group_id' => $item['group_id'],
                        'group_name' => $item['group_name'],
                        'option_ids' => $item['option_ids'],
                        'options' => $item['options'],
                        'dish_base_price' => $item['dish_base_price'],
                        'combo_item_extra' => $item['combo_item_extra'],
                    ],
                    'price' => $item['line_total'],
                ]);
            }

            return $selection->load(['items.dish.options']);
        });
    }
}
