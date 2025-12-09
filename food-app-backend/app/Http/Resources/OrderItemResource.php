<?php

namespace App\Http\Resources;

use App\Models\ComboSelection;
use App\Models\Dish;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $type = match ($this->orderable_type) {
            Dish::class => 'dish',
            ComboSelection::class => 'combo',
            default => 'unknown',
        };

        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'orderable_type' => $this->orderable_type,
            'orderable_id' => $this->orderable_id,
            'type' => $type,
            'dish_id' => $type === 'dish' ? $this->orderable_id : null,
            'combo_selection_id' => $type === 'combo' ? $this->orderable_id : null,
            'quantity' => $this->quantity,
            'unit_price' => $this->unit_price,
            'total_price' => $this->total_price,
            'options' => $type === 'dish' ? $this->options : null,
            'dish' => $this->when(
                $type === 'dish' && $this->relationLoaded('orderable'),
                fn () => new DishResource($this->orderable)
            ),
            'combo_selection' => $this->when(
                $type === 'combo' && $this->relationLoaded('orderable'),
                fn () => new ComboSelectionResource($this->orderable)
            ),
        ];
    }
}
