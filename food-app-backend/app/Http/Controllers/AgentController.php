<?php

namespace App\Http\Controllers;

use App\Http\Resources\AgentResource;
use App\Models\Agent;
use App\Models\Restaurant;
use App\Services\AgentService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class AgentController extends Controller
{
    use ApiResponseTrait;
    public function __construct(
        protected AgentService $agentService
    ) {}

    /**
     * List all agents for a restaurant.
     */
    public function index(Restaurant $restaurant): JsonResponse
    {
        Gate::authorize('viewAgents', $restaurant);

        $agents = $this->agentService->getForRestaurant($restaurant);

        return $this->success(AgentResource::collection($agents));
    }

    /**
     * Create a new agent for a restaurant.
     */
    public function store(Request $request, Restaurant $restaurant): JsonResponse
    {
        Gate::authorize('manageAgents', $restaurant);

        $validated = $request->validate([
            'nin' => 'required|string|max:50',
            'name' => 'required|string|max:255',
            'phone_number' => 'required|string|max:20',
            'fleet_kind' => 'nullable|string',
            'plate_number' => 'nullable|string|max:20',
            'photo' => 'nullable|string|max:500',
            'user_id' => 'nullable|exists:users,id',
        ]);

        $agent = $this->agentService->create($restaurant, $validated);

        return $this->success(new AgentResource($agent), 'Agent created successfully', 201);
    }

    /**
     * Get a single agent.
     */
    public function show(Agent $agent): JsonResponse
    {
        Gate::authorize('view', $agent);

        $agent->load(['restaurant', 'activeLogistics.order']);

        return $this->success(new AgentResource($agent));
    }

    /**
     * Update an agent.
     */
    public function update(Request $request, Agent $agent): JsonResponse
    {
        Gate::authorize('update', $agent);

        $validated = $request->validate([
            'nin' => 'nullable|string|max:50',
            'name' => 'nullable|string|max:255',
            'phone_number' => 'nullable|string|max:20',
            'fleet_kind' => 'nullable|string|in:BICYCLE,MOTORCYCLE,CAR,VAN,ON_FOOT',
            'plate_number' => 'nullable|string|max:20',
            'photo' => 'nullable|string|max:500',
        ]);

        $agent = $this->agentService->update($agent, $validated);

        return $this->success(new AgentResource($agent), 'Agent updated successfully');
    }

    /**
     * Update agent status (activate/suspend/deactivate).
     */
    public function updateStatus(Request $request, Agent $agent): JsonResponse
    {
        Gate::authorize('update', $agent);

        $validated = $request->validate([
            'status' => 'required|string|in:PENDING,ACTIVE,SUSPENDED',
        ]);

        $agent = match ($validated['status']) {
            'ACTIVE' => $this->agentService->activate($agent),
            'SUSPENDED' => $this->agentService->suspend($agent),
            'PENDING' => $this->agentService->setPending($agent),
        };

        return $this->success(new AgentResource($agent), 'Agent status updated');
    }

    /**
     * Toggle agent availability.
     */
    public function toggleAvailability(Agent $agent): JsonResponse
    {
        Gate::authorize('update', $agent);

        try {
            $agent = $this->agentService->toggleAvailability($agent);

            return $this->success(
                new AgentResource($agent),
                $agent->is_available ? 'Agent is now available' : 'Agent is now unavailable'
            );
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    /**
     * Delete an agent.
     */
    public function destroy(Agent $agent): JsonResponse
    {
        Gate::authorize('delete', $agent);

        try {
            $this->agentService->delete($agent);

            return $this->success(null, 'Agent deleted successfully');
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    /**
     * Me function to return Agent logged in profile
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'agent' => $request->user(),
        ]);
    }

    /**
     * Get available agents for assignment.
     */
    public function available(Restaurant $restaurant): JsonResponse
    {
        Gate::authorize('viewAgents', $restaurant);

        $agents = $this->agentService->getAvailable($restaurant);

        return $this->success(AgentResource::collection($agents));
    }
}
