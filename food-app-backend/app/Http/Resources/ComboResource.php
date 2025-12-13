<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ComboResource extends JsonResource
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
            'restaurant_id' => $this->restaurant_id,
            'name' => $this->name,
            'description' => $this->description,
            'pricing_mode' => $this->pricing_mode,
            'base_price' => $this->base_price,
            'available' => (bool) $this->available,
            'tags' => $this->tags,
            'images' => $this->images,
            'order_count' => $this->order_count,
            'distance' => $this->when(isset($this->distance), $this->distance),
            'delivery_time' => $this->when(isset($this->delivery_time), $this->delivery_time),
            'restaurant' => new RestaurantResource($this->whenLoaded('restaurant')),
            'groups' => ComboGroupResource::collection($this->whenLoaded('groups')),
            'selections' => ComboSelectionResource::collection($this->whenLoaded('selections')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
