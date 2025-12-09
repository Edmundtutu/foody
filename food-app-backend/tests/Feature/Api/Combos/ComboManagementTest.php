<?php

namespace Tests\Feature\Api\Combos;

use App\Models\Combo;
use App\Models\Dish;
use App\Models\MenuCategory;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ComboManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $manager;
    protected Restaurant $restaurant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->manager = User::factory()->restaurant()->create();
        $this->restaurant = Restaurant::factory()->create([
            'owner_id' => $this->manager->id,
            'verification_status' => 'verified',
        ]);
    }

    public function test_restaurant_manager_can_create_combo(): void
    {
        $response = $this->actingAs($this->manager, 'sanctum')
            ->postJson('/api/v1/combos', [
                'restaurant_id' => $this->restaurant->id,
                'name' => 'Family Feast',
                'description' => 'Perfect meal for the whole family',
                'pricing_mode' => 'fixed',
                'base_price' => 45000,
                'available' => true,
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'status',
                'message',
                'data' => [
                    'id',
                    'name',
                    'description',
                    'pricing_mode',
                    'base_price',
                    'available',
                ],
            ])
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.name', 'Family Feast')
            ->assertJsonPath('data.pricing_mode', 'FIXED')
            ->assertJsonPath('data.base_price', 45000);

        $this->assertDatabaseHas('combos', [
            'name' => 'Family Feast',
            'restaurant_id' => $this->restaurant->id,
        ]);
    }

    public function test_customer_cannot_create_combo(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);

        $response = $this->actingAs($customer, 'sanctum')
            ->postJson('/api/v1/combos', [
                'restaurant_id' => $this->restaurant->id,
                'name' => 'Unauthorized Combo',
                'pricing_mode' => 'fixed',
                'base_price' => 20000,
            ]);

        $response->assertStatus(403);
    }

    public function test_can_list_combos_for_restaurant(): void
    {
        Combo::factory()->count(3)->create([
            'restaurant_id' => $this->restaurant->id,
            'available' => true,
        ]);

        $otherRestaurant = Restaurant::factory()->create([
            'owner_id' => User::factory()->restaurant()->create()->id,
        ]);
        Combo::factory()->create([
            'restaurant_id' => $otherRestaurant->id,
        ]);

        $response = $this->getJson("/api/v1/restaurants/{$this->restaurant->id}/combos");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'message',
                'data' => [
                    '*' => ['id', 'name', 'pricing_mode', 'base_price'],
                ],
            ])
            ->assertJsonPath('status', 'success')
            ->assertJsonCount(3, 'data');
    }

    public function test_can_view_single_combo_with_groups(): void
    {
        $combo = Combo::factory()->create([
            'restaurant_id' => $this->restaurant->id,
        ]);

        $response = $this->getJson("/api/v1/combos/{$combo->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'message',
                'data' => [
                    'id',
                    'name',
                    'pricing_mode',
                    'groups',
                ],
            ])
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.id', $combo->id);
    }

    public function test_manager_can_update_own_combo(): void
    {
        $combo = Combo::factory()->create([
            'restaurant_id' => $this->restaurant->id,
            'name' => 'Old Name',
        ]);

        $response = $this->actingAs($this->manager, 'sanctum')
            ->putJson("/api/v1/combos/{$combo->id}", [
                'name' => 'Updated Combo',
                'description' => 'New description',
                'pricing_mode' => 'dynamic',
                'base_price' => 0,
                'available' => false,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.name', 'Updated Combo')
            ->assertJsonPath('data.pricing_mode', 'DYNAMIC')
            ->assertJsonPath('data.available', false);

        $this->assertDatabaseHas('combos', [
            'id' => $combo->id,
            'name' => 'Updated Combo',
        ]);
    }

    public function test_manager_cannot_update_other_restaurant_combo(): void
    {
        $otherManager = User::factory()->restaurant()->create();
        $otherRestaurant = Restaurant::factory()->create([
            'owner_id' => $otherManager->id,
        ]);
        $combo = Combo::factory()->create([
            'restaurant_id' => $otherRestaurant->id,
        ]);

        $response = $this->actingAs($this->manager, 'sanctum')
            ->putJson("/api/v1/combos/{$combo->id}", [
                'name' => 'Hacked Combo',
            ]);

        $response->assertStatus(403);
    }

    public function test_manager_can_delete_own_combo(): void
    {
        $combo = Combo::factory()->create([
            'restaurant_id' => $this->restaurant->id,
        ]);

        $response = $this->actingAs($this->manager, 'sanctum')
            ->deleteJson("/api/v1/combos/{$combo->id}");

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');

        $this->assertDatabaseMissing('combos', [
            'id' => $combo->id,
        ]);
    }
}
