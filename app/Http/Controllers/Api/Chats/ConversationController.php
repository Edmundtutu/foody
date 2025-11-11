<?php

namespace App\Http\Controllers\Api\Chats;

use App\Http\Controllers\Controller;
use App\Http\Resources\ConversationResource;
use App\Services\ChatService;
use App\Traits\ApiResponseTrait;

class ConversationController extends Controller
{
    use ApiResponseTrait;

    protected $chatService;

    public function __construct(ChatService $chatService)
    {
        $this->chatService = $chatService;
        $this->middleware('auth:sanctum');
    }

    public function index()
    {
        $userId = auth()->id();
        $conversations = $this->chatService->getUserConversations($userId);

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
