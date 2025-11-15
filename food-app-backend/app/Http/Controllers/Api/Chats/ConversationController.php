<?php

namespace App\Http\Controllers\Api\Chats;

use App\Http\Controllers\Controller;
use App\Http\Resources\ConversationResource;
use App\Services\ChatService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    use ApiResponseTrait;

    protected $chatService;

    public function __construct(ChatService $chatService)
    {
        $this->chatService = $chatService;
    }

    public function index(Request $request)
    {
        $userId = auth()->id();
        $user = auth()->user();
        $restaurantId = $request->query('restaurant_id');

        // If restaurant_id is provided and user is a restaurant owner, filter by restaurant
        if ($restaurantId && $user->role === 'restaurant') {
            $conversations = $this->chatService->getRestaurantConversations($restaurantId, $userId);
        } else {
            $conversations = $this->chatService->getUserConversations($userId);
        }

        return $this->success(ConversationResource::collection($conversations));
    }

    public function show($id)
    {
        $conversation = $this->chatService->getConversationById($id);

        return $this->success(new ConversationResource($conversation));
    }

    public function store()
    {
        return $this->error('Conversations are created automatically with orders', 400);
    }
}
