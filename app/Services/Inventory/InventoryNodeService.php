<?php

namespace App\Services\Inventory;

use App\Models\InventoryNode;
use Illuminate\Support\Str;

class InventoryNodeService
{
    /**
     * Create a new inventory node
     */
    public function createNode(array $data): InventoryNode
    {
        if (! isset($data['id'])) {
            $data['id'] = Str::ulid();
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
