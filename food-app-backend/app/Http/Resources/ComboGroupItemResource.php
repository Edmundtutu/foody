<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ComboGroupItemResource extends JsonResource
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
            'combo_group_id' => $this->combo_group_id,
            'dish_id' => $this->dish_id,
            'extra_price' => $this->extra_price,
            'dish' => new DishResource($this->whenLoaded('dish')),
        ];
    }
}
