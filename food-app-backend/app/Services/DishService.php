<?php

namespace App\Services;

use App\Models\Dish;

class DishService
{
    public function getAllDishes(array $filters = [])
    {
        $query = Dish::query();

        if (isset($filters['restaurant_id'])) {
            $query->where('restaurant_id', $filters['restaurant_id']);
        }

        if (isset($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        if (isset($filters['available'])) {
            $query->where('available', $filters['available']);
        }

        if (isset($filters['name'])) {
            $query->where('name', 'like', '%'.$filters['name'].'%');
        }

        return $query->with(['category', 'restaurant', 'options'])->get();
    }

    public function getDishById(string $id)
    {
        return Dish::with(['category', 'restaurant', 'options', 'reviews.user'])
            ->findOrFail($id);
    }

    public function createDish(array $data)
    {
        return Dish::create($data);
    }

    public function updateDish(string $id, array $data)
    {
        $dish = Dish::findOrFail($id);
        $dish->update($data);

        return $dish->fresh();
    }

    public function deleteDish(string $id)
    {
        $dish = Dish::findOrFail($id);

        return $dish->delete();
    }
}
