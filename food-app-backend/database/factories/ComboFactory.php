<?php

namespace Database\Factories;

use App\Models\Combo;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Combo>
 */
class ComboFactory extends Factory
{
    protected $model = Combo::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $mode = $this->faker->randomElement(['FIXED', 'DYNAMIC', 'HYBRID']);
        $basePrice = match ($mode) {
            'FIXED' => $this->faker->numberBetween(20000, 40000),
            'HYBRID' => $this->faker->numberBetween(15000, 30000),
            default => 0,
        };

        return [
            'restaurant_id' => \App\Models\Restaurant::factory(),
            'name' => $this->faker->unique()->words(2, true) . ' Combo',
            'description' => $this->faker->sentence(),
            'pricing_mode' => $mode,
            'base_price' => $basePrice,
            'available' => true,
        ];
    }
}
