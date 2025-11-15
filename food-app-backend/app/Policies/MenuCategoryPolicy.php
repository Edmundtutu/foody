<?php

namespace App\Policies;

use App\Models\MenuCategory;
use App\Models\User;

class MenuCategoryPolicy
{
    /**
     * Determine if the user can view any menu categories.
     */
    public function viewAny(User $user): bool
    {
        return true; // Public viewing
    }

    /**
     * Determine if the user can view the menu category.
     */
    public function view(User $user, MenuCategory $menuCategory): bool
    {
        return true; // Public viewing
    }

    /**
     * Determine if the user can create menu categories.
     */
    public function create(User $user, MenuCategory $menuCategory = null): bool
    {
        // Check if user owns the restaurant
        if ($menuCategory && $menuCategory->restaurant) {
            return $user->id === $menuCategory->restaurant->owner_id || $user->role === 'admin';
        }
        
        return $user->role === 'restaurant' || $user->role === 'admin';
    }

    /**
     * Determine if the user can update the menu category.
     */
    public function update(User $user, MenuCategory $menuCategory): bool
    {
        return $user->id === $menuCategory->restaurant->owner_id || $user->role === 'admin';
    }

    /**
     * Determine if the user can delete the menu category.
     */
    public function delete(User $user, MenuCategory $menuCategory): bool
    {
        return $user->id === $menuCategory->restaurant->owner_id || $user->role === 'admin';
    }
}

