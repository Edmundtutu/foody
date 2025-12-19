<?php

namespace Database\Factories;

use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Follow>
 */
class FollowFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'follower_id' => User::factory(),
            'followable_type' => User::class,
            'followable_id' => null, // Will be set in seeder
        ];
    }

    /**
     * Indicate that this is a follow for a user.
     */
    public function followUser($userId): static
    {
        return $this->state(fn (array $attributes) => [
            'followable_type' => User::class,
            'followable_id' => $userId,
        ]);
    }

    /**
     * Indicate that this is a follow for a restaurant.
     */
    public function followRestaurant($restaurantId): static
    {
        return $this->state(fn (array $attributes) => [
            'followable_type' => Restaurant::class,
            'followable_id' => $restaurantId,
        ]);
    }
}
