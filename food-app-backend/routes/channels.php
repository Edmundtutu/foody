<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\Conversation;
use App\Models\Restaurant;

/*
|--------------------------------------------------------------------------
| Broadcast Channels
|--------------------------------------------------------------------------
|
| Here you may register all of the event broadcasting channels that your
| application supports. The given channel authorization callbacks are
| used to check if an authenticated user can listen to the channel.
|
*/

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Private channel for conversation messages
Broadcast::channel('conversation.{conversationId}', function ($user, $conversationId) {
    $conversation = Conversation::find($conversationId);
    
    if (!$conversation) {
        return false;
    }
    
    // User can listen if they're the customer or if they own the restaurant
    return $conversation->customer_id === $user->id || 
           Restaurant::where('id', $conversation->restaurant_id)
                     ->where('user_id', $user->id)
                     ->exists();
});

// Private channel for restaurant updates (order status, etc.)
Broadcast::channel('restaurant.{restaurantId}', function ($user, $restaurantId) {
    // User can listen if they own this restaurant
    return Restaurant::where('id', $restaurantId)
                     ->where('user_id', $user->id)
                     ->exists();
});

// Private channel for user notifications (order status updates for customers)
Broadcast::channel('user.{userId}', function ($user, $userId) {
    return $user->id === $userId;
});
