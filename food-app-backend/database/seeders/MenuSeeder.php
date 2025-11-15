<?php

namespace Database\Seeders;

use App\Models\Dish;
use App\Models\DishOption;
use App\Models\MenuCategory;
use App\Models\Restaurant;
use Illuminate\Database\Seeder;

class MenuSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $restaurants = Restaurant::all();

        foreach ($restaurants as $restaurant) {
            // Create 2-3 categories per restaurant
            $categoryCount = rand(2, 3);
            
            for ($i = 1; $i <= $categoryCount; $i++) {
                $category = MenuCategory::factory()->create([
                    'restaurant_id' => $restaurant->id,
                    'display_order' => $i,
                ]);

                // Create 3-5 dishes per category
                $dishCount = rand(3, 5);
                
                for ($j = 0; $j < $dishCount; $j++) {
                    $dish = Dish::factory()->create([
                        'restaurant_id' => $restaurant->id,
                        'category_id' => $category->id,
                    ]);

                    // Create 2-3 dish options per dish
                    DishOption::factory()->count(rand(2, 3))->create([
                        'dish_id' => $dish->id,
                    ]);
                }
            }
        }
    }
}
