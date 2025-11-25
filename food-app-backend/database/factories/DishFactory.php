<?php

namespace Database\Factories;

use App\Models\MenuCategory;
use App\Models\Restaurant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Dish>
 */
class DishFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $ugandanDishes = [
            'Luwombo Chicken',
            'Matooke with Groundnut Sauce',
            'Rolex (Egg Roll)',
            'Matoke Plate',
            'Chicken Luwombo',
            'Fish Luwombo',
            'Beef Stew',
            'Pilau Rice',
            'Posho and Beans',
            'Chapati',
            'Samosas',
            'Katogo (Matooke and Offals)',
            'Muchomo (Grilled Meat)',
            'Kikomando (Chapati and Beans)',
            'Cassava and Groundnut Sauce',
        ];

        return [
            'restaurant_id' => Restaurant::factory(),
            'category_id' => MenuCategory::factory(),
            'name' => fake()->randomElement($ugandanDishes),
            'description' => fake()->sentence(),
            'price' => fake()->numberBetween(5000, 25000),
            'unit' => fake()->randomElement(['plate', 'piece', 'bowl', 'serving']),
            'available' => fake()->boolean(85),
            'images' => json_encode([
                'https://loremflickr.com/960/640/food?lock=' . fake()->numberBetween(1, 999999),
            ]),
            'tags' => json_encode(
                fake()->randomElements(
                    ['traditional', 'ugandan', 'vegetarian', 'spicy', 'grilled', 'popular', 'local'],
                    fake()->numberBetween(1, 3)
                )
            ),
        ];
    }
}
