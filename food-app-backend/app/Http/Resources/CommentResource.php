<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Resources\Json\JsonResource;

class CommentResource extends JsonResource
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
            'body' => $this->body,
            'user' => new UserResource($this->whenLoaded('user')),
            'parent_id' => $this->parent_id,
            'depth' => $this->depth,
            'likes_count' => $this->whenLoaded('likes', fn()=>$this->likes->count(),0),
            'replies_count' => $this->whenLoaded('replies', fn()=>$this->replies->count(),0),
            'liked_by_user' => $this->whenLoaded('likes', fn()=>$this->likes->where('user_id', Auth::id())->isNotEmpty(), false),
            'replies' => CommentResource::collection($this->whenLoaded('replies')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
