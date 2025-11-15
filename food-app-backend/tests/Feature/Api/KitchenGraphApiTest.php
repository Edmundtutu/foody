<?php

namespace Tests\Feature\Api;

use App\Models\InventoryNode;
use App\Models\InventoryNodeEdge;
use App\Models\MenuCategory;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class KitchenGraphApiTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Restaurant $restaurant;

    private MenuCategory $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->restaurant()->create();
        $this->restaurant = Restaurant::factory()->create(['owner_id' => $this->user->id]);
        $this->category = MenuCategory::factory()->create([
            'restaurant_id' => $this->restaurant->id,
            'color_code' => '#FFA726',
        ]);
    }

    public function test_guest_cannot_access_kitchen_graph(): void
    {
        $response = $this->getJson("/api/v1/kitchen/restaurants/{$this->restaurant->id}/graph");
        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_get_kitchen_graph(): void
    {
        // Create some nodes and edges
        $node1 = InventoryNode::factory()->create([
            'restaurant_id' => $this->restaurant->id,
            'category_id' => $this->category->id,
        ]);
        $node2 = InventoryNode::factory()->create([
            'restaurant_id' => $this->restaurant->id,
            'category_id' => $this->category->id,
        ]);
        $edge = InventoryNodeEdge::factory()->create([
            'restaurant_id' => $this->restaurant->id,
            'source_node_id' => $node1->id,
            'target_node_id' => $node2->id,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/v1/kitchen/restaurants/{$this->restaurant->id}/graph");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'message',
                'data' => [
                    'categories',
                    'nodes',
                    'edges',
                ],
            ])
            ->assertJsonPath('status', 'success');
    }

    public function test_can_get_single_node(): void
    {
        $node = InventoryNode::factory()->create([
            'restaurant_id' => $this->restaurant->id,
            'category_id' => $this->category->id,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/v1/kitchen/nodes/{$node->id}");

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.id', $node->id);
    }

    public function test_can_create_node(): void
    {
        // Create a dish first for the node
        $dish = \App\Models\Dish::factory()->create([
            'restaurant_id' => $this->restaurant->id,
            'category_id' => $this->category->id,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/kitchen/nodes', [
                'restaurant_id' => $this->restaurant->id,
                'category_id' => $this->category->id,
                'entity_type' => 'dish',
                'entity_id' => $dish->id,
                'display_name' => 'Test Dish',
                'x' => 100,
                'y' => 200,
                'available' => true,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.display_name', 'Test Dish')
            ->assertJsonPath('data.available', true);
    }

    public function test_can_create_node_with_x_position_y_position(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/kitchen/nodes', [
                'restaurant_id' => $this->restaurant->id,
                'category_id' => $this->category->id,
                'entity_type' => 'modification',
                'entity_id' => 'test-mod-123',
                'display_name' => 'Add Avocado',
                'x_position' => 300,
                'y_position' => 400,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.x', 300)
            ->assertJsonPath('data.y', 400);
    }

    public function test_create_node_requires_authentication(): void
    {
        $response = $this->postJson('/api/v1/kitchen/nodes', [
            'restaurant_id' => $this->restaurant->id,
            'category_id' => $this->category->id,
            'entity_type' => 'dish',
            'entity_id' => 'test-dish',
        ]);

        $response->assertStatus(401);
    }

    public function test_create_node_validates_required_fields(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/kitchen/nodes', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['restaurant_id', 'category_id', 'entity_type', 'entity_id']);
    }

    public function test_can_toggle_node_availability(): void
    {
        $node = InventoryNode::factory()->create([
            'restaurant_id' => $this->restaurant->id,
            'category_id' => $this->category->id,
            'available' => true,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->patchJson("/api/v1/kitchen/nodes/{$node->id}/toggle");

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.available', false);

        $this->assertFalse($node->fresh()->available);
    }

    public function test_can_move_node(): void
    {
        $node = InventoryNode::factory()->create([
            'restaurant_id' => $this->restaurant->id,
            'category_id' => $this->category->id,
            'x' => 100,
            'y' => 100,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->patchJson("/api/v1/kitchen/nodes/{$node->id}/move", [
                'x' => 500,
                'y' => 600,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.x', 500)
            ->assertJsonPath('data.y', 600);
    }

    public function test_can_move_node_with_position_fields(): void
    {
        $node = InventoryNode::factory()->create([
            'restaurant_id' => $this->restaurant->id,
            'category_id' => $this->category->id,
            'x' => 100,
            'y' => 100,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->patchJson("/api/v1/kitchen/nodes/{$node->id}/move", [
                'x_position' => 700,
                'y_position' => 800,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.x', 700)
            ->assertJsonPath('data.y', 800);
    }

    public function test_can_delete_node(): void
    {
        $node = InventoryNode::factory()->create([
            'restaurant_id' => $this->restaurant->id,
            'category_id' => $this->category->id,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->deleteJson("/api/v1/kitchen/nodes/{$node->id}");

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');

        $this->assertSoftDeleted('inventory_nodes', ['id' => $node->id]);
    }

    public function test_can_create_edge(): void
    {
        $node1 = InventoryNode::factory()->create([
            'restaurant_id' => $this->restaurant->id,
            'category_id' => $this->category->id,
        ]);
        $node2 = InventoryNode::factory()->create([
            'restaurant_id' => $this->restaurant->id,
            'category_id' => $this->category->id,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/kitchen/edges', [
                'restaurant_id' => $this->restaurant->id,
                'source_node_id' => $node1->id,
                'target_node_id' => $node2->id,
                'label' => 'Add-on',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.label', 'Add-on');
    }

    public function test_create_edge_validates_node_existence(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/v1/kitchen/edges', [
                'restaurant_id' => $this->restaurant->id,
                'source_node_id' => 'invalid-node-id',
                'target_node_id' => 'invalid-node-id-2',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['source_node_id', 'target_node_id']);
    }

    public function test_can_delete_edge(): void
    {
        $node1 = InventoryNode::factory()->create([
            'restaurant_id' => $this->restaurant->id,
            'category_id' => $this->category->id,
        ]);
        $node2 = InventoryNode::factory()->create([
            'restaurant_id' => $this->restaurant->id,
            'category_id' => $this->category->id,
        ]);
        $edge = InventoryNodeEdge::factory()->create([
            'restaurant_id' => $this->restaurant->id,
            'source_node_id' => $node1->id,
            'target_node_id' => $node2->id,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->deleteJson("/api/v1/kitchen/edges/{$edge->id}");

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');

        $this->assertDatabaseMissing('inventory_node_edges', ['id' => $edge->id]);
    }

    public function test_guest_cannot_create_node(): void
    {
        $response = $this->postJson('/api/v1/kitchen/nodes', [
            'restaurant_id' => $this->restaurant->id,
            'category_id' => $this->category->id,
            'entity_type' => 'dish',
            'entity_id' => 'test',
        ]);

        $response->assertStatus(401);
    }

    public function test_guest_cannot_modify_node(): void
    {
        $node = InventoryNode::factory()->create([
            'restaurant_id' => $this->restaurant->id,
            'category_id' => $this->category->id,
        ]);

        $response = $this->patchJson("/api/v1/kitchen/nodes/{$node->id}/toggle");
        $response->assertStatus(401);
    }
}
