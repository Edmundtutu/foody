<?php

namespace Database\Seeders;

use App\Models\Dish;
use App\Models\Restaurant;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Seeder;

class ReviewSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $customers = User::where('role', 'customer')->get();
        $restaurants = Restaurant::all();
        $dishes = Dish::all();

        // Create reviews for restaurants
        foreach ($restaurants as $restaurant) {
            $reviewCount = rand(1, 3);
            
            for ($i = 0; $i < $reviewCount; $i++) {
                Review::factory()->create([
                    'user_id' => $customers->random()->id,
                    'reviewable_type' => 'App\Models\Restaurant',
                    'reviewable_id' => $restaurant->id,
                ]);
            }
        }

        // Create reviews for some dishes
        $dishesToReview = $dishes->random(min(10, $dishes->count()));
        
        foreach ($dishesToReview as $dish) {
            $reviewCount = rand(1, 2);
            
            for ($i = 0; $i < $reviewCount; $i++) {
                Review::factory()->create([
                    'user_id' => $customers->random()->id,
                    'reviewable_type' => 'App\Models\Dish',
                    'reviewable_id' => $dish->id,
                ]);
            }
        }
    }
}
