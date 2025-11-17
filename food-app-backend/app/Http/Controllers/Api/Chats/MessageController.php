<?php

namespace App\Http\Controllers\Api\Chats;

use App\Http\Controllers\Controller;
use App\Http\Requests\MessageRequest;
use App\Http\Resources\MessageResource;
use App\Services\ChatService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;

class MessageController extends Controller
{
    use ApiResponseTrait;

    protected $chatService;

    public function __construct(ChatService $chatService)
    {
        $this->chatService = $chatService;
    }

    /**
     * Send a message in a conversation
     * 
     * @param MessageRequest $request
     * @param string $conversationId
     * @return JsonResponse
     */
    public function store(MessageRequest $request, string $conversationId): JsonResponse
    {
        try {
            $userId = auth()->id();
            $content = $request->validated()['content'];
            
            $message = $this->chatService->sendMessage($conversationId, $userId, $content);
            
            return $this->success(new MessageResource($message), 'Message sent successfully', 201);
        } catch (\Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException $e) {
            return $this->error($e->getMessage(), 403);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Get paginated messages for conversation (optional endpoint)
     * 
     * @param string $conversationId
     * @return JsonResponse
     */
    public function index(string $conversationId): JsonResponse
    {
        try {
            // This is optional - messages are typically loaded with conversation
            // But can be useful for pagination if conversations grow large
            $conversation = \App\Models\Conversation::with(['order.restaurant'])->findOrFail($conversationId);
            
            // Verify user has access
            $userId = auth()->id();
            $user = auth()->user();
            $isCustomer = $conversation->customer_id === $userId;
            $isRestaurantOwner = $conversation->order->restaurant && $conversation->order->restaurant->owner_id === $userId;
            
            if (!$isCustomer && !$isRestaurantOwner) {
                return $this->error('You do not have access to this conversation', 403);
            }
            
            $messages = $conversation->messages()
                ->with('sender')
                ->orderBy('created_at', 'asc')
                ->paginate(50);
            
            return $this->success(MessageResource::collection($messages));
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }
}
