<?php

namespace App\Http\Controllers\Api\Dishes;

use App\Http\Controllers\Controller;
use App\Http\Requests\DishRequest;
use App\Http\Resources\DishResource;
use App\Services\DishService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;

class DishController extends Controller
{
    use ApiResponseTrait;

    protected $dishService;

    public function __construct(DishService $dishService)
    {
        $this->dishService = $dishService;
    }

    public function index(Request $request)
    {
        $filters = $request->only(['restaurant_id', 'category_id', 'available', 'name']);
        $dishes = $this->dishService->getAllDishes($filters);

        return $this->success(DishResource::collection($dishes));
    }

    public function show($id)
    {
        $dish = $this->dishService->getDishById($id);

        return $this->success(new DishResource($dish));
    }

    public function store(DishRequest $request)
    {
        $dish = $this->dishService->createDish($request->validated());

        return $this->success(new DishResource($dish), 'Dish created successfully', 201);
    }

    public function update(DishRequest $request, $id)
    {
        $dish = $this->dishService->updateDish($id, $request->validated());

        return $this->success(new DishResource($dish), 'Dish updated successfully');
    }

    public function destroy($id)
    {
        $this->dishService->deleteDish($id);

        return $this->success(null, 'Dish deleted');
    }
}
