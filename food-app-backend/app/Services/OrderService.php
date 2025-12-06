<?php

namespace App\Services;

use App\Events\OrderStatusUpdated;
use App\Models\Dish;
use App\Models\DishOption;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderService
{
    public function createOrder(array $data)
    {
        return DB::transaction(function () use ($data) {
            $order = Order::create([
                'user_id' => $data['user_id'],
                'restaurant_id' => $data['restaurant_id'],
                'total' => 0,
                'status' => 'pending',
                'notes' => $data['notes'] ?? null,
            ]);

            $total = 0;
            foreach ($data['items'] as $itemData) {
                // SECURITY: Validate prices server-side
                $dish = Dish::findOrFail($itemData['dish_id']);
                
                // Verify dish belongs to the restaurant
                if ($dish->restaurant_id !== $data['restaurant_id']) {
                    throw ValidationException::withMessages([
                        'items' => ['One or more dishes do not belong to this restaurant.']
                    ]);
                }

                // Verify dish is available
                if (!$dish->available) {
                    throw ValidationException::withMessages([
                        'items' => ["Dish '{$dish->name}' is currently unavailable."]
                    ]);
                }

                // Calculate actual unit price from database
                $actualUnitPrice = $dish->price;
                $validatedOptions = [];

                // Validate and calculate options price
                if (!empty($itemData['options'])) {
                    $optionIds = array_column($itemData['options'], 'id');
                    $dishOptions = DishOption::whereIn('id', $optionIds)
                        ->where('dish_id', $dish->id)
                        ->get()
                        ->keyBy('id');

                    foreach ($itemData['options'] as $optionData) {
                        $optionId = $optionData['id'] ?? null;
                        
                        if (!$optionId || !isset($dishOptions[$optionId])) {
                            throw ValidationException::withMessages([
                                'items' => ['Invalid option selected for dish.']
                            ]);
                        }

                        $validOption = $dishOptions[$optionId];
                        $actualUnitPrice += $validOption->extra_cost;
                        $validatedOptions[] = [
                            'id' => $validOption->id,
                            'name' => $validOption->name,
                            'extra_cost' => $validOption->extra_cost,
                        ];
                    }
                }

                // Calculate actual total price
                $actualTotalPrice = $actualUnitPrice * $itemData['quantity'];

                // Verify submitted prices match (prevent price manipulation)
                if (isset($itemData['unit_price']) && $itemData['unit_price'] !== $actualUnitPrice) {
                    throw ValidationException::withMessages([
                        'items' => ['Price mismatch detected. Please refresh and try again.']
                    ]);
                }

                if (isset($itemData['total_price']) && $itemData['total_price'] !== $actualTotalPrice) {
                    throw ValidationException::withMessages([
                        'items' => ['Price mismatch detected. Please refresh and try again.']
                    ]);
                }

                // Create order item with validated prices
                $orderItem = OrderItem::create([
                    'order_id' => $order->id,
                    'dish_id' => $dish->id,
                    'quantity' => $itemData['quantity'],
                    'unit_price' => $actualUnitPrice,
                    'total_price' => $actualTotalPrice,
                    'notes' => $itemData['notes'] ?? null,
                    'options' => !empty($validatedOptions) ? $validatedOptions : null,
                ]);
                
                $total += $orderItem->total_price;
            }

            $order->update(['total' => $total]);

            return $order->fresh(['items.dish', 'restaurant']);
        });
    }

    public function getOrderById(string $id)
    {
        return Order::with(['items.dish', 'restaurant', 'user'])->findOrFail($id);
    }

    public function updateOrderStatus(string $id, string $status)
    {
        $order = Order::findOrFail($id);
        $order->update(['status' => $status]);

        $order = $order->fresh();

        // Broadcast the order status update event
        event(new OrderStatusUpdated($order));

        return $order;
    }

    public function getUserOrders(string $userId)
    {
        return Order::where('user_id', $userId)
            ->with(['items.dish', 'restaurant'])
            ->latest()
            ->get();
    }

    public function getRestaurantOrders(string $restaurantId)
    {
        return Order::where('restaurant_id', $restaurantId)
            ->with(['items.dish', 'user'])
            ->latest()
            ->get();
    }
}
