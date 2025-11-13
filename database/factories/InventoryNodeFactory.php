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
            'entity_type' => fake()->randomElement(['dish', 'modification']),
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
     * Indicate that the node represents a modification.
     */
    public function modification($modificationId, $displayName): static
    {
        return $this->state(fn (array $attributes) => [
            'entity_type' => 'modification',
            'entity_id' => $modificationId,
            'display_name' => $displayName,
        ]);
    }
}
