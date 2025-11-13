<?php

namespace App\Services;

use App\Models\MenuCategory;

class MenuCategoryService
{
    public function getRestaurantCategories(string $restaurantId)
    {
        return MenuCategory::where('restaurant_id', $restaurantId)
            ->with('dishes')
            ->orderBy('display_order')
            ->get();
    }

    public function getCategoryById(string $id)
    {
        return MenuCategory::with(['dishes.options', 'restaurant'])
            ->findOrFail($id);
    }

    public function createCategory(array $data)
    {
        return MenuCategory::create($data);
    }

    public function updateCategory(string $id, array $data)
    {
        $category = MenuCategory::findOrFail($id);
        $category->update($data);

        return $category->fresh();
    }

    public function deleteCategory(string $id)
    {
        $category = MenuCategory::findOrFail($id);

        return $category->delete();
    }
}
