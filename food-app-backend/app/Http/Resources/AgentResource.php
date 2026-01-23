<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AgentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Map database status to frontend-compatible values
        $statusMap = [
            'active' => 'ACTIVE',
            'suspended' => 'SUSPENDED',
            'inactive' => 'PENDING',
            // Already uppercase values pass through
            'ACTIVE' => 'ACTIVE',
            'SUSPENDED' => 'SUSPENDED',
            'PENDING' => 'PENDING',
        ];

        // Map database fleet_kind to frontend-compatible values
        $fleetMap = [
            'motorbike' => 'MOTORCYCLE',
            'vehicle' => 'CAR',
            'bicycle' => 'BICYCLE',
            'foot' => 'ON_FOOT',
            // Already uppercase values pass through
            'MOTORCYCLE' => 'MOTORCYCLE',
            'CAR' => 'CAR',
            'BICYCLE' => 'BICYCLE',
            'VAN' => 'VAN',
            'ON_FOOT' => 'ON_FOOT',
        ];

        return [
            'id' => $this->id,
            'restaurant_id' => $this->restaurant_id,
            'user_id' => $this->user_id,
            'nin' => $this->nin,
            'name' => $this->name,
            'phone_number' => $this->phone_number,
            'fleet_kind' => $fleetMap[$this->fleet_kind] ?? $this->fleet_kind,
            'plate_number' => $this->plate_number,
            'photo' => $this->photo,
            'status' => $statusMap[$this->status] ?? $this->status,
            'is_available' => $this->is_available,
            'current_load' => $this->current_load,
            'active_deliveries' => $this->whenCounted('active_deliveries', $this->active_deliveries),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),

            // Relations
            'restaurant' => new RestaurantResource($this->whenLoaded('restaurant')),
            'active_logistics' => OrderLogisticsResource::collection($this->whenLoaded('activeLogistics')),
        ];
    }
}
