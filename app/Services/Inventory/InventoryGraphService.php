<?php

namespace App\Services\Inventory;

use App\Models\InventoryNode;
use App\Models\InventoryNodeEdge;
use App\Models\MenuCategory;
use App\Models\Restaurant;

class InventoryGraphService
{
    /**
     * Get the complete kitchen graph for a restaurant
     */
    public function getGraphForRestaurant(string $restaurantId): array
    {
        $categories = MenuCategory::where('restaurant_id', $restaurantId)
            ->orderBy('display_order')
            ->get();

        $nodes = InventoryNode::where('restaurant_id', $restaurantId)
            ->with('category')
            ->get();

        $edges = InventoryNodeEdge::where('restaurant_id', $restaurantId)
            ->get();

        return [
            'categories' => $categories,
            'nodes' => $nodes,
            'edges' => $edges,
        ];
    }
}
