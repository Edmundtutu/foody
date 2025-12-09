<?php

namespace App\Services;

use App\Events\OrderStatusUpdated;
use App\Models\ComboSelection;
use App\Models\Dish;
use App\Models\DishOption;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Database\Eloquent\Relations\MorphTo;
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
                $type = $itemData['type'] ?? 'dish';

                $orderItem = $type === 'combo'
                    ? $this->createComboOrderItem($order, $itemData, $data)
                    : $this->createDishOrderItem($order, $itemData, $data);

                $total += $orderItem->total_price;
            }

            $order->update(['total' => $total]);

            return $order->fresh($this->orderRelations());
        });
    }

    public function getOrderById(string $id)
    {
        return Order::with($this->orderRelations())->findOrFail($id);
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
            ->with($this->orderRelations())
            ->latest()
            ->get();
    }

    public function getRestaurantOrders(string $restaurantId)
    {
        return Order::where('restaurant_id', $restaurantId)
            ->with($this->orderRelations())
            ->latest()
            ->get();
    }

    protected function createDishOrderItem(Order $order, array $itemData, array $orderData): OrderItem
    {
        // SECURITY: Validate prices server-side using canonical dish data
        $dish = Dish::findOrFail($itemData['dish_id']);

        // Verify dish belongs to the same restaurant as the order
        if ($dish->restaurant_id !== $orderData['restaurant_id']) {
            throw ValidationException::withMessages([
                'items' => ['One or more dishes do not belong to this restaurant.']
            ]);
        }

        // Ensure customers cannot order unavailable dishes
        if (!$dish->available) {
            throw ValidationException::withMessages([
                'items' => ["Dish '{$dish->name}' is currently unavailable."]
            ]);
        }

        $actualUnitPrice = $dish->price;
        $validatedOptions = [];

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

        $actualTotalPrice = $actualUnitPrice * $itemData['quantity'];

        $this->assertPriceMatches($itemData, $actualUnitPrice, $actualTotalPrice);

        return OrderItem::create([
            'order_id' => $order->id,
            'orderable_type' => Dish::class,
            'orderable_id' => $dish->id,
            'quantity' => $itemData['quantity'],
            'unit_price' => $actualUnitPrice,
            'total_price' => $actualTotalPrice,
            'notes' => $itemData['notes'] ?? null,
            'options' => !empty($validatedOptions) ? $validatedOptions : null,
        ]);
    }

    protected function createComboOrderItem(Order $order, array $itemData, array $orderData): OrderItem
    {
        // Use previously calculated combo selections as immutable snapshots
        $selection = ComboSelection::with(['combo', 'items.dish.options'])
            ->findOrFail($itemData['combo_selection_id']);

        // Prevent cross-restaurant combo misuse
        if ($selection->combo->restaurant_id !== $orderData['restaurant_id']) {
            throw ValidationException::withMessages([
                'items' => ['Selected combo does not belong to this restaurant.']
            ]);
        }

        // Enforce ownership when selections are tied to a user
        if ($selection->user_id && $selection->user_id !== $orderData['user_id']) {
            throw ValidationException::withMessages([
                'items' => ['You cannot use a combo selection that was not created by you.']
            ]);
        }

        $quantity = $itemData['quantity'];
        $actualUnitPrice = (int) $selection->total_price;
        $actualTotalPrice = $actualUnitPrice * $quantity;

        $this->assertPriceMatches($itemData, $actualUnitPrice, $actualTotalPrice);

        return OrderItem::create([
            'order_id' => $order->id,
            'orderable_type' => ComboSelection::class,
            'orderable_id' => $selection->id,
            'quantity' => $quantity,
            'unit_price' => $actualUnitPrice,
            'total_price' => $actualTotalPrice,
            'notes' => $itemData['notes'] ?? null,
            'options' => null,
        ]);
    }

    protected function assertPriceMatches(array $itemData, int $unitPrice, int $totalPrice): void
    {
        if (isset($itemData['unit_price']) && $itemData['unit_price'] !== $unitPrice) {
            throw ValidationException::withMessages([
                'items' => ['Price mismatch detected. Please refresh and try again.']
            ]);
        }

        if (isset($itemData['total_price']) && $itemData['total_price'] !== $totalPrice) {
            throw ValidationException::withMessages([
                'items' => ['Price mismatch detected. Please refresh and try again.']
            ]);
        }
    }

    protected function orderRelations(): array
    {
        return [
            'items.orderable' => function (MorphTo $morphTo) {
                $morphTo->morphWith([
                    Dish::class => ['options'],
                    ComboSelection::class => ['items.dish.options', 'combo'],
                ]);
            },
            'restaurant',
            'user',
        ];
    }
}
