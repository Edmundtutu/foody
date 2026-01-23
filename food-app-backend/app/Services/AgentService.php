<?php

namespace App\Services;

use App\Models\Agent;
use App\Models\Restaurant;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class AgentService
{
    /**
     * Create a new agent for a restaurant.
     */
    public function create(Restaurant $restaurant, array $data): Agent
    {
        return DB::transaction(function () use ($restaurant, $data) {
            return $restaurant->agents()->create([
                'nin' => $data['nin'],
                'name' => $data['name'],
                'phone_number' => $data['phone_number'],
                'fleet_kind' => $data['fleet_kind'] ?? Agent::FLEET_MOTORCYCLE,
                'plate_number' => $data['plate_number'] ?? null,
                'photo' => $data['photo'] ?? null,
                'user_id' => $data['user_id'] ?? null,
                'status' => Agent::STATUS_PENDING,
                'is_available' => false,
                'current_load' => 0,
            ]);
        });
    }

    /**
     * Update an existing agent.
     */
    public function update(Agent $agent, array $data): Agent
    {
        $agent->update([
            'nin' => $data['nin'] ?? $agent->nin,
            'name' => $data['name'] ?? $agent->name,
            'phone_number' => $data['phone_number'] ?? $agent->phone_number,
            'fleet_kind' => $data['fleet_kind'] ?? $agent->fleet_kind,
            'plate_number' => $data['plate_number'] ?? $agent->plate_number,
            'photo' => $data['photo'] ?? $agent->photo,
        ]);

        return $agent->fresh();
    }

    /**
     * Activate an agent (set status to active).
     */
    public function activate(Agent $agent): Agent
    {
        $agent->update(['status' => Agent::STATUS_ACTIVE]);
        return $agent->fresh();
    }

    /**
     * Suspend an agent (set status to suspended, make unavailable).
     */
    public function suspend(Agent $agent): Agent
    {
        $agent->update([
            'status' => Agent::STATUS_SUSPENDED,
            'is_available' => false,
        ]);
        return $agent->fresh();
    }

    /**
     * Set agent to pending status.
     */
    public function setPending(Agent $agent): Agent
    {
        $agent->update([
            'status' => Agent::STATUS_PENDING,
            'is_available' => false,
        ]);
        return $agent->fresh();
    }

    /**
     * Toggle agent availability (only works for active agents).
     */
    public function toggleAvailability(Agent $agent): Agent
    {
        if (!$agent->isActive()) {
            throw new \InvalidArgumentException('Cannot toggle availability for non-active agent');
        }

        $agent->update(['is_available' => !$agent->is_available]);
        return $agent->fresh();
    }

    /**
     * Set agent as available.
     */
    public function setAvailable(Agent $agent, bool $available = true): Agent
    {
        if (!$agent->isActive() && $available) {
            throw new \InvalidArgumentException('Cannot set non-active agent as available');
        }

        $agent->update(['is_available' => $available]);
        return $agent->fresh();
    }

    /**
     * Get all agents for a restaurant with their current load.
     */
    public function getForRestaurant(Restaurant $restaurant): Collection
    {
        return $restaurant->agents()
            ->withCount(['activeLogistics as active_deliveries'])
            ->orderBy('status')
            ->orderBy('is_available', 'desc')
            ->orderBy('current_load')
            ->get();
    }

    /**
     * Get available agents for a restaurant, sorted by workload.
     */
    public function getAvailable(Restaurant $restaurant, int $maxLoad = 3): Collection
    {
        return $restaurant->agents()
            ->available()
            ->where('current_load', '<', $maxLoad)
            ->orderBy('current_load')
            ->get();
    }

    /**
     * Get a single agent with relationships.
     */
    public function getAgent(string $agentId): ?Agent
    {
        return Agent::with(['restaurant', 'activeLogistics.order'])
            ->find($agentId);
    }

    /**
     * Get agent by user ID (for agent authentication).
     */
    public function getByUserId(string $userId): ?Agent
    {
        return Agent::where('user_id', $userId)
            ->with('restaurant')
            ->first();
    }

    /**
     * Delete an agent (soft delete).
     */
    public function delete(Agent $agent): bool
    {
        // Check if agent has active deliveries
        if ($agent->current_load > 0) {
            throw new \InvalidArgumentException('Cannot delete agent with active deliveries');
        }

        return $agent->delete();
    }
}
