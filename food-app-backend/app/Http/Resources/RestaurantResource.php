<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RestaurantResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Calculate rating from reviews if loaded
        $rating = null;
        $totalReviews = 0;
        if ($this->relationLoaded('reviews')) {
            $reviews = $this->reviews;
            $totalReviews = $reviews->count();
            if ($totalReviews > 0) {
                $rating = round($reviews->avg('rating'), 1);
            }
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'phone' => $this->phone,
            'email' => $this->email,
            'address' => $this->address,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'verification_status' => $this->verification_status,
            'config' => $this->config,
            'rating' => $rating,
            'total_reviews' => $totalReviews,
            'distance' => property_exists($this->resource, 'distance') ? $this->distance : null,
            'owner' => new UserResource($this->whenLoaded('owner')),
            'categories' => MenuCategoryResource::collection($this->whenLoaded('categories')),
            'dishes' => DishResource::collection($this->whenLoaded('dishes')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
