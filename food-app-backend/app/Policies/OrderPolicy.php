<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    /**
     * Determine if the user can view any orders.
     */
    public function viewAny(User $user): bool
    {
        return true; // Users can view their own orders, vendors can view their restaurant orders
    }

    /**
     * Determine if the user can view the order.
     */
    public function view(User $user, Order $order): bool
    {
        // User can view their own orders, or restaurant owner can view orders for their restaurant
        return $user->id === $order->user_id 
            || ($user->role === 'restaurant' && $user->id === $order->restaurant->owner_id)
            || $user->role === 'admin';
    }

    /**
     * Determine if the user can create orders.
     */
    public function create(User $user): bool
    {
        return $user->role === 'customer' || $user->role === 'admin';
    }

    /**
     * Determine if the user can update the order.
     */
    public function update(User $user, Order $order): bool
    {
        // Customer can update their own pending orders, vendor can update orders for their restaurant
        if ($user->role === 'customer' && $user->id === $order->user_id) {
            return $order->status === 'pending'; // Only pending orders can be updated by customer
        }
        
        if ($user->role === 'restaurant' && $user->id === $order->restaurant->owner_id) {
            return true; // Vendor can update status of their restaurant's orders
        }
        
        return $user->role === 'admin';
    }

    /**
     * Determine if the user can delete the order.
     */
    public function delete(User $user, Order $order): bool
    {
        // Orders should not be deleted, only cancelled
        return false;
    }
}

