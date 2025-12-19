<?php

namespace App\Http\Controllers\Api\PostHandlers;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreLikeRequest;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LikeController extends Controller
{

    /**
     * Like a resource.
     */
    public function store(StoreLikeRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $modelType = 'App\\Models\\' . ucfirst($validated['likeable_type']);

        if (!class_exists($modelType)) {
            return response()->json(['message' => 'Invalid likeable type provided.'], 400);
        }

        try {
            $model = $modelType::findOrFail($validated['likeable_id']);
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'The specified resource to like does not exist.'], 404);
        }

        $like = $model->likes()->where('user_id', Auth::id())->first();

        if ($like) {
            return response()->json(['message' => 'You have already liked this item.'], 409);
        }

        $model->likes()->create(['user_id' => Auth::id()]);

        return response()->json(['message' => 'Successfully liked the item.'], 201);
    }

    /**
     * Unlike a resource.
     */
    public function destroy(Request $request): JsonResponse
    {
        $request->validate([
            'likeable_id' => ['required', 'ulid'],
            'likeable_type' => ['required', 'string', 'in:post,comment'],
        ]);

        $modelType = 'App\\Models\\' . ucfirst($request->input('likeable_type'));

        if (!class_exists($modelType)) {
            return response()->json(['message' => 'Invalid likeable type provided.'], 400);
        }

        try {
            $model = $modelType::findOrFail($request->input('likeable_id'));
        } catch (ModelNotFoundException $e) {
            return response()->json(['message' => 'The specified resource to unlike does not exist.'], 404);
        }

        $like = $model->likes()->where('user_id', Auth::id())->first();

        if (!$like) {
            return response()->json(['message' => 'You have not liked this item.'], 404);
        }

        $like->delete();

        return response()->json(null, 204);
    }
}
