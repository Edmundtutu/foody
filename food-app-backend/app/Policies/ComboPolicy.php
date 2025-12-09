<?php

namespace App\Policies;

use App\Models\Combo;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class ComboPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(?User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(?User $user, Combo $combo): bool
    {
        return true;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $this->canManage($user);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Combo $combo): bool
    {
        if (!$this->canManage($user)) {
            return false;
        }

        // Admin can update any combo
        if ($user->role === 'admin') {
            return true;
        }

        // Restaurant owner can only update their own restaurant's combos
        return $combo->restaurant->owner_id === $user->id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Combo $combo): bool
    {
        if (!$this->canManage($user)) {
            return false;
        }

        // Admin can delete any combo
        if ($user->role === 'admin') {
            return true;
        }

        // Restaurant owner can only delete their own restaurant's combos
        return $combo->restaurant->owner_id === $user->id;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Combo $combo): bool
    {
        return $user->role === 'admin';
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Combo $combo): bool
    {
        return $user->role === 'admin';
    }

    protected function canManage(User $user): bool
    {
        return in_array($user->role, ['restaurant', 'admin'], true);
    }
}
