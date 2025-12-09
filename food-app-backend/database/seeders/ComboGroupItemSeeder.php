<?php

namespace Database\Seeders;

use App\Models\ComboGroup;
use App\Models\ComboGroupItem;
use App\Models\Dish;
use Illuminate\Database\Seeder;

class ComboGroupItemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (!ComboGroup::exists()) {
            $this->call(ComboGroupSeeder::class);
        }

        ComboGroup::with(['categoryHints', 'items'])->get()->each(function (ComboGroup $group) {
            $existing = $group->items->count();
            $target = max($group->allowed_max + 1, 3);
            $needed = $target - $existing;

            if ($needed <= 0) {
                return;
            }

            $categoryIds = $group->categoryHints->pluck('id');
            $dishQuery = Dish::query();

            if ($categoryIds->isNotEmpty()) {
                $dishQuery->whereIn('category_id', $categoryIds);
            }

            $dishes = $dishQuery->inRandomOrder()->limit($needed)->get();

            if ($dishes->isEmpty()) {
                $dishes = Dish::inRandomOrder()->limit($needed)->get();
            }

            foreach ($dishes as $dish) {
                ComboGroupItem::factory()->create([
                    'combo_group_id' => $group->id,
                    'dish_id' => $dish->id,
                ]);
            }
        });
    }
}
