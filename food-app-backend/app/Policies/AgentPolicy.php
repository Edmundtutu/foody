<?php

namespace App\Policies;

use App\Models\Agent;
use App\Models\User;

class AgentPolicy
{
    /**
     * Determine if the user can view the agent.
     */
    public function view(User $user, Agent $agent): bool
    {
        // Restaurant owner can view their agents
        return $agent->restaurant->owner_id === $user->id || $user->role === 'admin';
    }

    /**
     * Determine if the user can update the agent.
     */
    public function update(User $user, Agent $agent): bool
    {
        return $agent->restaurant->owner_id === $user->id || $user->role === 'admin';
    }

    /**
     * Determine if the user can delete the agent.
     */
    public function delete(User $user, Agent $agent): bool
    {
        return $agent->restaurant->owner_id === $user->id || $user->role === 'admin';
    }
}
