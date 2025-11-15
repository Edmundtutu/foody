<?php

namespace App\Services;

use App\Models\DishOption;

class DishOptionService
{
    /**
     * Get all options for a dish
     */
    public function getDishOptions(string $dishId)
    {
        return DishOption::where('dish_id', $dishId)
            ->orderBy('required', 'desc')
            ->orderBy('name')
            ->get();
    }

    /**
     * Get a single dish option by ID
     */
    public function getDishOptionById(string $id)
    {
        return DishOption::with('dish')->findOrFail($id);
    }

    /**
     * Create a new dish option
     */
    public function createDishOption(array $data)
    {
        return DishOption::create($data);
    }

    /**
     * Update a dish option
     */
    public function updateDishOption(string $id, array $data)
    {
        $option = DishOption::findOrFail($id);
        $option->update($data);

        return $option->fresh();
    }

    /**
     * Delete a dish option
     */
    public function deleteDishOption(string $id)
    {
        $option = DishOption::findOrFail($id);

        return $option->delete();
    }
}

