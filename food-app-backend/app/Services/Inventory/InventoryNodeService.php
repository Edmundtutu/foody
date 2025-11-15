<?php

namespace App\Services\Inventory;

use App\Models\Dish;
use App\Models\InventoryNode;
use Illuminate\Validation\ValidationException;

class InventoryNodeService
{
    /**
     * Create a new inventory node
     */
    public function createNode(array $data): InventoryNode
    {
        // Validate that dish belongs to restaurant when entity_type is 'dish'
        if (isset($data['entity_type']) && $data['entity_type'] === 'dish' && isset($data['entity_id']) && isset($data['restaurant_id'])) {
            $dish = Dish::find($data['entity_id']);
            
            if (! $dish) {
                throw ValidationException::withMessages([
                    'entity_id' => ['The specified dish does not exist.'],
                ]);
            }

            if ($dish->restaurant_id !== $data['restaurant_id']) {
                throw ValidationException::withMessages([
                    'entity_id' => ['The dish does not belong to the specified restaurant.'],
                ]);
            }
        }

        return InventoryNode::create($data);
    }

    /**
     * Get a single node by ID
     */
    public function getNode(string $nodeId): InventoryNode
    {
        return InventoryNode::with(['category', 'outgoingEdges', 'incomingEdges'])
            ->findOrFail($nodeId);
    }

    /**
     * Toggle node availability
     */
    public function toggleAvailability(string $nodeId): InventoryNode
    {
        $node = InventoryNode::findOrFail($nodeId);
        $node->available = ! $node->available;
        $node->save();

        return $node;
    }

    /**
     * Update node position
     */
    public function updatePosition(string $nodeId, array $coords): InventoryNode
    {
        $node = InventoryNode::findOrFail($nodeId);
        $node->update([
            'x' => $coords['x'] ?? $coords['x_position'] ?? $node->x,
            'y' => $coords['y'] ?? $coords['y_position'] ?? $node->y,
        ]);

        return $node;
    }

    /**
     * Delete a node
     */
    public function deleteNode(string $nodeId): void
    {
        $node = InventoryNode::findOrFail($nodeId);
        $node->delete();
    }
}
