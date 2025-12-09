<?php

namespace Database\Factories;

use App\Models\Combo;
use App\Models\ComboGroup;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ComboGroup>
 */
class ComboGroupFactory extends Factory
{
    protected $model = ComboGroup::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $min = $this->faker->numberBetween(1, 2);
        $max = $min + $this->faker->numberBetween(0, 2);

        return [
            'combo_id' => Combo::factory(),
            'name' => 'Pick ' . $max . ' ' . $this->faker->randomElement(['Mains', 'Sides', 'Drinks', 'Treats']),
            'allowed_min' => $min,
            'allowed_max' => max($max, $min),
        ];
    }
}
