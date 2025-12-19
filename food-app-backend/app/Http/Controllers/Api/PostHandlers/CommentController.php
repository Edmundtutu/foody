<?php

namespace App\Http\Controllers\Api\PostHandlers;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCommentRequest;
use App\Http\Requests\UpdateCommentRequest;
use App\Http\Resources\CommentResource;
use App\Models\Comment;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CommentController extends Controller
{

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        if (!$request->has('post_id')) {
            return response()->json(['message' => 'Post ID is required.'], 400);
        }

        $post = Post::findOrFail($request->post_id);
        $comments = $post->comments()->with('user')->latest()->paginate();

        return CommentResource::collection($comments);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreCommentRequest $request)
    {
        $this->authorize('create', Comment::class);

        $validated = $request->validated();

        $comment = Comment::create([
            'user_id' => Auth::id(),
            'post_id' => $validated['post_id'],
            'content' => $validated['content'],
        ]);

        return new CommentResource($comment->load('user'));
    }

    /**
     * Display the specified resource.
     */
    public function show(Comment $comment)
    {
        return new CommentResource($comment->load('user'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateCommentRequest $request, Comment $comment)
    {
        $this->authorize('update', $comment);

        $validated = $request->validated();

        $comment->update($validated);

        return new CommentResource($comment->load('user'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Comment $comment)
    {
        $this->authorize('delete', $comment);

        $comment->delete();

        return response()->noContent();
    }
}
