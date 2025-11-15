<?php

namespace App\Http\Controllers\Api\Dishes;

use App\Http\Controllers\Controller;
use App\Http\Requests\DishOptionRequest;
use App\Http\Resources\DishOptionResource;
use App\Services\DishOptionService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;

class DishOptionController extends Controller
{
    use ApiResponseTrait;

    protected $dishOptionService;

    public function __construct(DishOptionService $dishOptionService)
    {
        $this->dishOptionService = $dishOptionService;
    }

    /**
     * Get all options for a dish
     */
    public function index(Request $request)
    {
        $dishId = $request->query('dish_id');

        if (! $dishId) {
            return $this->error('dish_id is required', 400);
        }

        $options = $this->dishOptionService->getDishOptions($dishId);

        return $this->success(DishOptionResource::collection($options));
    }

    /**
     * Get a single dish option by ID
     */
    public function show($id)
    {
        $option = $this->dishOptionService->getDishOptionById($id);

        return $this->success(new DishOptionResource($option));
    }

    /**
     * Create a new dish option
     */
    public function store(DishOptionRequest $request)
    {
        $option = $this->dishOptionService->createDishOption($request->validated());

        return $this->success(new DishOptionResource($option), 'Dish option created successfully', 201);
    }

    /**
     * Update a dish option
     */
    public function update(DishOptionRequest $request, $id)
    {
        $option = $this->dishOptionService->updateDishOption($id, $request->validated());

        return $this->success(new DishOptionResource($option), 'Dish option updated successfully');
    }

    /**
     * Delete a dish option
     */
    public function destroy($id)
    {
        $this->dishOptionService->deleteDishOption($id);

        return $this->success(null, 'Dish option deleted');
    }
}

