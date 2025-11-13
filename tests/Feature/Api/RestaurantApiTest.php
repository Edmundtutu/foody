<?php

namespace Tests\Feature\Api;

use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RestaurantApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_verified_restaurants(): void
    {
        $owner = User::factory()->restaurant()->create();

        Restaurant::factory()->create([
            'owner_id' => $owner->id,
            'verification_status' => 'verified',
        ]);

        Restaurant::factory()->create([
            'owner_id' => $owner->id,
            'verification_status' => 'pending',
        ]);

        $response = $this->getJson('/api/v1/restaurants');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'message',
                'data' => [
                    '*' => ['id', 'name', 'verification_status'],
                ],
            ])
            ->assertJsonPath('status', 'success');
    }

    public function test_authenticated_user_can_create_restaurant(): void
    {
        $user = User::factory()->restaurant()->create();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/restaurants', [
                'name' => 'Test Restaurant',
                'description' => 'A test restaurant',
                'phone' => '0700000000',
                'email' => 'test@restaurant.com',
                'address' => 'Test Address',
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'status',
                'message',
                'data' => ['id', 'name'],
            ])
            ->assertJsonPath('status', 'success')
            ->assertJsonPath('data.name', 'Test Restaurant');
    }

    public function test_guest_cannot_create_restaurant(): void
    {
        $response = $this->postJson('/api/v1/restaurants', [
            'name' => 'Test Restaurant',
            'phone' => '0700000000',
        ]);

        $response->assertStatus(401);
    }
}
