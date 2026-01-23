<?php

namespace App\Policies;

use App\Models\Agent;
use App\Models\Order;
use App\Models\OrderLogistics;
use App\Models\Restaurant;
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
            || $this->isAssignedAgent($user, $order)
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

    /**
     * Determine if the user can manage delivery for an order (assign/unassign agents).
     */
    public function manageDelivery(User $user, Order $order): bool
    {
        return $user->role === 'restaurant' && $user->id === $order->restaurant->owner_id;
    }

    /**
     * Determine if the user can view delivery tracking for an order.
     */
    public function viewTracking(User $user, Order $order): bool
    {
        return $user->id === $order->user_id 
            || ($user->role === 'restaurant' && $user->id === $order->restaurant->owner_id)
            || $this->isAssignedAgent($user, $order)
            || $user->role === 'admin';
    }

    /**
     * Determine if the user can confirm delivery receipt.
     */
    public function confirmDelivery(User $user, Order $order): bool
    {
        // Only the customer who placed the order can confirm delivery
        return $user->id === $order->user_id;
    }

    /**
     * Determine if the user can view deliveries for a restaurant.
     */
    public function viewDeliveries(User $user, Restaurant $restaurant): bool
    {
        return $user->role === 'restaurant' && $user->id === $restaurant->owner_id;
    }

    /**
     * Determine if the user can update delivery status (for agents).
     */
    public function updateDeliveryStatus(User $user, OrderLogistics $logistics): bool
    {
        // Assigned agent can update status
        if ($logistics->agent && $logistics->agent->user_id === $user->id) {
            return true;
        }

        // Restaurant owner can also update status
        $order = $logistics->order;
        return $user->role === 'restaurant' && $user->id === $order->restaurant->owner_id;
    }

    /**
     * Check if user is the assigned agent for this order.
     */
    protected function isAssignedAgent(User $user, Order $order): bool
    {
        if (!$order->logistics) {
            return false;
        }

        $agent = Agent::where('user_id', $user->id)->first();
        return $agent && $order->logistics->agent_id === $agent->id;
    }
}