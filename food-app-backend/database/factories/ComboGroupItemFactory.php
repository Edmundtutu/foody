<?php

namespace Database\Factories;

use App\Models\ComboGroup;
use App\Models\ComboGroupItem;
use App\Models\Dish;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ComboGroupItem>
 */
class ComboGroupItemFactory extends Factory
{
    protected $model = ComboGroupItem::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'combo_group_id' => ComboGroup::factory(),
            'dish_id' => Dish::factory(),
            'extra_price' => $this->faker->numberBetween(0, 5000),
        ];
    }
}
