<?php

namespace App\Http\Controllers\Api\Orders;

use App\Http\Controllers\Controller;
use App\Http\Requests\OrderRequest;
use App\Http\Resources\OrderResource;
use App\Services\OrderService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    use ApiResponseTrait;

    protected $orderService;

    public function __construct(OrderService $orderService)
    {
        $this->orderService = $orderService;
    }

    public function index(Request $request)
    {
        $userId = auth()->id();
        $user = auth()->user();

        if ($user->role === 'restaurant' && $request->query('restaurant_id')) {
            $orders = $this->orderService->getRestaurantOrders($request->query('restaurant_id'));
        } else {
            $orders = $this->orderService->getUserOrders($userId);
        }

        return $this->success(OrderResource::collection($orders));
    }

    public function show($id)
    {
        $order = $this->orderService->getOrderById($id);

        return $this->success(new OrderResource($order));
    }

    public function store(OrderRequest $request)
    {
        $data = $request->validated();
        $data['user_id'] = auth()->id();

        $order = $this->orderService->createOrder($data);

        return $this->success(new OrderResource($order), 'Order created successfully', 201);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:' . implode(',', \App\Models\Order::STATUSES),
        ]);

        $order = $this->orderService->getOrderById($id);
        $this->authorize('update', $order);

        try {
            $order = $this->orderService->updateOrderStatus($id, $request->status);
            return $this->success(new OrderResource($order), 'Order status updated successfully');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->error($e->getMessage(), 422, $e->errors());
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    public function destroy($id)
    {
        return $this->error('Orders cannot be deleted. Please update status to cancelled instead.', 400);
    }
}
