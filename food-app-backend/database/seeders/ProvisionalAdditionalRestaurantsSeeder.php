<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Restaurant;

class ProvisionalAdditionalRestaurantsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $userId = \DB::table('users')->where('role', 'restaurant')->first()?->id;

        $restaurants = [
            ['name' => 'Mbarara Flavours'],
            ['name' => 'Igongo Gardens'],
            ['name' => 'Kakoba Grill House'],
            ['name' => 'Ruti Food Arena'],
            ['name' => 'Biharwe View Restaurant'],
            ['name' => 'Highland Kitchen Mbarara'],
            ['name' => 'Ankole Dine Spot'],
            ['name' => 'Boma Terrace Cuisine'],
            ['name' => 'Agip Fast Meals'],
            ['name' => 'Katete Chef Point'],
            ['name' => 'Adit Mall Bistro'],
            ['name' => 'Mbarara Steak Village'],
            ['name' => 'Nyamitanga Kitchen'],
            ['name' => 'Kamukuzi Tasty House'],
            ['name' => 'Mbarara Town Meals'],
            ['name' => 'Mbarara Eats House'],
            ['name' => 'Valley View Restaurant'],
            ['name' => 'Classic Corner Kakoba'],
            ['name' => 'Ankole Spices Café'],
            ['name' => 'Coffee Yard Mbarara'],
        ];

        $locations = [
            'High Street, Mbarara',
            'Boma Road, Mbarara',
            'Kakoba Road, Mbarara',
            'Ruti Trading Centre, Mbarara',
            'Biharwe Hill, Mbarara',
            'Muti Lane, Mbarara',
            'Independence Road, Mbarara',
            'Mbarara–Masaka Road',
            'Nkokonjeru, Mbarara',
            'Mbarara Town Centre',
        ];

        foreach ($restaurants as $restaurant) {
            Restaurant::create([
                'owner_id' => $userId,
                'name' => $restaurant['name'],
                'description' => fake()->sentence(),
                'phone' => '+2567' . fake()->numerify('########'),
                'email' => fake()->unique()->safeEmail(),
                'address' => fake()->randomElement($locations),

                // Coordinates roughly around Mbarara City
                'latitude' => fake()->latitude(-0.65, -0.55),
                'longitude' => fake()->longitude(30.60, 30.75),

                'verification_status' => 'verified',
                'config' => null,
            ]);
        }
    }
}
