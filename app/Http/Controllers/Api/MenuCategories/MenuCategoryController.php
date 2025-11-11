<?php

namespace App\Http\Controllers\Api\MenuCategories;

use App\Http\Controllers\Controller;
use App\Http\Requests\MenuCategoryRequest;
use App\Http\Resources\MenuCategoryResource;
use App\Services\MenuCategoryService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;

class MenuCategoryController extends Controller
{
    use ApiResponseTrait;

    protected $menuCategoryService;

    public function __construct(MenuCategoryService $menuCategoryService)
    {
        $this->menuCategoryService = $menuCategoryService;
    }

    public function index(Request $request)
    {
        $restaurantId = $request->query('restaurant_id');

        if ($restaurantId) {
            $categories = $this->menuCategoryService->getRestaurantCategories($restaurantId);
        } else {
            return $this->error('restaurant_id is required', 400);
        }

        return $this->success(MenuCategoryResource::collection($categories));
    }

    public function show($id)
    {
        $category = $this->menuCategoryService->getCategoryById($id);

        return $this->success(new MenuCategoryResource($category));
    }

    public function store(MenuCategoryRequest $request)
    {
        $category = $this->menuCategoryService->createCategory($request->validated());

        return $this->success(new MenuCategoryResource($category), 'Category created successfully', 201);
    }

    public function update(MenuCategoryRequest $request, $id)
    {
        $category = $this->menuCategoryService->updateCategory($id, $request->validated());

        return $this->success(new MenuCategoryResource($category), 'Category updated successfully');
    }

    public function destroy($id)
    {
        $this->menuCategoryService->deleteCategory($id);

        return $this->success(null, 'Category deleted');
    }
}
