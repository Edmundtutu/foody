<?php

namespace App\Http\Controllers\Api\Chats;

use App\Http\Controllers\Controller;
use App\Http\Resources\ConversationResource;
use App\Services\ChatService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    use ApiResponseTrait;

    protected $chatService;

    public function __construct(ChatService $chatService)
    {
        $this->chatService = $chatService;
    }

    /**
     * Get or create conversation for an order
     * 
     * @param string $orderId
     * @return JsonResponse
     */
    public function getForOrder(string $orderId): JsonResponse
    {
        try {
            $userId = auth()->id();
            
            // Try to get existing conversation
            try {
                $conversation = $this->chatService->getConversationForOrder($orderId, $userId);
            } catch (\Symfony\Component\HttpKernel\Exception\NotFoundHttpException $e) {
                // If not found, create new one
                $conversation = $this->chatService->createConversationForOrder($orderId);
            }
            
            return $this->success(new ConversationResource($conversation));
        } catch (\Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException $e) {
            return $this->error($e->getMessage(), 403);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Explicitly create conversation for order (restaurant only)
     * 
     * @param string $orderId
     * @return JsonResponse
     */
    public function store(string $orderId): JsonResponse
    {
        try {
            $user = auth()->user();
            
            // Only restaurants can create conversations
            if ($user->role !== 'restaurant') {
                return $this->error('Only restaurant managers can create conversations', 403);
            }
            
            $conversation = $this->chatService->createConversationForOrder($orderId);
            
            return $this->success(new ConversationResource($conversation), 'Conversation created successfully', 201);
        } catch (\Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException $e) {
            return $this->error($e->getMessage(), 403);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * Mark messages as read in conversation
     * 
     * @param string $conversationId
     * @return JsonResponse
     */
    public function markAsRead(string $conversationId): JsonResponse
    {
        try {
            $userId = auth()->id();
            $updatedCount = $this->chatService->markMessagesAsRead($conversationId, $userId);
            
            return $this->success([
                'success' => true,
                'updated_count' => $updatedCount
            ], 'Messages marked as read');
        } catch (\Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException $e) {
            return $this->error($e->getMessage(), 403);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }
}
