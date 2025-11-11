<?php

namespace App\Http\Controllers\Api\Restaurants;

use App\Http\Controllers\Controller;
use App\Http\Requests\RestaurantRequest;
use App\Http\Resources\RestaurantResource;
use App\Services\RestaurantService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;

class RestaurantController extends Controller
{
    use ApiResponseTrait;

    protected $restaurantService;

    public function __construct(RestaurantService $restaurantService)
    {
        $this->restaurantService = $restaurantService;
    }

    public function index(Request $request)
    {
        $filters = $request->only(['name', 'verification_status']);

        if (empty($filters)) {
            $restaurants = $this->restaurantService->getVerifiedRestaurants();
        } else {
            $restaurants = $this->restaurantService->searchRestaurants($filters);
        }

        return $this->success(RestaurantResource::collection($restaurants));
    }

    public function show($id)
    {
        $restaurant = $this->restaurantService->getRestaurantById($id);

        return $this->success(new RestaurantResource($restaurant));
    }

    public function store(RestaurantRequest $request)
    {
        $data = $request->validated();
        $data['owner_id'] = auth()->id();

        $restaurant = $this->restaurantService->createRestaurant($data);

        return $this->success(new RestaurantResource($restaurant), 'Restaurant created successfully', 201);
    }

    public function update(RestaurantRequest $request, $id)
    {
        $restaurant = $this->restaurantService->updateRestaurant($id, $request->validated());

        return $this->success(new RestaurantResource($restaurant), 'Restaurant updated successfully');
    }

    public function destroy($id)
    {
        $this->restaurantService->deleteRestaurant($id);

        return $this->success(null, 'Restaurant deleted');
    }
}
