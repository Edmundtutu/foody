<?php

namespace Database\Factories;

use App\Models\InventoryNode;
use App\Models\Restaurant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\InventoryNodeEdge>
 */
class InventoryNodeEdgeFactory extends Factory
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
            'source_node_id' => InventoryNode::factory(),
            'target_node_id' => InventoryNode::factory(),
            'label' => fake()->optional()->randomElement(['has_option', 'requires', 'includes']),
            'metadata' => json_encode([
                'weight' => fake()->optional()->numberBetween(1, 10),
            ]),
        ];
    }
}
