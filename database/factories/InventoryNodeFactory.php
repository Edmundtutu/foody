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
            'entity_type' => fake()->randomElement(['ingredient', 'dish', 'station']),
            'entity_id' => null, // Will be set when creating nodes
            'display_name' => fake()->words(2, true),
            'x' => fake()->numberBetween(0, 1000),
            'y' => fake()->numberBetween(0, 1000),
            'color_code' => fake()->hexColor(),
            'metadata' => json_encode([
                'description' => fake()->optional()->sentence(),
            ]),
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
