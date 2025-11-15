<?php

namespace App\Services;

use App\Events\MessageSent;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Support\Facades\DB;

class ChatService
{
    public function createConversation(array $data)
    {
        return Conversation::create($data);
    }

    public function getConversationById(string $id)
    {
        return Conversation::with(['messages.sender', 'order', 'customer', 'restaurant'])
            ->findOrFail($id);
    }

    public function sendMessage(string $conversationId, array $data)
    {
        return DB::transaction(function () use ($conversationId, $data) {
            $message = Message::create([
                'conversation_id' => $conversationId,
                'sender_id' => $data['sender_id'],
                'sender_role' => $data['sender_role'],
                'content' => $data['content'],
            ]);

            $conversation = Conversation::findOrFail($conversationId);
            $conversation->update(['last_message_at' => now()]);

            $message = $message->fresh(['sender']);

            // Broadcast the message event
            event(new MessageSent($message));

            return $message;
        });
    }

    public function getUserConversations(string $userId)
    {
        return Conversation::where('customer_id', $userId)
            ->orWhereHas('restaurant', function ($query) use ($userId) {
                $query->where('owner_id', $userId);
            })
            ->with(['order', 'messages' => function ($query) {
                $query->latest()->limit(1);
            }])
            ->latest('last_message_at')
            ->get();
    }

    public function markAsRead(string $messageId)
    {
        $message = Message::findOrFail($messageId);
        $message->update(['read_at' => now()]);

        return $message;
    }

    /**
     * Get conversations for a restaurant (vendor view)
     */
    public function getRestaurantConversations(string $restaurantId, string $ownerId)
    {
        return Conversation::where('restaurant_id', $restaurantId)
            ->whereHas('restaurant', function ($query) use ($ownerId) {
                $query->where('owner_id', $ownerId);
            })
            ->with(['order', 'customer', 'messages' => function ($query) {
                $query->latest()->limit(1);
            }])
            ->latest('last_message_at')
            ->get();
    }
}
