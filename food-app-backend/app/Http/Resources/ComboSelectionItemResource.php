<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ComboSelectionItemResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'=> $this->id,
            'combo_selection_id'=>$this->combo_selection_id,
            'dish_id'=> $this->dish_id,
            'options'=> $this->options,
            'price'=>$this->price,
            'dish' => new DishResource($this->whenLoaded('dish')),
        ];
    }
}
