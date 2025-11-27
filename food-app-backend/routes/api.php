<?php

use App\Http\Controllers\Api\Chats\ConversationController;
use App\Http\Controllers\Api\Chats\MessageController;
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
