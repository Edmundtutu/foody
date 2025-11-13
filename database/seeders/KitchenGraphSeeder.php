<?php

namespace Database\Seeders;

use App\Models\Dish;
use App\Models\InventoryNode;
use App\Models\InventoryNodeEdge;
use App\Models\MenuCategory;
use App\Models\Restaurant;
use Illuminate\Database\Seeder;

class KitchenGraphSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get or create a restaurant
        $restaurant = Restaurant::first();

        if (! $restaurant) {
            $this->command->info('No restaurants found. Please seed restaurants first.');

            return;
        }

        // Create menu categories with color codes
        $categories = [
            ['name' => 'Main Dishes', 'color_code' => '#FFA726', 'display_order' => 1],
            ['name' => 'Sides', 'color_code' => '#66BB6A', 'display_order' => 2],
            ['name' => 'Modifications', 'color_code' => '#42A5F5', 'display_order' => 3],
        ];

        $createdCategories = [];
        foreach ($categories as $categoryData) {
            $category = MenuCategory::firstOrCreate(
                [
                    'restaurant_id' => $restaurant->id,
                    'name' => $categoryData['name'],
                ],
                [
                    'color_code' => $categoryData['color_code'],
                    'display_order' => $categoryData['display_order'],
                    'description' => 'Category for '.$categoryData['name'],
                ]
            );
            $createdCategories[$categoryData['name']] = $category;
        }

        // Create inventory nodes
        $nodes = [];

        // Main dish nodes
        $mainDishNodes = [
            ['display_name' => 'Luwombo', 'x' => 100, 'y' => 100],
            ['display_name' => 'Matoke', 'x' => 300, 'y' => 100],
            ['display_name' => 'Posho', 'x' => 500, 'y' => 100],
        ];

        foreach ($mainDishNodes as $nodeData) {
            $nodes[] = InventoryNode::create([
                'restaurant_id' => $restaurant->id,
                'category_id' => $createdCategories['Main Dishes']->id,
                'entity_type' => 'dish',
                'entity_id' => 'dish_'.strtolower($nodeData['display_name']),
                'display_name' => $nodeData['display_name'],
                'x' => $nodeData['x'],
                'y' => $nodeData['y'],
                'available' => true,
                'metadata' => json_encode(['prep_time' => '15 min']),
            ]);
        }

        // Side nodes
        $sideNodes = [
            ['display_name' => 'Beans', 'x' => 200, 'y' => 300],
            ['display_name' => 'Rice', 'x' => 400, 'y' => 300],
        ];

        foreach ($sideNodes as $nodeData) {
            $nodes[] = InventoryNode::create([
                'restaurant_id' => $restaurant->id,
                'category_id' => $createdCategories['Sides']->id,
                'entity_type' => 'dish',
                'entity_id' => 'side_'.strtolower($nodeData['display_name']),
                'display_name' => $nodeData['display_name'],
                'x' => $nodeData['x'],
                'y' => $nodeData['y'],
                'available' => true,
                'metadata' => json_encode(['prep_time' => '10 min']),
            ]);
        }

        // Modification nodes
        $modNodes = [
            ['display_name' => 'Add Avocado', 'x' => 150, 'y' => 500],
            ['display_name' => 'Extra Spicy', 'x' => 350, 'y' => 500],
            ['display_name' => 'No Salt', 'x' => 550, 'y' => 500],
        ];

        foreach ($modNodes as $nodeData) {
            $nodes[] = InventoryNode::create([
                'restaurant_id' => $restaurant->id,
                'category_id' => $createdCategories['Modifications']->id,
                'entity_type' => 'modification',
                'entity_id' => 'mod_'.strtolower(str_replace(' ', '_', $nodeData['display_name'])),
                'display_name' => $nodeData['display_name'],
                'x' => $nodeData['x'],
                'y' => $nodeData['y'],
                'available' => true,
                'metadata' => json_encode(['price_modifier' => 0]),
            ]);
        }

        // Create edges (connections)
        if (count($nodes) >= 4) {
            // Connect Luwombo to Add Avocado
            InventoryNodeEdge::create([
                'restaurant_id' => $restaurant->id,
                'source_node_id' => $nodes[0]->id,
                'target_node_id' => $nodes[5]->id ?? $nodes[0]->id,
                'label' => 'Add-on',
            ]);

            // Connect Matoke to Beans
            if (count($nodes) >= 5) {
                InventoryNodeEdge::create([
                    'restaurant_id' => $restaurant->id,
                    'source_node_id' => $nodes[1]->id,
                    'target_node_id' => $nodes[3]->id,
                    'label' => 'Served with',
                ]);
            }
        }

        $this->command->info('Kitchen graph seeded successfully for restaurant: '.$restaurant->name);
    }
}
