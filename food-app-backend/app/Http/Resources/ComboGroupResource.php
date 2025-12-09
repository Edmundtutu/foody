<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ComboGroupResource extends JsonResource
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
            'combo_id' => $this->combo_id,
            'name' => $this->name,
            'allowed_min' => $this->allowed_min,
            'allowed_max' => $this->allowed_max,
            'suggested_categories' => MenuCategoryResource::collection($this->whenLoaded('categoryHints')),
            'items' => ComboGroupItemResource::collection($this->whenLoaded('items')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
