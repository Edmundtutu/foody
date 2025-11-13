<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConversationResource extends JsonResource
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
            'customer_id' => $this->customer_id,
            'restaurant_id' => $this->restaurant_id,
            'status' => $this->status,
            'last_message_at' => $this->last_message_at,
            'customer' => new UserResource($this->whenLoaded('customer')),
            'restaurant' => new RestaurantResource($this->whenLoaded('restaurant')),
            'order' => new OrderResource($this->whenLoaded('order')),
            'messages' => MessageResource::collection($this->whenLoaded('messages')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
