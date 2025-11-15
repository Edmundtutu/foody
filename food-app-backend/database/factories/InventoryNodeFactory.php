<?php

namespace Database\Factories;

use App\Models\Restaurant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\InventoryNode>
 */
class InventoryNodeFactory extends Factory
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
            'category_id' => null,
            'entity_type' => fake()->randomElement(['ingredient', 'dish', 'station', 'modification']),
            'entity_id' => fake()->uuid(),
            'display_name' => fake()->words(2, true),
            'x' => fake()->numberBetween(10, 800),
            'y' => fake()->numberBetween(10, 600),
            'color_code' => fake()->hexColor(),
            'available' => fake()->boolean(80),
            'metadata' => [
                'prep_time' => fake()->randomElement(['5 min', '10 min', '15 min', '20 min']),
            ],
        ];
    }

    /**
     * Indicate that the node represents a dish.
     */
    public function dish($dishId, $displayName): static
    {
        return $this->state(fn (array $attributes) => [
            'entity_type' => 'dish',
            'entity_id' => $dishId,
            'display_name' => $displayName,
        ]);
    }

    /**
     * Indicate that the node represents an ingredient.
     */
    public function ingredient($ingredientId, $displayName): static
    {
        return $this->state(fn (array $attributes) => [
            'entity_type' => 'ingredient',
            'entity_id' => $ingredientId,
            'display_name' => $displayName,
        ]);
    }

    /**
     * Indicate that the node represents a station.
     */
    public function station($stationId, $displayName): static
    {
        return $this->state(fn (array $attributes) => [
            'entity_type' => 'station',
            'entity_id' => $stationId,
            'display_name' => $displayName,
        ]);
    }
}
