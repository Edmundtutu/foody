<?php

namespace App\Http\Controllers\Api\PostHandlers;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use Illuminate\Support\Facades\Auth;

class CommentLikeController extends Controller
{
    public function toggle(Comment $comment)
    {
        $userId = Auth::id();

        if ($comment->likes()->where('user_id', $userId)->exists()) {
            $comment->likes()->where('user_id', $userId)->delete();
        } else {
            $comment->likes()->create(['user_id' => $userId]);
        }

        $newLikesCount = $comment->likes()->count();
        return response()->json(['message' => 'Like status updated', 'likes_count' => $newLikesCount]);
    }
}
