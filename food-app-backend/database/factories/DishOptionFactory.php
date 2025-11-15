<?php

namespace Database\Factories;

use App\Models\Dish;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\DishOption>
 */
class DishOptionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $options = [
            ['name' => 'Extra Sauce', 'cost' => 1000],
            ['name' => 'Extra Meat', 'cost' => 5000],
            ['name' => 'Extra Vegetables', 'cost' => 2000],
            ['name' => 'Spicy Level', 'cost' => 0],
            ['name' => 'No Onions', 'cost' => 0],
            ['name' => 'Extra Cheese', 'cost' => 2000],
            ['name' => 'Large Portion', 'cost' => 3000],
            ['name' => 'Side Salad', 'cost' => 2500],
        ];

        $option = fake()->randomElement($options);

        return [
            'dish_id' => Dish::factory(),
            'name' => $option['name'],
            'extra_cost' => $option['cost'],
            'required' => fake()->boolean(10),
        ];
    }
}
