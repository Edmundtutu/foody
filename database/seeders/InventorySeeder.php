<?php

namespace Database\Seeders;

use App\Models\Dish;
use App\Models\DishOption;
use App\Models\InventoryNode;
use App\Models\InventoryNodeEdge;
use App\Models\Restaurant;
use Illuminate\Database\Seeder;

class InventorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $restaurants = Restaurant::all();

        foreach ($restaurants as $restaurant) {
            $dishes = Dish::where('restaurant_id', $restaurant->id)->get();
            $nodeMap = [];

            // Create inventory nodes for dishes
            foreach ($dishes as $dish) {
                $dishNode = InventoryNode::factory()->create([
                    'restaurant_id' => $restaurant->id,
                    'entity_type' => 'dish',
                    'entity_id' => $dish->id,
                    'display_name' => $dish->name,
                    'x' => rand(50, 950),
                    'y' => rand(50, 950),
                    'color_code' => '#4CAF50',
                ]);

                $nodeMap['dish_' . $dish->id] = $dishNode->id;

                // Create inventory nodes for dish options (modifications)
                $dishOptions = DishOption::where('dish_id', $dish->id)->get();

                foreach ($dishOptions as $option) {
                    $optionNode = InventoryNode::factory()->create([
                        'restaurant_id' => $restaurant->id,
                        'entity_type' => 'modification',
                        'entity_id' => $option->id,
                        'display_name' => $option->name,
                        'x' => rand(50, 950),
                        'y' => rand(50, 950),
                        'color_code' => '#2196F3',
                    ]);

                    $nodeMap['option_' . $option->id] = $optionNode->id;

                    // Create edge from dish to option
                    InventoryNodeEdge::factory()->create([
                        'restaurant_id' => $restaurant->id,
                        'source_node_id' => $dishNode->id,
                        'target_node_id' => $optionNode->id,
                        'label' => 'has_option',
                    ]);
                }
            }
        }
    }
}
