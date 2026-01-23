<?php

namespace App\Policies;

use App\Models\Restaurant;
use App\Models\User;

class RestaurantPolicy
{
    /**
     * Determine if the user can view any restaurants.
     */
    public function viewAny(User $user): bool
    {
        return true; // Public viewing
    }

    /**
     * Determine if the user can view the restaurant.
     */
    public function view(User $user, Restaurant $restaurant): bool
    {
        return true; // Public viewing
    }

    /**
     * Determine if the user can create restaurants.
     */
    public function create(User $user): bool
    {
        return $user->role === 'restaurant' || $user->role === 'admin';
    }

    /**
     * Determine if the user can update the restaurant.
     */
    public function update(User $user, Restaurant $restaurant): bool
    {
        return $user->id === $restaurant->owner_id || $user->role === 'admin';
    }

    /**
     * Determine if the user can delete the restaurant.
     */
    public function delete(User $user, Restaurant $restaurant): bool
    {
        return $user->id === $restaurant->owner_id || $user->role === 'admin';
    }

    /**
     * Determine if the user can view agents for a restaurant.
     */
    public function viewAgents(User $user, Restaurant $restaurant): bool
    {
        return $user->id === $restaurant->owner_id || $user->role === 'admin';
    }

    /**
     * Determine if the user can manage agents for a restaurant.
     */
    public function manageAgents(User $user, Restaurant $restaurant): bool
    {
        return $user->id === $restaurant->owner_id || $user->role === 'admin';
    }

    /**
     * Determine if the user can view deliveries for a restaurant.
     */
    public function viewDeliveries(User $user, Restaurant $restaurant): bool
    {
        return $user->id === $restaurant->owner_id || $user->role === 'admin';
    }

    /**
     * Determine if the user can manage deliveries for a restaurant.
     */
    public function manageDeliveries(User $user, Restaurant $restaurant): bool
    {
        return $user->id === $restaurant->owner_id || $user->role === 'admin';
    }
}

