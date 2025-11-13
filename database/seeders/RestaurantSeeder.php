<?php

namespace Database\Seeders;

use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Database\Seeder;

class RestaurantSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all restaurant owners
        $restaurantOwners = User::where('role', 'restaurant')->get();

        // Create a restaurant for each owner
        foreach ($restaurantOwners as $owner) {
            Restaurant::factory()->create([
                'owner_id' => $owner->id,
            ]);
        }
    }
}
