<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Restaurant>
 */
class RestaurantFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $ugandanRestaurants = [
            'The Pearl Restaurant',
            'Kampala Kitchen',
            'Luwombo Palace',
            'Matoke Express',
            'Rolex Corner',
            'Entebbe Grill',
            'Mbarara Eats',
            'Jinja Food Hub',
        ];

        $ugandanLocations = [
            'Kampala Road, Kampala',
            'Entebbe Road, Kampala',
            'Jinja Road, Kampala',
            'Plot 12, Nakasero',
            'Bugoloobi, Kampala',
            'Ntinda Shopping Center',
            'Kololo, Kampala',
            'Garden City, Kampala',
        ];

        return [
            'owner_id' => \App\Models\User::factory()->restaurant(),
            'name' => fake()->randomElement($ugandanRestaurants),
            'description' => fake()->sentence(),
            'phone' => '+256' . fake()->numerify('7########'),
            'email' => fake()->unique()->safeEmail(),
            'address' => fake()->randomElement($ugandanLocations),
            'latitude' => fake()->latitude(0.0, 0.5),
            'longitude' => fake()->longitude(32.4, 32.8),
            'verification_status' => 'verified',
            'config' => null,
        ];
    }

    /**
     * Indicate that the restaurant is pending verification.
     */
    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'verification_status' => 'pending',
        ]);
    }

    /**
     * Indicate that the restaurant is rejected.
     */
    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'verification_status' => 'rejected',
        ]);
    }
}
