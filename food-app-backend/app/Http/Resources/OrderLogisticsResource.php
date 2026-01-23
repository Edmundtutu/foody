<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderLogisticsResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'agent_id' => $this->agent_id,
            'pickup_address' => $this->pickup_address,
            'delivery_address' => $this->delivery_address,
            'delivery_status' => $this->delivery_status,
            'assigned_at' => $this->assigned_at?->toIso8601String(),
            'picked_up_at' => $this->picked_up_at?->toIso8601String(),
            'delivered_at' => $this->delivered_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),

            // Computed
            'is_assigned' => $this->isAssigned(),
            'is_delivered' => $this->isDelivered(),

            // Relations
            'order' => new OrderResource($this->whenLoaded('order')),
            'agent' => new AgentResource($this->whenLoaded('agent')),
        ];
    }
}
