<?php

namespace App\Policies;

use App\Models\InventoryNode;
use App\Models\InventoryNodeEdge;
use App\Models\Restaurant;
use App\Models\User;

class KitchenPolicy
{
    /**
     * Determine if the user can view the kitchen graph for a restaurant.
     */
    public function viewGraph(User $user, string $restaurantId): bool
    {
        $restaurant = Restaurant::find($restaurantId);
        
        if (!$restaurant) {
            return false;
        }

        // Check if user owns this restaurant
        return $restaurant->owner_id === $user->id;
    }

    /**
     * Determine if the user can create a node in the kitchen graph.
     */
    public function createNode(User $user, string $restaurantId): bool
    {
        $restaurant = Restaurant::find($restaurantId);
        
        if (!$restaurant) {
            return false;
        }

        return $restaurant->owner_id === $user->id;
    }

    /**
     * Determine if the user can update a node.
     */
    public function updateNode(User $user, InventoryNode $node): bool
    {
        // Check if user owns the restaurant that this node belongs to
        return $node->restaurant && $node->restaurant->owner_id === $user->id;
    }

    /**
     * Determine if the user can delete a node.
     */
    public function deleteNode(User $user, InventoryNode $node): bool
    {
        return $node->restaurant && $node->restaurant->owner_id === $user->id;
    }

    /**
     * Determine if the user can create an edge.
     */
    public function createEdge(User $user, string $restaurantId): bool
    {
        $restaurant = Restaurant::find($restaurantId);
        
        if (!$restaurant) {
            return false;
        }

        return $restaurant->owner_id === $user->id;
    }

    /**
     * Determine if the user can delete an edge.
     */
    public function deleteEdge(User $user, InventoryNodeEdge $edge): bool
    {
        return $edge->restaurant && $edge->restaurant->owner_id === $user->id;
    }
}
