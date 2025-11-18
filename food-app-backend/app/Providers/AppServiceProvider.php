<?php

namespace App\Providers;

use App\Models\Dish;
use App\Models\InventoryNode;
use App\Models\InventoryNodeEdge;
use App\Models\MenuCategory;
use App\Models\Order;
use App\Models\Restaurant;
use App\Policies\DishPolicy;
use App\Policies\KitchenPolicy;
use App\Policies\MenuCategoryPolicy;
use App\Policies\OrderPolicy;
use App\Policies\RestaurantPolicy;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider;
use Illuminate\Support\Facades\Gate;

class AppServiceProvider extends AuthServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register policies using the newer Gate::policy() approach
        Gate::policy(Restaurant::class, RestaurantPolicy::class);
        Gate::policy(MenuCategory::class, MenuCategoryPolicy::class);
        Gate::policy(Dish::class, DishPolicy::class);
        Gate::policy(Order::class, OrderPolicy::class);
        Gate::policy(InventoryNode::class, KitchenPolicy::class);
        Gate::policy(InventoryNodeEdge::class, KitchenPolicy::class);

        ResetPassword::createUrlUsing(function (object $notifiable, string $token) {
            return config('app.frontend_url')."/password-reset/$token?email={$notifiable->getEmailForPasswordReset()}";
        });
    }
}
