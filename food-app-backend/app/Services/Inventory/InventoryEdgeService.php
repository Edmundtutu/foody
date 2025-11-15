<?php

namespace App\Services\Inventory;

use App\Models\InventoryNodeEdge;

class InventoryEdgeService
{
    /**
     * Create a new edge connection
     */
    public function createEdge(array $data): InventoryNodeEdge
    {
        return InventoryNodeEdge::create($data);
    }

    /**
     * Delete an edge
     */
    public function deleteEdge(string $edgeId): void
    {
        $edge = InventoryNodeEdge::findOrFail($edgeId);
        $edge->delete();
    }
}
