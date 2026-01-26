<?php

namespace App\Events;

use App\Models\ComboSelection;
use App\Models\Dish;
use App\Models\Order;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $order;

    /**
     * Create a new event instance.
     */
    public function __construct(Order $order)
    {
        // Load order with polymorphic relationships properly
        // OrderItem uses orderable (morphTo) relationship, not direct dish relationship
        $this->order = $order->load([
            'user',
            'restaurant',
            'items.orderable' => function (MorphTo $morphTo) {
                $morphTo->morphWith([
                    Dish::class => ['options'],
                    ComboSelection::class => ['items.dish.options', 'combo'],
                ]);
            },
        ]);
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('restaurant.'.$this->order->restaurant_id),
            new PrivateChannel('user.'.$this->order->user_id),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'order.status.updated';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->order->id,
            'restaurant_id' => $this->order->restaurant_id,
            'user_id' => $this->order->user_id,
            'status' => $this->order->status,
            'total' => $this->order->total,
            'updated_at' => $this->order->updated_at->toIso8601String(),
        ];
    }
}

