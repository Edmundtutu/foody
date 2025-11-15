<?php

namespace App\Policies;

use App\Models\Dish;
use App\Models\User;

class DishPolicy
{
    /**
     * Determine if the user can view any dishes.
     */
    public function viewAny(User $user): bool
    {
        return true; // Public viewing
    }

    /**
     * Determine if the user can view the dish.
     */
    public function view(User $user, Dish $dish): bool
    {
        return true; // Public viewing
    }

    /**
     * Determine if the user can create dishes.
     */
    public function create(User $user, Dish $dish = null): bool
    {
        // Check if user owns the restaurant
        if ($dish && $dish->restaurant) {
            return $user->id === $dish->restaurant->owner_id || $user->role === 'admin';
        }
        
        return $user->role === 'restaurant' || $user->role === 'admin';
    }

    /**
     * Determine if the user can update the dish.
     */
    public function update(User $user, Dish $dish): bool
    {
        return $user->id === $dish->restaurant->owner_id || $user->role === 'admin';
    }

    /**
     * Determine if the user can delete the dish.
     */
    public function delete(User $user, Dish $dish): bool
    {
        return $user->id === $dish->restaurant->owner_id || $user->role === 'admin';
    }
}

