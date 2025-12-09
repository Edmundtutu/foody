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
            'name' => $this->name,
            'description' => $this->description,
            'pricing_mode' => $this->pricing_mode,
            'base_price' => $this->base_price,
            'groups' => ComboGroupResource::collection($this->whenLoaded('groups')),
            'selections' => ComboSelectionResource::collection($this->whenLoaded('selections')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
