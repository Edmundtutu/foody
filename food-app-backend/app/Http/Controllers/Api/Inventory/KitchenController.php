<?php

namespace App\Http\Controllers\Api\Inventory;

use App\Http\Controllers\Controller;
use App\Http\Resources\InventoryNodeEdgeResource;
use App\Http\Resources\InventoryNodeResource;
use App\Models\InventoryNode;
use App\Models\InventoryNodeEdge;
use App\Services\Inventory\InventoryEdgeService;
use App\Services\Inventory\InventoryGraphService;
use App\Services\Inventory\InventoryNodeService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;

class KitchenController extends Controller
{
    use ApiResponseTrait;

    public function __construct(
        private InventoryGraphService $graphService,
        private InventoryNodeService $nodeService,
        private InventoryEdgeService $edgeService
    ) {}

    /**
     * Get the complete kitchen graph for a restaurant
     */
    public function graph(string $restaurantId)
    {
        $this->authorize('viewGraph', [InventoryNode::class, $restaurantId]);

        $graph = $this->graphService->getGraphForRestaurant($restaurantId);

        return $this->success([
            'categories' => $graph['categories'],
            'nodes' => InventoryNodeResource::collection($graph['nodes']),
            'edges' => InventoryNodeEdgeResource::collection($graph['edges']),
        ], 'Kitchen graph loaded successfully');
    }

    /**
     * Get a single node by ID
     */
    public function showNode(string $nodeId)
    {
        $node = $this->nodeService->getNode($nodeId);
        
        $this->authorize('updateNode', $node);

        return $this->success(new InventoryNodeResource($node), 'Node retrieved successfully');
    }

    /**
     * Create a new inventory node
     */
    public function createNode(Request $request)
    {
        $validated = $request->validate([
            'restaurant_id' => 'required|exists:restaurants,id',
            'category_id' => 'required|exists:menu_categories,id',
            'entity_type' => 'required|in:dish,modification,category',
            'entity_id' => 'required|string',
            'display_name' => 'nullable|string',
            'x' => 'nullable|integer',
            'y' => 'nullable|integer',
            'x_position' => 'nullable',//|integer',
            'y_position' => 'nullable',//|integer',
            'color_code' => 'nullable|string|max:10',
            'available' => 'nullable|boolean',
            'metadata' => 'nullable|array',
        ]);

        $this->authorize('createNode', [InventoryNode::class, $validated['restaurant_id']]);

        // Support both x/y and x_position/y_position naming conventions
        if (isset($validated['x_position'])) {
            $validated['x'] = $validated['x_position'];
            unset($validated['x_position']);
        }
        if (isset($validated['y_position'])) {
            $validated['y'] = $validated['y_position'];
            unset($validated['y_position']);
        }

        $node = $this->nodeService->createNode($validated);

        return $this->success(new InventoryNodeResource($node), 'Node created successfully', 201);
    }

    /**
     * Toggle node availability
     */
    public function toggleNode(string $nodeId)
    {
        $node = InventoryNode::findOrFail($nodeId);
        
        $this->authorize('updateNode', $node);
        
        $node = $this->nodeService->toggleAvailability($nodeId);

        return $this->success(new InventoryNodeResource($node), 'Node availability updated');
    }

    /**
     * Update node position
     */
    public function moveNode(Request $request, string $nodeId)
    {
        $validated = $request->validate([
            'x' => 'nullable|integer',
            'y' => 'nullable|integer',
            'x_position' => 'nullable',//|integer',
            'y_position' => 'nullable',//|integer',
        ]);

        $node = InventoryNode::findOrFail($nodeId);
        
        $this->authorize('updateNode', $node);

        $node = $this->nodeService->updatePosition($nodeId, $validated);

        return $this->success(new InventoryNodeResource($node), 'Node position updated');
    }

    /**
     * Delete a node
     */
    public function deleteNode(string $nodeId)
    {
        $node = InventoryNode::findOrFail($nodeId);
        
        $this->authorize('deleteNode', $node);
        
        $this->nodeService->deleteNode($nodeId);

        return $this->success(null, 'Node deleted successfully');
    }

    /**
     * Create an edge connection
     */
    public function createEdge(Request $request)
    {
        $validated = $request->validate([
            'restaurant_id' => 'required|exists:restaurants,id',
            'source_node_id' => 'required|exists:inventory_nodes,id',
            'target_node_id' => 'required|exists:inventory_nodes,id',
            'label' => 'nullable|string|max:255',
            'metadata' => 'nullable|array',
        ]);

        $this->authorize('createEdge', [InventoryNodeEdge::class, $validated['restaurant_id']]);

        $edge = $this->edgeService->createEdge($validated);

        return $this->success(new InventoryNodeEdgeResource($edge), 'Edge created successfully', 201);
    }

    /**
     * Delete an edge
     */
    public function deleteEdge(string $edgeId)
    {
        $edge = InventoryNodeEdge::findOrFail($edgeId);
        
        $this->authorize('deleteEdge', $edge);
        
        $this->edgeService->deleteEdge($edgeId);

        return $this->success(null, 'Edge deleted successfully');
    }
}
