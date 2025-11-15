<?php

namespace Database\Factories;

use App\Models\Restaurant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\MenuCategory>
 */
class MenuCategoryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'restaurant_id' => Restaurant::factory(),
            'name' => fake()->randomElement([
                'Breakfast',
                'Lunch Specials',
                'Traditional Ugandan',
                'Grilled & Barbecue',
                'Vegetarian',
                'Drinks & Beverages',
                'Desserts',
                'Street Food',
            ]),
            'description' => fake()->optional()->sentence(),
            'display_order' => fake()->numberBetween(1, 10),
        ];
    }
}
