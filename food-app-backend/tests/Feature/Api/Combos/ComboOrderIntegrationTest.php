<?php

namespace Tests\Feature\Api\Combos;

use App\Models\Combo;
use App\Models\ComboGroup;
use App\Models\ComboGroupItem;
use App\Models\ComboSelection;
use App\Models\Dish;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ComboOrderIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected User $customer;
    protected Restaurant $restaurant;
    protected Combo $combo;
    protected ComboSelection $selection;

    protected function setUp(): void
    {
        parent::setUp();

        $this->customer = User::factory()->create(['role' => 'customer']);
        
        $manager = User::factory()->restaurant()->create();
        $this->restaurant = Restaurant::factory()->create([
            'owner_id' => $manager->id,
            'verification_status' => 'verified',
        ]);
        
        // Create combo with group and items
        $this->combo = Combo::factory()->create([
            'restaurant_id' => $this->restaurant->id,
            'pricing_mode' => 'FIXED',
            'base_price' => 25000,
            'available' => true,
        ]);

        $group = ComboGroup::factory()->create([
            'combo_id' => $this->combo->id,
            'name' => 'Main Dish',
            'allowed_min' => 1,
            'allowed_max' => 1,
        ]);

        $dish = Dish::factory()->create([
            'restaurant_id' => $this->restaurant->id,
            'price' => 12000,
            'available' => true,
        ]);

        ComboGroupItem::factory()->create([
            'combo_group_id' => $group->id,
            'dish_id' => $dish->id,
            'extra_price' => 0,
        ]);

        // Create a selection
        $this->selection = ComboSelection::factory()->create([
            'combo_id' => $this->combo->id,
            'user_id' => $this->customer->id,
            'total_price' => 25000,
        ]);
    }

    public function test_customer_can_order_combo_selection(): void
    {
        $response = $this->actingAs($this->customer, 'sanctum')
            ->postJson('/api/v1/orders', [
                'restaurant_id' => $this->restaurant->id,
                'items' => [
                    [
                        'type' => 'combo',
                        'combo_selection_id' => $this->selection->id,
                        'quantity' => 1,
                        'unit_price' => 25000,
                        'total_price' => 25000,
                    ],
                ],
                'notes' => 'Test combo order',
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'status',
                'message',
                'data' => [
                    'id',
                    'restaurant_id',
                    'total',
                    'status',
                    'items',
                ],
            ])
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.total', 25000);

        $this->assertDatabaseHas('orders', [
            'user_id' => $this->customer->id,
            'restaurant_id' => $this->restaurant->id,
            'total' => 25000,
        ]);

        $this->assertDatabaseHas('order_items', [
            'orderable_type' => 'App\Models\ComboSelection',
            'orderable_id' => $this->selection->id,
            'quantity' => 1,
            'unit_price' => 25000,
        ]);
    }

    public function test_customer_can_order_mixed_dishes_and_combos(): void
    {
        $dish = Dish::factory()->create([
            'restaurant_id' => $this->restaurant->id,
            'price' => 8000,
            'available' => true,
        ]);

        $response = $this->actingAs($this->customer, 'sanctum')
            ->postJson('/api/v1/orders', [
                'restaurant_id' => $this->restaurant->id,
                'items' => [
                    [
                        'type' => 'dish',
                        'dish_id' => $dish->id,
                        'quantity' => 2,
                        'unit_price' => 8000,
                        'total_price' => 16000,
                        'options' => [],
                    ],
                    [
                        'type' => 'combo',
                        'combo_selection_id' => $this->selection->id,
                        'quantity' => 1,
                        'unit_price' => 25000,
                        'total_price' => 25000,
                    ],
                ],
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.total', 41000);

        $orderId = $response->json('data.id');
        
        $this->assertDatabaseCount('order_items', 2);
        
        $this->assertDatabaseHas('order_items', [
            'order_id' => $orderId,
            'orderable_type' => 'App\Models\Dish',
            'orderable_id' => $dish->id,
        ]);

        $this->assertDatabaseHas('order_items', [
            'order_id' => $orderId,
            'orderable_type' => 'App\Models\ComboSelection',
            'orderable_id' => $this->selection->id,
        ]);
    }

    public function test_order_fails_with_price_mismatch(): void
    {
        $response = $this->actingAs($this->customer, 'sanctum')
            ->postJson('/api/v1/orders', [
                'restaurant_id' => $this->restaurant->id,
                'items' => [
                    [
                        'type' => 'combo',
                        'combo_selection_id' => $this->selection->id,
                        'quantity' => 1,
                        'unit_price' => 10000, // Wrong price
                        'total_price' => 10000,
                    ],
                ],
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['items']);
    }

    public function test_order_fails_when_combo_belongs_to_different_restaurant(): void
    {
        $otherRestaurant = Restaurant::factory()->create([
            'owner_id' => User::factory()->restaurant()->create()->id,
        ]);

        $response = $this->actingAs($this->customer, 'sanctum')
            ->postJson('/api/v1/orders', [
                'restaurant_id' => $otherRestaurant->id,
                'items' => [
                    [
                        'type' => 'combo',
                        'combo_selection_id' => $this->selection->id,
                        'quantity' => 1,
                        'unit_price' => 25000,
                        'total_price' => 25000,
                    ],
                ],
            ]);

        $response->assertStatus(422);
    }

    public function test_customer_cannot_use_other_users_combo_selection(): void
    {
        $otherCustomer = User::factory()->create(['role' => 'customer']);
        
        $otherSelection = ComboSelection::factory()->create([
            'combo_id' => $this->combo->id,
            'user_id' => $otherCustomer->id,
            'total_price' => 25000,
        ]);

        $response = $this->actingAs($this->customer, 'sanctum')
            ->postJson('/api/v1/orders', [
                'restaurant_id' => $this->restaurant->id,
                'items' => [
                    [
                        'type' => 'combo',
                        'combo_selection_id' => $otherSelection->id,
                        'quantity' => 1,
                        'unit_price' => 25000,
                        'total_price' => 25000,
                    ],
                ],
            ]);

        $response->assertStatus(422);
    }

    public function test_order_item_includes_combo_selection_details(): void
    {
        $response = $this->actingAs($this->customer, 'sanctum')
            ->postJson('/api/v1/orders', [
                'restaurant_id' => $this->restaurant->id,
                'items' => [
                    [
                        'type' => 'combo',
                        'combo_selection_id' => $this->selection->id,
                        'quantity' => 1,
                        'unit_price' => 25000,
                        'total_price' => 25000,
                    ],
                ],
            ]);

        $response->assertStatus(201);

        $orderId = $response->json('data.id');
        
        $orderResponse = $this->actingAs($this->customer, 'sanctum')
            ->getJson("/api/v1/orders/{$orderId}");

        $orderResponse->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'items' => [
                        '*' => [
                            'type',
                            'combo_selection_id',
                            'combo_selection',
                        ],
                    ],
                ],
            ])
            ->assertJsonPath('data.items.0.type', 'combo');
    }
}
