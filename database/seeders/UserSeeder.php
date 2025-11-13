<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create admin user
        User::factory()->admin()->create([
            'name' => 'Admin User',
            'email' => 'admin@foodapp.com',
            'phone' => '+256700000001',
        ]);

        // Create restaurant owners
        User::factory()->restaurant()->count(5)->create();

        // Create customers
        User::factory()->count(10)->create();
    }
}
