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
    $conversation = Conversation::with('order.restaurant')->find($conversationId);
    
    if (!$conversation) {
        return false;
    }
    
    // Check if user is the customer
    if ($user->id === $conversation->customer_id) {
        return true;
    }
    
    // Check if user is the restaurant manager (owner of the restaurant)
    if ($conversation->order && $conversation->order->restaurant) {
        return $user->id === $conversation->order->restaurant->owner_id;
    }
    
    return false;
});

// Private channel for restaurant updates (order status, etc.)
Broadcast::channel('restaurant.{restaurantId}', function ($user, $restaurantId) {
    // User can listen if they own this restaurant
    return Restaurant::where('id', $restaurantId)
                     ->where('owner_id', $user->id)
                     ->exists();
});

// Private channel for user notifications (order status updates for customers)
Broadcast::channel('user.{userId}', function ($user, $userId) {
    return $user->id === $userId;
});
