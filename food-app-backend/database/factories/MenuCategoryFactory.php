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
        // Predefined color palette for categories
        $colorPalette = [
            '#3b82f6', // Blue
            '#10b981', // Green
            '#f59e0b', // Amber
            '#ef4444', // Red
            '#8b5cf6', // Purple
            '#ec4899', // Pink
            '#06b6d4', // Cyan
            '#84cc16', // Lime
            '#f97316', // Orange
            '#6366f1', // Indigo
        ];

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
            'color_code' => fake()->randomElement($colorPalette),
        ];
    }
}
