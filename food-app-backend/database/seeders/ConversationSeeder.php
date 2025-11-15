<?php

namespace Database\Seeders;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Seeder;

class ConversationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $orders = Order::with(['user', 'restaurant'])->get();

        // Create conversations for some orders (about half)
        $ordersWithConversations = $orders->random(min(ceil($orders->count() / 2), $orders->count()));

        foreach ($ordersWithConversations as $order) {
            $conversation = Conversation::factory()->create([
                'order_id' => $order->id,
                'customer_id' => $order->user_id,
                'restaurant_id' => $order->restaurant_id,
            ]);

            // Create 2-5 messages per conversation
            $messageCount = rand(2, 5);
            
            for ($i = 0; $i < $messageCount; $i++) {
                $senderRole = $i % 2 === 0 ? 'customer' : 'restaurant';
                $senderId = $senderRole === 'customer' ? $order->user_id : $order->restaurant->owner_id;

                Message::factory()->create([
                    'conversation_id' => $conversation->id,
                    'sender_id' => $senderId,
                    'sender_role' => $senderRole,
                    'created_at' => now()->subMinutes($messageCount - $i),
                ]);
            }

            // Update last_message_at
            $lastMessage = $conversation->messages()->latest('created_at')->first();
            if ($lastMessage) {
                $conversation->update(['last_message_at' => $lastMessage->created_at]);
            }
        }
    }
}
