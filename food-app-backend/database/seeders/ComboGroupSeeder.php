<?php

namespace Database\Seeders;

use App\Models\Combo;
use App\Models\ComboGroup;
use App\Models\MenuCategory;
use Illuminate\Database\Seeder;

class ComboGroupSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (!Combo::exists()) {
            $this->call(ComboSeeder::class);
        }

        $categories = MenuCategory::pluck('id');
        if ($categories->isEmpty()) {
            return;
        }

        Combo::withCount('groups')->get()->each(function (Combo $combo) use ($categories) {
            $existing = $combo->groups_count;
            $target = max(2, $existing);
            if ($existing >= $target) {
                return;
            }

            $toCreate = max(fake()->numberBetween(2, 3) - $existing, 0);
            if ($toCreate === 0) {
                return;
            }

            ComboGroup::factory()
                ->count($toCreate)
                ->create(['combo_id' => $combo->id])
                ->each(function (ComboGroup $group) use ($categories) {
                    $hintCount = min($categories->count(), fake()->numberBetween(1, 2));
                    $hintIds = $categories->shuffle()->take($hintCount)->all();

                    if (!empty($hintIds)) {
                        $group->categoryHints()->sync($hintIds);
                    }
                });
        });
    }
}
