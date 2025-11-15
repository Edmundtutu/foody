<?php

namespace App\Services;

use App\Events\OrderStatusUpdated;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Support\Facades\DB;

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
            foreach ($data['items'] as $item) {
                $orderItem = OrderItem::create([
                    'order_id' => $order->id,
                    'dish_id' => $item['dish_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total_price' => $item['total_price'],
                    'options' => $item['options'] ?? null,
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
