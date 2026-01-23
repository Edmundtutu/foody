<?php

namespace App\Services;

use App\Events\OrderStatusUpdated;
use App\Models\Agent;
use App\Models\Order;
use App\Models\OrderLogistics;
use App\Models\Restaurant;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class DispatchService
{
    /**
     * Create logistics record for a delivery order.
     */
    public function createLogistics(Order $order, array $deliveryAddress, ?array $pickupAddress = null): OrderLogistics
    {
        if (!$order->isDelivery()) {
            throw new \InvalidArgumentException('Logistics can only be created for DELIVERY orders');
        }

        if ($order->hasLogistics()) {
            throw new \InvalidArgumentException('Order already has logistics record');
        }

        // Default pickup address is restaurant location
        $pickup = $pickupAddress ?? [
            'name' => $order->restaurant->name,
            'address' => $order->restaurant->address,
            'lat' => $order->restaurant->latitude,
            'lng' => $order->restaurant->longitude,
            'phone' => $order->restaurant->phone,
        ];

        return OrderLogistics::create([
            'order_id' => $order->id,
            'pickup_address' => $pickup,
            'delivery_address' => $deliveryAddress,
            'delivery_status' => OrderLogistics::STATUS_PENDING,
        ]);
    }

    /**
     * Assign an agent to a logistics record.
     */
    public function assignAgent(OrderLogistics $logistics, Agent $agent, int $maxLoad = 3): OrderLogistics
    {
        if (!$logistics->isPending()) {
            throw new \InvalidArgumentException('Can only assign agent to PENDING logistics');
        }

        if (!$agent->canAcceptDelivery($maxLoad)) {
            throw new \InvalidArgumentException('Agent is not available or has reached max load');
        }

        if ($logistics->order->restaurant_id !== $agent->restaurant_id) {
            throw new \InvalidArgumentException('Agent does not belong to the order restaurant');
        }

        return DB::transaction(function () use ($logistics, $agent) {
            $logistics->update([
                'agent_id' => $agent->id,
                'delivery_status' => OrderLogistics::STATUS_ASSIGNED,
                'assigned_at' => now(),
            ]);

            $agent->incrementLoad();

            return $logistics->fresh(['agent', 'order']);
        });
    }

    /**
     * Unassign agent from logistics (revert to pending).
     */
    public function unassignAgent(OrderLogistics $logistics): OrderLogistics
    {
        if (!$logistics->isAssigned() || $logistics->delivery_status !== OrderLogistics::STATUS_ASSIGNED) {
            throw new \InvalidArgumentException('Can only unassign from ASSIGNED status');
        }

        return DB::transaction(function () use ($logistics) {
            $agent = $logistics->agent;

            $logistics->update([
                'agent_id' => null,
                'delivery_status' => OrderLogistics::STATUS_PENDING,
                'assigned_at' => null,
            ]);

            if ($agent) {
                $agent->decrementLoad();
            }

            return $logistics->fresh();
        });
    }

    /**
     * Update delivery status with validation.
     */
    public function updateDeliveryStatus(OrderLogistics $logistics, string $newStatus): OrderLogistics
    {
        if (!in_array($newStatus, OrderLogistics::STATUSES, true)) {
            throw new \InvalidArgumentException("Invalid status: {$newStatus}");
        }

        if (!$logistics->canTransitionTo($newStatus)) {
            throw new \InvalidArgumentException(
                "Cannot transition from {$logistics->delivery_status} to {$newStatus}"
            );
        }

        return DB::transaction(function () use ($logistics, $newStatus) {
            $updateData = ['delivery_status' => $newStatus];

            // Set timestamps based on status
            switch ($newStatus) {
                case OrderLogistics::STATUS_PICKED_UP:
                    $updateData['picked_up_at'] = now();
                    break;
                case OrderLogistics::STATUS_DELIVERED:
                    $updateData['delivered_at'] = now();
                    break;
            }

            $logistics->update($updateData);

            // If delivered, complete the parent order and decrement agent load
            if ($newStatus === OrderLogistics::STATUS_DELIVERED) {
                $this->completeDelivery($logistics);
            }

            return $logistics->fresh(['agent', 'order']);
        });
    }

    /**
     * Complete delivery - mark order as completed and decrement agent load.
     */
    protected function completeDelivery(OrderLogistics $logistics): void
    {
        $order = $logistics->order;
        $agent = $logistics->agent;

        // Update order status to completed
        $order->update(['status' => Order::STATUS_COMPLETED]);

        // Decrement agent's current load
        if ($agent) {
            $agent->decrementLoad();
        }

        // Broadcast order status update
        event(new OrderStatusUpdated($order->fresh()));
    }

    /**
     * Get pending (unassigned) delivery orders for a restaurant.
     */
    public function getPendingDeliveries(Restaurant $restaurant): Collection
    {
        return OrderLogistics::whereHas('order', function ($query) use ($restaurant) {
            $query->where('restaurant_id', $restaurant->id)
                ->where('order_type', Order::TYPE_DELIVERY);
        })
            ->pending()
            ->with(['order.user', 'order.items'])
            ->orderBy('created_at')
            ->get();
    }

    /**
     * Get all delivery orders for a restaurant with optional status filter.
     */
    public function getDeliveries(Restaurant $restaurant, ?string $status = null): Collection
    {
        $query = OrderLogistics::whereHas('order', function ($q) use ($restaurant) {
            $q->where('restaurant_id', $restaurant->id)
                ->where('order_type', Order::TYPE_DELIVERY);
        })
            ->with(['order.user', 'order.items', 'agent']);

        if ($status) {
            $query->where('delivery_status', $status);
        }

        return $query->orderByDesc('created_at')->get();
    }

    /**
     * Get assigned deliveries for an agent.
     */
    public function getAgentDeliveries(Agent $agent, ?string $status = null): Collection
    {
        $query = $agent->logistics()
            ->with(['order.user', 'order.restaurant', 'order.items']);

        if ($status) {
            $query->where('delivery_status', $status);
        } else {
            // By default, get active (non-delivered) orders
            $query->whereNot('delivery_status', OrderLogistics::STATUS_DELIVERED);
        }

        return $query->orderByDesc('assigned_at')->get();
    }

    /**
     * Get logistics by order ID with full details.
     */
    public function getLogistics(string $orderId): ?OrderLogistics
    {
        return OrderLogistics::where('order_id', $orderId)
            ->with(['order.user', 'order.restaurant', 'order.items', 'agent'])
            ->first();
    }

    /**
     * Customer confirms delivery receipt.
     */
    public function confirmDelivery(OrderLogistics $logistics): OrderLogistics
    {
        if ($logistics->delivery_status !== OrderLogistics::STATUS_ON_THE_WAY) {
            throw new \InvalidArgumentException('Can only confirm delivery for ON_THE_WAY orders');
        }

        return $this->updateDeliveryStatus($logistics, OrderLogistics::STATUS_DELIVERED);
    }
}
