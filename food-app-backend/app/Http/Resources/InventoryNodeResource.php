<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InventoryNodeResource extends JsonResource
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
            'category_id' => $this->category_id,
            'entity_type' => $this->entity_type,
            'entity_id' => $this->entity_id,
            'display_name' => $this->display_name,
            'x' => $this->x,
            'y' => $this->y,
            'color_code' => $this->color_code,
            'available' => $this->available,
            'metadata' => $this->metadata,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'deleted_at' => $this->deleted_at?->toISOString(),
            'category' => $this->whenLoaded('category', function () {
                return [
                    'id' => $this->category->id,
                    'name' => $this->category->name,
                    'display_order' => $this->category->display_order,
                    'color_code' => $this->category->color_code,
                ];
            }),
        ];
    }
}
