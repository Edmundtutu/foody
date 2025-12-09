<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            UserSeeder::class,
            RestaurantSeeder::class,
            ProvisionalAdditionalRestaurantsSeeder::class,
            MenuSeeder::class,
            ComboSeeder::class,
            ComboGroupSeeder::class,
            ComboGroupItemSeeder::class,
            OrderSeeder::class,
            ReviewSeeder::class,
            ConversationSeeder::class,
            InventorySeeder::class,
        ]);
    }
}
