<?php

namespace Database\Seeders;

use App\Models\Combo;
use Illuminate\Database\Seeder;

class ComboSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $target = 5;
        $missing = max($target - Combo::count(), 0);

        if ($missing === 0) {
            return;
        }

        Combo::factory()->count($missing)->create();
    }
}
