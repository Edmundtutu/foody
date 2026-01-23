<?php

namespace App\Http\Controllers;

use App\Http\Resources\OrderLogisticsResource;
use App\Models\Agent;
use App\Models\Order;
use App\Models\OrderLogistics;
use App\Models\Restaurant;
use App\Services\DispatchService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class DispatchController extends Controller
{
    use ApiResponseTrait;
    public function __construct(
        protected DispatchService $dispatchService
    ) {}

    /**
     * Get all delivery orders for a restaurant.
     */
    public function index(Request $request, Restaurant $restaurant): JsonResponse
    {
        Gate::authorize('viewDeliveries', $restaurant);

        $status = $request->query('status');
        $deliveries = $this->dispatchService->getDeliveries($restaurant, $status);

        return $this->success(OrderLogisticsResource::collection($deliveries));
    }

    /**
     * Get pending (unassigned) deliveries for a restaurant.
     */
    public function pending(Restaurant $restaurant): JsonResponse
    {
        Gate::authorize('viewDeliveries', $restaurant);

        $deliveries = $this->dispatchService->getPendingDeliveries($restaurant);

        return $this->success(OrderLogisticsResource::collection($deliveries));
    }

    /**
     * Create logistics for a delivery order.
     * Auto-uses the order's delivery_address if not provided in request.
     */
    public function createLogistics(Request $request, Order $order): JsonResponse
    {
        Gate::authorize('manageDelivery', $order);

        // Validate optional overrides - falls back to order's delivery_address
        $validated = $request->validate([
            'delivery_address' => 'nullable|array',
            'delivery_address.name' => 'nullable|string',
            'delivery_address.address' => 'nullable|string',
            'delivery_address.lat' => 'nullable|numeric',
            'delivery_address.lng' => 'nullable|numeric',
            'delivery_address.phone' => 'nullable|string',
            'delivery_address.instructions' => 'nullable|string',
            'pickup_address' => 'nullable|array',
        ]);

        // Use order's delivery_address if not provided in request
        $deliveryAddress = $validated['delivery_address'] ?? $order->delivery_address;

        if (!$deliveryAddress) {
            return $this->error('Order does not have a delivery address', 422);
        }

        try {
            $logistics = $this->dispatchService->createLogistics(
                $order,
                $deliveryAddress,
                $validated['pickup_address'] ?? null
            );

            return $this->success(
                new OrderLogisticsResource($logistics->load(['order', 'agent'])),
                'Logistics created successfully',
                201
            );
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    /**
     * Assign an agent to a delivery order.
     */
    public function assignAgent(Request $request, Order $order): JsonResponse
    {
        Gate::authorize('manageDelivery', $order);

        $validated = $request->validate([
            'agent_id' => 'required|exists:agents,id',
        ]);

        $logistics = $order->logistics;

        if (!$logistics) {
            return $this->error('Order does not have logistics record. Create logistics first.', 422);
        }

        $agent = Agent::findOrFail($validated['agent_id']);

        try {
            $logistics = $this->dispatchService->assignAgent($logistics, $agent);

            return $this->success(new OrderLogisticsResource($logistics), 'Agent assigned successfully');
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    /**
     * Unassign agent from a delivery order.
     */
    public function unassignAgent(Order $order): JsonResponse
    {
        Gate::authorize('manageDelivery', $order);

        $logistics = $order->logistics;

        if (!$logistics) {
            return $this->error('Order does not have logistics record', 422);
        }

        try {
            $logistics = $this->dispatchService->unassignAgent($logistics);

            return $this->success(new OrderLogisticsResource($logistics), 'Agent unassigned successfully');
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    /**
     * Update delivery status (for agents).
     */
    public function updateStatus(Request $request, OrderLogistics $logistics): JsonResponse
    {
        Gate::authorize('updateDeliveryStatus', $logistics);

        $validated = $request->validate([
            'status' => 'required|string|in:ASSIGNED,PICKED_UP,ON_THE_WAY,DELIVERED',
        ]);

        try {
            $logistics = $this->dispatchService->updateDeliveryStatus($logistics, $validated['status']);

            return $this->success(new OrderLogisticsResource($logistics), 'Delivery status updated');
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    /**
     * Get tracking info for customer.
     */
    public function tracking(Order $order): JsonResponse
    {
        Gate::authorize('viewTracking', $order);

        $logistics = $this->dispatchService->getLogistics($order->id);

        if (!$logistics) {
            return $this->error('No delivery tracking available for this order', 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => new OrderLogisticsResource($logistics),
            'firebase_paths' => [
                'location' => $logistics->getFirebaseLocationPath(),
                'status' => $logistics->getFirebaseStatusPath(),
            ],
        ]);
    }

    /**
     * Customer confirms delivery receipt.
     */
    public function confirmDelivery(Order $order): JsonResponse
    {
        Gate::authorize('confirmDelivery', $order);

        $logistics = $order->logistics;

        if (!$logistics) {
            return $this->error('Order does not have logistics record', 422);
        }

        try {
            $logistics = $this->dispatchService->confirmDelivery($logistics);

            return $this->success(new OrderLogisticsResource($logistics), 'Delivery confirmed successfully');
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    /**
     * Get agent's assigned deliveries.
     */
    public function agentDeliveries(Request $request): JsonResponse
    {
        $user = $request->user();
        $agent = Agent::where('user_id', $user->id)->firstOrFail();

        $status = $request->query('status');
        $deliveries = $this->dispatchService->getAgentDeliveries($agent, $status);

        return $this->success(OrderLogisticsResource::collection($deliveries));
    }
}
