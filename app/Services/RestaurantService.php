<?php

namespace App\Services;

use App\Models\Restaurant;

class RestaurantService
{
    public function getVerifiedRestaurants()
    {
        return Restaurant::verified()
            ->with(['categories', 'dishes'])
            ->get();
    }

    public function getRestaurantById(string $id)
    {
        return Restaurant::with(['categories.dishes.options', 'owner'])
            ->findOrFail($id);
    }

    public function createRestaurant(array $data)
    {
        return Restaurant::create($data);
    }

    public function updateRestaurant(string $id, array $data)
    {
        $restaurant = Restaurant::findOrFail($id);
        $restaurant->update($data);

        return $restaurant->fresh();
    }

    public function deleteRestaurant(string $id)
    {
        $restaurant = Restaurant::findOrFail($id);

        return $restaurant->delete();
    }

    public function searchRestaurants(array $filters = [])
    {
        $query = Restaurant::query();

        if (isset($filters['name'])) {
            $query->where('name', 'like', '%'.$filters['name'].'%');
        }

        if (isset($filters['verification_status'])) {
            $query->where('verification_status', $filters['verification_status']);
        }

        return $query->with(['categories', 'dishes'])->get();
    }
}
