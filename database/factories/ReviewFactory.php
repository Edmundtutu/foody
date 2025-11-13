<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Review>
 */
class ReviewFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'reviewable_type' => fake()->randomElement([
                'App\Models\Dish',
                'App\Models\Restaurant',
            ]),
            'reviewable_id' => null, // Will be set when creating reviews
            'rating' => fake()->numberBetween(1, 5),
            'comment' => fake()->optional()->sentence(),
        ];
    }

    /**
     * Indicate that the review is for a dish.
     */
    public function forDish($dishId): static
    {
        return $this->state(fn (array $attributes) => [
            'reviewable_type' => 'App\Models\Dish',
            'reviewable_id' => $dishId,
        ]);
    }

    /**
     * Indicate that the review is for a restaurant.
     */
    public function forRestaurant($restaurantId): static
    {
        return $this->state(fn (array $attributes) => [
            'reviewable_type' => 'App\Models\Restaurant',
            'reviewable_id' => $restaurantId,
        ]);
    }
}
