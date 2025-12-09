<?php

namespace Tests\Feature\Api\Combos;

use App\Models\Combo;
use App\Models\ComboGroup;
use App\Models\Dish;
use App\Models\MenuCategory;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ComboGroupManagementTest extends TestCase
{
    use RefreshDatabase;

    protected User $manager;
    protected Restaurant $restaurant;
    protected Combo $combo;

    protected function setUp(): void
    {
        parent::setUp();

        $this->manager = User::factory()->restaurant()->create();
        $this->restaurant = Restaurant::factory()->create([
            'owner_id' => $this->manager->id,
            'verification_status' => 'verified',
        ]);
        $this->combo = Combo::factory()->create([
            'restaurant_id' => $this->restaurant->id,
        ]);
    }

    public function test_manager_can_add_group_to_combo(): void
    {
        $category = MenuCategory::factory()->create([
            'restaurant_id' => $this->restaurant->id,
        ]);

        $response = $this->actingAs($this->manager, 'sanctum')
            ->postJson("/api/v1/combos/{$this->combo->id}/groups", [
                'name' => 'Main Course',
                'description' => 'Choose your main dish',
                'allowed_min' => 1,
                'allowed_max' => 1,
                'category_hints' => [$category->id],
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'status',
                'message',
                'data' => [
                    'id',
                    'name',
                    'allowed_min',
                    'allowed_max',
                ],
            ])
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.name', 'Main Course');

        $this->assertDatabaseHas('combo_groups', [
            'combo_id' => $this->combo->id,
            'name' => 'Main Course',
        ]);
    }

    public function test_manager_can_add_items_to_group(): void
    {
        $group = ComboGroup::factory()->create([
            'combo_id' => $this->combo->id,
        ]);

        $dish = Dish::factory()->create([
            'restaurant_id' => $this->restaurant->id,
            'available' => true,
        ]);

        $response = $this->actingAs($this->manager, 'sanctum')
            ->postJson("/api/v1/combo-groups/{$group->id}/items", [
                'dish_id' => $dish->id,
                'extra_price' => 5000,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.dish_id', $dish->id)
            ->assertJsonPath('data.extra_price', 5000);

        $this->assertDatabaseHas('combo_group_items', [
            'combo_group_id' => $group->id,
            'dish_id' => $dish->id,
        ]);
    }

    public function test_manager_can_update_group(): void
    {
        $group = ComboGroup::factory()->create([
            'combo_id' => $this->combo->id,
            'name' => 'Old Name',
        ]);

        $response = $this->actingAs($this->manager, 'sanctum')
            ->putJson("/api/v1/combo-groups/{$group->id}", [
                'name' => 'Updated Group',
                'description' => 'Updated description',
                'allowed_min' => 2,
                'allowed_max' => 3,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.name', 'Updated Group');

        $this->assertDatabaseHas('combo_groups', [
            'id' => $group->id,
            'name' => 'Updated Group',
        ]);
    }

    public function test_manager_can_delete_group(): void
    {
        $group = ComboGroup::factory()->create([
            'combo_id' => $this->combo->id,
        ]);

        $response = $this->actingAs($this->manager, 'sanctum')
            ->deleteJson("/api/v1/combo-groups/{$group->id}");

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success');

        $this->assertDatabaseMissing('combo_groups', [
            'id' => $group->id,
        ]);
    }
}
