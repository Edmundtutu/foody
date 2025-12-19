<?php

namespace App\Http\Controllers\Api\PostHandlers;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\Comment;
use App\Http\Resources\CommentResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class PostCommentController extends Controller
{
    /**
     * Display a listing of the comments for a post.
     */
    public function index(Post $post)
    {
        return CommentResource::collection(
            $post->comments()
                ->whereNull('parent_id') // Only top-level comments
                ->with(['user', 'replies.user', 'replies.replies.user', 'likes'])
                ->latest()
                ->paginate(10)
        );
    }

    /**
     * Store a newly created comment for a post in storage.
     */
    public function store(Request $request, Post $post)
    {
        $request->validate([
            'body' => 'required|string',
            'parent_id' => 'nullable|ulid|exists:comments,id'
        ]);

        $data = [
            'user_id' => Auth::id(),
            'body' => $request->input('body')
        ];

        if ($request->has('parent_id')) {
            $parentComment = Comment::find($request->input('parent_id'));
            if ($parentComment && $parentComment->commentable_id === $post->getKey()) {
                $data['parent_id'] = $parentComment->getKey();
                $data['depth'] = $parentComment->depth + 1;
            }
        }

        $comment = $post->comments()->create($data);

        return response()->json(new CommentResource($comment->load(['user', 'replies', 'likes'])), 201);
    }

    /**
     * Remove the specified comment from storage.
     */
    public function destroy(Post $post, Comment $comment)
    {
        // Ensure the comment belongs to the post
        if ($comment->commentable_id !== $post->getKey() || $comment->commentable_type !== Post::class) {
            abort(404, 'Comment not found on this post.');
        }

        $this->authorize('delete', $comment);

        $comment->delete();

        return response()->noContent();
    }
}
