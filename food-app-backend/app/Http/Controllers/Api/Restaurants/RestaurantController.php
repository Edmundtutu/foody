<?php

namespace App\Http\Controllers\Api\Restaurants;

use App\Http\Controllers\Controller;
use App\Http\Requests\RestaurantRequest;
use App\Http\Resources\RestaurantResource;
use App\Models\Restaurant;
use App\Services\RestaurantService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

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
        $this->authorize('create', \App\Models\Restaurant::class);
        
        $data = $request->validated();
        $data['owner_id'] = Auth::id();

        $restaurant = $this->restaurantService->createRestaurant($data);

        return $this->success(new RestaurantResource($restaurant), 'Restaurant created successfully', 201);
    }

    public function update(RestaurantRequest $request, $id)
    {
        $restaurant = $this->restaurantService->getRestaurantById($id);
        $this->authorize('update', $restaurant);

        $restaurant = $this->restaurantService->updateRestaurant($id, $request->validated());

        return $this->success(new RestaurantResource($restaurant), 'Restaurant updated successfully');
    }

    public function destroy($id)
    {
        $restaurant = $this->restaurantService->getRestaurantById($id);
        $this->authorize('delete', $restaurant);

        $this->restaurantService->deleteRestaurant($id);

        return $this->success(null, 'Restaurant deleted');
    }

    /**
     * Get all restaurants belonging to authenticated user (vendor)
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getMyRestaurants(Request $request)
    {
        $user = Auth::user();
        $userId = $user ? $user->id : null;
        
        if (!$userId) {
            return $this->error('Unauthorized', 401);
        }
        
        // Get only restaurants owned by authenticated user
        $restaurants = Restaurant::where('owner_id', $userId)
            ->get();

        return $this->success(
            RestaurantResource::collection($restaurants),
            'Your restaurants retrieved successfully'
        );
    }

    /**
     * Get single restaurant owned by authenticated user
     * 
     * @param string $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function getMyRestaurant($id)
    {
        $user = Auth::user();
        $userId = $user ? $user->id : null;
        
        if (!$userId) {
            return $this->error('Unauthorized', 401);
        }
        
        $restaurant = Restaurant::where('id', $id)
            ->where('owner_id', $userId)
            ->firstOrFail();

        return $this->success(
            new RestaurantResource($restaurant),
            'Restaurant retrieved successfully'
        );
    }
}
