<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DishResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Ensure images is always an array, even if stored as JSON string
        $images = $this->images;
        if (is_string($images)) {
            $decoded = json_decode($images, true);
            $images = is_array($decoded) ? $decoded : [];
        }
        if (!is_array($images)) {
            $images = [];
        }

        // Ensure tags is always an array
        $tags = $this->tags;
        if (is_string($tags)) {
            $decoded = json_decode($tags, true);
            $tags = is_array($decoded) ? $decoded : [];
        }
        if (!is_array($tags)) {
            $tags = [];
        }

        return [
            'id' => $this->id,
            'restaurant_id' => $this->restaurant_id,
            'category_id' => $this->category_id,
            'name' => $this->name,
            'description' => $this->description,
            'price' => $this->price,
            'unit' => $this->unit,
            'available' => $this->available,
            'images' => $images,
            'tags' => $tags,
            'category' => new MenuCategoryResource($this->whenLoaded('category')),
            'restaurant' => new RestaurantResource($this->whenLoaded('restaurant')),
            'options' => DishOptionResource::collection($this->whenLoaded('options')),
            'reviews' => ReviewResource::collection($this->whenLoaded('reviews')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
