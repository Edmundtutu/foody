<?php

namespace App\Services;

use App\Events\MessageSent;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\Order;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ChatService
{
    /**
     * Create or get conversation for an order
     * 
     * @param string $orderId
     * @return Conversation
     */
    public function createConversationForOrder(string $orderId): Conversation
    {
        $order = Order::with('restaurant')->findOrFail($orderId);
        
        // Check if conversation already exists
        $conversation = Conversation::where('order_id', $orderId)->first();
        
        if ($conversation) {
            return $conversation->load(['messages.sender', 'order', 'customer', 'restaurant']);
        }
        
        // Create new conversation
        $conversation = Conversation::create([
            'order_id' => $orderId,
            'customer_id' => $order->user_id,
            'restaurant_id' => $order->restaurant_id,
            'status' => 'active',
            'last_message_at' => now(),
        ]);
        
        return $conversation->load(['messages.sender', 'order', 'customer', 'restaurant']);
    }

    /**
     * Get conversation for order with authorization check
     * 
     * @param string $orderId
     * @param string $userId
     * @return Conversation
     * @throws AccessDeniedHttpException
     */
    public function getConversationForOrder(string $orderId, string $userId): Conversation
    {
        $order = Order::with('restaurant')->findOrFail($orderId);
        $conversation = Conversation::where('order_id', $orderId)
            ->with(['messages.sender', 'order', 'customer', 'restaurant'])
            ->first();
        
        if (!$conversation) {
            throw new NotFoundHttpException('Conversation not found for this order');
        }
        
        // Verify user has access (is restaurant owner or is customer)
        $user = auth()->user();
        $isCustomer = $conversation->customer_id === $userId;
        $isRestaurantOwner = $order->restaurant && $order->restaurant->owner_id === $userId;
        
        if (!$isCustomer && !$isRestaurantOwner) {
            throw new AccessDeniedHttpException('You do not have access to this conversation');
        }
        
        return $conversation;
    }

    /**
     * Send a message in a conversation
     * 
     * @param string $conversationId
     * @param string $userId
     * @param string $content
     * @return Message
     * @throws AccessDeniedHttpException
     */
    public function sendMessage(string $conversationId, string $userId, string $content): Message
    {
        return DB::transaction(function () use ($conversationId, $userId, $content) {
            $conversation = Conversation::with(['order.restaurant'])->findOrFail($conversationId);
            
            // Verify user has access to conversation
            $user = auth()->user();
            $isCustomer = $conversation->customer_id === $userId;
            $isRestaurantOwner = $conversation->order->restaurant && $conversation->order->restaurant->owner_id === $userId;
            
            if (!$isCustomer && !$isRestaurantOwner) {
                throw new AccessDeniedHttpException('You do not have access to this conversation');
            }
            
            // Determine sender_role from authenticated user
            $senderRole = $user->role; // Must be 'restaurant' or 'customer'
            
            $message = Message::create([
                'conversation_id' => $conversationId,
                'sender_id' => $userId,
                'sender_role' => $senderRole,
                'content' => $content,
                'created_at' => now(),
            ]);
            
            // Update conversation's last_message_at
            $conversation->update(['last_message_at' => now()]);
            
            $message = $message->fresh(['sender']);
            
            // Broadcast the message event
            event(new MessageSent($message));
            
            return $message;
        });
    }

    /**
     * Mark all messages from other user as read in conversation
     * 
     * @param string $conversationId
     * @param string $userId
     * @return int Number of messages marked as read
     * @throws AccessDeniedHttpException
     */
    public function markMessagesAsRead(string $conversationId, string $userId): int
    {
        $conversation = Conversation::with(['order.restaurant'])->findOrFail($conversationId);
        
        // Verify user has access to conversation
        $user = auth()->user();
        $isCustomer = $conversation->customer_id === $userId;
        $isRestaurantOwner = $conversation->order->restaurant && $conversation->order->restaurant->owner_id === $userId;
        
        if (!$isCustomer && !$isRestaurantOwner) {
            throw new AccessDeniedHttpException('You do not have access to this conversation');
        }
        
        // Mark all messages from OTHER user as read
        $updated = Message::where('conversation_id', $conversationId)
            ->where('sender_id', '!=', $userId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
        
        return $updated;
    }
}
