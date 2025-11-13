<?php

namespace Database\Seeders;

use App\Models\Dish;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Database\Seeder;

class OrderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $customers = User::where('role', 'customer')->get();
        $restaurants = Restaurant::all();

        // Create 10-20 random orders
        $orderCount = rand(10, 20);

        for ($i = 0; $i < $orderCount; $i++) {
            $restaurant = $restaurants->random();
            $customer = $customers->random();

            // Create order
            $order = Order::factory()->create([
                'user_id' => $customer->id,
                'restaurant_id' => $restaurant->id,
                'total' => 0, // Will be calculated below
            ]);

            // Get dishes from this restaurant
            $restaurantDishes = Dish::where('restaurant_id', $restaurant->id)->get();

            if ($restaurantDishes->isEmpty()) {
                continue;
            }

            $total = 0;
            $itemCount = rand(2, 4);

            // Create 2-4 order items
            for ($j = 0; $j < $itemCount; $j++) {
                $dish = $restaurantDishes->random();
                $quantity = rand(1, 3);
                $unitPrice = $dish->price;
                $totalPrice = $quantity * $unitPrice;

                OrderItem::factory()->create([
                    'order_id' => $order->id,
                    'dish_id' => $dish->id,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'total_price' => $totalPrice,
                ]);

                $total += $totalPrice;
            }

            // Update order total
            $order->update(['total' => $total]);
        }
    }
}
