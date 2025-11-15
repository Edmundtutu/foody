<?php

namespace App\Http\Controllers\Api\Chats;

use App\Http\Controllers\Controller;
use App\Http\Requests\MessageRequest;
use App\Http\Resources\MessageResource;
use App\Services\ChatService;
use App\Traits\ApiResponseTrait;

class MessageController extends Controller
{
    use ApiResponseTrait;

    protected $chatService;

    public function __construct(ChatService $chatService)
    {
        $this->chatService = $chatService;
    }

    public function store(MessageRequest $request, $conversationId)
    {
        $data = $request->validated();
        $data['sender_id'] = auth()->id();

        $message = $this->chatService->sendMessage($conversationId, $data);

        return $this->success(new MessageResource($message), 'Message sent successfully', 201);
    }
}
