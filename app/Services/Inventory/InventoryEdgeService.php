<?php

namespace App\Services\Inventory;

use App\Models\InventoryNodeEdge;
use Illuminate\Support\Str;

class InventoryEdgeService
{
    /**
     * Create a new edge connection
     */
    public function createEdge(array $data): InventoryNodeEdge
    {
        if (! isset($data['id'])) {
            $data['id'] = Str::ulid();
        }

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
