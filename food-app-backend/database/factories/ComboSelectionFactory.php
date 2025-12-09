<?php

namespace Database\Factories;

use App\Models\Combo;
use App\Models\ComboSelection;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ComboSelection>
 */
class ComboSelectionFactory extends Factory
{
    protected $model = ComboSelection::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'combo_id' => Combo::factory(),
            'user_id' => User::factory(),
            'total_price' => 30000,
        ];
    }
}
