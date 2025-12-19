<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Resources\Json\JsonResource;

class PostResource extends JsonResource
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
            'user' => new UserResource($this->user),
            'dish' => new DishResource($this->whenLoaded('dish')),
            'content' => $this->content,
            'images' => $this->images,
            'likes_count' => $this->whenLoaded('likes', fn()=>$this->likes->count(),0),
            'comments_count' => $this->whenLoaded('comments', fn()=>$this->comments->count(),0),
            'liked_by_user' => $this->whenLoaded('likes', fn()=>$this->likes->where('user_id', Auth::id())->isNotEmpty(), false),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
