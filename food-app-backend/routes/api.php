<?php

use App\Http\Controllers\Api\Chats\ConversationController;
use App\Http\Controllers\Api\Chats\MessageController;
use App\Http\Controllers\Api\Combos\ComboCalculationController;
use App\Http\Controllers\Api\Combos\ComboController;
use App\Http\Controllers\Api\Combos\ComboGroupController;
use App\Http\Controllers\Api\Combos\ComboGroupItemController;
use App\Http\Controllers\Api\Combos\ComboSelectionController;
use App\Http\Controllers\Api\Dishes\DishController;
use App\Http\Controllers\Api\Dishes\DishOptionController;
use App\Http\Controllers\Api\Inventory\KitchenController;
use App\Http\Controllers\Api\MenuCategories\MenuCategoryController;
use App\Http\Controllers\Api\Orders\OrderController;
use App\Http\Controllers\Api\Restaurants\RestaurantController;
use App\Http\Controllers\Api\Reviews\ReviewController;
use App\Http\Controllers\Api\Uploads\UploadController;
use App\Http\Controllers\Api\VendorAnalyticsController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Public auth endpoints
    Route::post('/register', [RegisteredUserController::class, 'store']);
    Route::post('/login', [AuthenticatedSessionController::class, 'store']);

    // Public endpoints
    Route::get('/restaurants', [RestaurantController::class, 'index']);
    Route::get('/restaurants/{id}', [RestaurantController::class, 'show']);
    Route::get('/menu-categories', [MenuCategoryController::class, 'index']);
    Route::get('/menu-categories/{id}', [MenuCategoryController::class, 'show']);
    Route::get('/dishes', [DishController::class, 'index']);
    Route::get('/dishes/{id}', [DishController::class, 'show']);
    Route::get('/dishes/tags/popular', [DishController::class, 'getPopularTags']);
    Route::get('/reviews', [ReviewController::class, 'index']);
    Route::get('/reviews/{id}', [ReviewController::class, 'show']);

    // Combos (public consumption) - discovery endpoints
    Route::get('/combos/tags/popular', [ComboController::class, 'getPopularTags']);
    Route::get('/combos', [ComboController::class, 'index']);
    Route::get('/combos/{combo}', [ComboController::class, 'show']);
    Route::post('/combos/{combo}/calculate', ComboCalculationController::class);
    Route::get('/restaurants/{id}/combos', [ComboController::class, 'getRestaurantCombos']);

    // Authenticated endpoints
    Route::middleware(['auth:sanctum'])->group(function () {
        Route::get('/user', function (Request $request) {
            return response()->json([
                'status' => 'success',
                'data' => $request->user(),
            ]);
        });

        // Auth endpoints
        Route::post('/logout', [AuthenticatedSessionController::class, 'destroy']);

        // Vendor-specific routes (get authenticated user's restaurants)
        Route::get('/me/restaurants', [RestaurantController::class, 'getMyRestaurants']);
        Route::get('/me/restaurants/{id}', [RestaurantController::class, 'getMyRestaurant']);

        // Restaurants
        Route::post('/restaurants', [RestaurantController::class, 'store']);
        Route::put('/restaurants/{id}', [RestaurantController::class, 'update']);
        Route::delete('/restaurants/{id}', [RestaurantController::class, 'destroy']);

        // Menu Categories
        Route::post('/menu-categories', [MenuCategoryController::class, 'store']);
        Route::put('/menu-categories/{id}', [MenuCategoryController::class, 'update']);
        Route::delete('/menu-categories/{id}', [MenuCategoryController::class, 'destroy']);

        // Dishes
        Route::post('/dishes', [DishController::class, 'store']);
        Route::put('/dishes/{id}', [DishController::class, 'update']);
        Route::delete('/dishes/{id}', [DishController::class, 'destroy']);

        // Dish Options
        Route::get('/dish-options', [DishOptionController::class, 'index']);
        Route::get('/dish-options/{id}', [DishOptionController::class, 'show']);
        Route::post('/dish-options', [DishOptionController::class, 'store']);
        Route::put('/dish-options/{id}', [DishOptionController::class, 'update']);
        Route::delete('/dish-options/{id}', [DishOptionController::class, 'destroy']);

        // Combos management
        Route::post('/combos', [ComboController::class, 'store']);
        Route::put('/combos/{combo}', [ComboController::class, 'update']);
        Route::delete('/combos/{combo}', [ComboController::class, 'destroy']);

        // Combo groups - direct access
        Route::put('/combo-groups/{group}', [ComboGroupController::class, 'updateDirect']);
        Route::delete('/combo-groups/{group}', [ComboGroupController::class, 'destroyDirect']);
        Route::post('/combo-groups/{group}/items', [ComboGroupItemController::class, 'storeDirect']);
        Route::put('/combo-group-items/{item}', [ComboGroupItemController::class, 'updateDirect']);
        Route::delete('/combo-group-items/{item}', [ComboGroupItemController::class, 'destroyDirect']);

        Route::prefix('combos/{combo}')->group(function () {
            Route::get('/groups', [ComboGroupController::class, 'index']);
            Route::post('/groups', [ComboGroupController::class, 'store']);
            Route::put('/groups/{group}', [ComboGroupController::class, 'update']);
            Route::delete('/groups/{group}', [ComboGroupController::class, 'destroy']);

            Route::get('/groups/{group}/items', [ComboGroupItemController::class, 'index']);
            Route::post('/groups/{group}/items', [ComboGroupItemController::class, 'store']);
            Route::put('/groups/{group}/items/{item}', [ComboGroupItemController::class, 'update']);
            Route::delete('/groups/{group}/items/{item}', [ComboGroupItemController::class, 'destroy']);

            Route::post('/selections', [ComboSelectionController::class, 'store']);
            Route::post('/order', [ComboSelectionController::class, 'store']); // Alias for backward compatibility
        });

        // Orders
        Route::get('/orders', [OrderController::class, 'index']);
        Route::get('/orders/{id}', [OrderController::class, 'show']);
        Route::post('/orders', [OrderController::class, 'store']);
        Route::put('/orders/{id}', [OrderController::class, 'update']);

        // Order-specific conversation endpoints
        Route::post('/orders/{orderId}/conversations', [ConversationController::class, 'store']);
        Route::get('/orders/{orderId}/conversations', [ConversationController::class, 'getForOrder']);
        
        // Conversation message endpoints
        Route::post('/conversations/{conversationId}/messages', [MessageController::class, 'store']);
        Route::get('/conversations/{conversationId}/messages', [MessageController::class, 'index']);
        Route::post('/conversations/{conversationId}/read', [ConversationController::class, 'markAsRead']);

        // Reviews
        Route::post('/reviews', [ReviewController::class, 'store']);
        Route::put('/reviews/{id}', [ReviewController::class, 'update']);
        Route::delete('/reviews/{id}', [ReviewController::class, 'destroy']);

        // Vendor Analytics
        Route::get('/vendor/{restaurant_id}/analytics', [VendorAnalyticsController::class, 'index']);

        // Uploads
        Route::post('/uploads/dishes', [UploadController::class, 'uploadDishImages']);
    });

    // Kitchen Graph Management (auth required)
    Route::prefix('kitchen')->middleware(['auth:sanctum'])->group(function () {
        Route::get('/restaurants/{id}/graph', [KitchenController::class, 'graph']);
        Route::get('/nodes/{id}', [KitchenController::class, 'showNode']);
        Route::post('/nodes', [KitchenController::class, 'createNode']);
        Route::patch('/nodes/{id}/toggle', [KitchenController::class, 'toggleNode']);
        Route::patch('/nodes/{id}/move', [KitchenController::class, 'moveNode']);
        Route::delete('/nodes/{id}', [KitchenController::class, 'deleteNode']);
        Route::post('/edges', [KitchenController::class, 'createEdge']);
        Route::delete('/edges/{id}', [KitchenController::class, 'deleteEdge']);
    });
});
