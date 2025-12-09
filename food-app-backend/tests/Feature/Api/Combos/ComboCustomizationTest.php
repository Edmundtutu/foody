<?php

namespace Tests\Feature\Api\Combos;

use App\Models\Combo;
use App\Models\ComboGroup;
use App\Models\ComboGroupItem;
use App\Models\Dish;
use App\Models\DishOption;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ComboCustomizationTest extends TestCase
{
    use RefreshDatabase;

    protected User $customer;
    protected Restaurant $restaurant;
    protected Combo $combo;

    protected function setUp(): void
    {
        parent::setUp();

        $this->customer = User::factory()->create(['role' => 'customer']);
        
        $manager = User::factory()->restaurant()->create();
        $this->restaurant = Restaurant::factory()->create([
            'owner_id' => $manager->id,
            'verification_status' => 'verified',
        ]);
        
        $this->combo = Combo::factory()->create([
            'restaurant_id' => $this->restaurant->id,
            'pricing_mode' => 'FIXED',
            'base_price' => 30000,
            'available' => true,
        ]);
    }

    public function test_customer_can_calculate_combo_price_with_fixed_pricing(): void
    {
        $group = ComboGroup::factory()->create([
            'combo_id' => $this->combo->id,
            'name' => 'Main Dish',
            'allowed_min' => 1,
            'allowed_max' => 1,
        ]);

        $dish = Dish::factory()->create([
            'restaurant_id' => $this->restaurant->id,
            'price' => 15000,
            'available' => true,
        ]);

        ComboGroupItem::factory()->create([
            'combo_group_id' => $group->id,
            'dish_id' => $dish->id,
            'extra_price' => 0,
        ]);

        $response = $this->actingAs($this->customer, 'sanctum')
            ->postJson("/api/v1/combos/{$this->combo->id}/calculate", [
                'groups' => [
                    [
                        'group_id' => $group->id,
                        'selected' => [
                            [
                                'dish_id' => $dish->id,
                                'option_ids' => [],
                            ],
                        ],
                    ],
                ],
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'message',
                'data' => [
                    'combo_id',
                    'pricing_mode',
                    'base_price',
                    'items',
                    'total',
                ],
            ])
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.pricing_mode', 'FIXED')
            ->assertJsonPath('data.total', 30000);
    }

    public function test_customer_can_calculate_combo_with_dish_options(): void
    {
        $this->combo->update(['pricing_mode' => 'DYNAMIC']);

        $group = ComboGroup::factory()->create([
            'combo_id' => $this->combo->id,
            'allowed_min' => 1,
            'allowed_max' => 1,
        ]);

        $dish = Dish::factory()->create([
            'restaurant_id' => $this->restaurant->id,
            'price' => 10000,
            'available' => true,
        ]);

        $option = DishOption::factory()->create([
            'dish_id' => $dish->id,
            'name' => 'Extra Cheese',
            'extra_cost' => 2000,
        ]);

        ComboGroupItem::factory()->create([
            'combo_group_id' => $group->id,
            'dish_id' => $dish->id,
            'extra_price' => 1000,
        ]);

        $response = $this->actingAs($this->customer, 'sanctum')
            ->postJson("/api/v1/combos/{$this->combo->id}/calculate", [
                'groups' => [
                    [
                        'group_id' => $group->id,
                        'selected' => [
                            [
                                'dish_id' => $dish->id,
                                'option_ids' => [$option->id],
                            ],
                        ],
                    ],
                ],
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.pricing_mode', 'DYNAMIC');

        // Dynamic pricing: dish base (10000) + option (2000) + group extra (1000) = 13000
        $total = $response->json('data.total');
        $this->assertEquals(13000, $total);
    }

    public function test_customer_can_save_combo_selection(): void
    {
        $group = ComboGroup::factory()->create([
            'combo_id' => $this->combo->id,
            'allowed_min' => 1,
            'allowed_max' => 1,
        ]);

        $dish = Dish::factory()->create([
            'restaurant_id' => $this->restaurant->id,
            'available' => true,
        ]);

        ComboGroupItem::factory()->create([
            'combo_group_id' => $group->id,
            'dish_id' => $dish->id,
            'extra_price' => 0,
        ]);

        $response = $this->actingAs($this->customer, 'sanctum')
            ->postJson("/api/v1/combos/{$this->combo->id}/selections", [
                'groups' => [
                    [
                        'group_id' => $group->id,
                        'selected' => [
                            [
                                'dish_id' => $dish->id,
                                'option_ids' => [],
                            ],
                        ],
                    ],
                ],
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'status',
                'message',
                'data' => [
                    'id',
                    'combo_id',
                    'user_id',
                    'total_price',
                    'items',
                ],
            ])
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.user_id', $this->customer->id);

        $this->assertDatabaseHas('combo_selections', [
            'combo_id' => $this->combo->id,
            'user_id' => $this->customer->id,
        ]);
    }

    public function test_calculation_fails_with_invalid_dish(): void
    {
        $group = ComboGroup::factory()->create([
            'combo_id' => $this->combo->id,
        ]);

        $dishFromOtherRestaurant = Dish::factory()->create([
            'restaurant_id' => Restaurant::factory()->create([
                'owner_id' => User::factory()->restaurant()->create()->id,
            ])->id,
        ]);

        $response = $this->actingAs($this->customer, 'sanctum')
            ->postJson("/api/v1/combos/{$this->combo->id}/calculate", [
                'selections' => [
                    [
                        'group_id' => $group->id,
                        'dish_id' => $dishFromOtherRestaurant->id,
                        'option_ids' => [],
                    ],
                ],
            ]);

        $response->assertStatus(422);
    }

    public function test_guest_cannot_save_selection(): void
    {
        $group = ComboGroup::factory()->create([
            'combo_id' => $this->combo->id,
        ]);

        $dish = Dish::factory()->create([
            'restaurant_id' => $this->restaurant->id,
        ]);

        ComboGroupItem::factory()->create([
            'combo_group_id' => $group->id,
            'dish_id' => $dish->id,
        ]);

        $response = $this->postJson("/api/v1/combos/{$this->combo->id}/selections", [
            'groups' => [
                [
                    'group_id' => $group->id,
                    'selected' => [
                        [
                            'dish_id' => $dish->id,
                            'option_ids' => [],
                        ],
                    ],
                ],
            ],
        ]);

        $response->assertStatus(401);
    }
}
