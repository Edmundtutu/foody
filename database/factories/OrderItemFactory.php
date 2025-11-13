<?php

namespace Database\Factories;

use App\Models\Dish;
use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\OrderItem>
 */
class OrderItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $quantity = fake()->numberBetween(1, 3);
        $unitPrice = fake()->numberBetween(5000, 25000);
        
        return [
            'order_id' => Order::factory(),
            'dish_id' => Dish::factory(),
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'total_price' => $quantity * $unitPrice,
            'options' => json_encode(
                fake()->optional()->randomElements(
                    ['Extra Sauce', 'Extra Meat', 'Spicy', 'No Onions'],
                    fake()->numberBetween(0, 2)
                )
            ),
        ];
    }
}
