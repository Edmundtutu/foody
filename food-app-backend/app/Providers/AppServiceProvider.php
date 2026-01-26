<?php

namespace App\Providers;

use App\Models\Dish;
use App\Models\Agent;
use App\Models\Combo;
use App\Models\Order;
use App\Models\Restaurant;
use App\Models\MenuCategory;
use App\Policies\DishPolicy;
use App\Models\InventoryNode;
use App\Policies\AgentPolicy;
use App\Policies\ComboPolicy;
use App\Policies\OrderPolicy;
use App\Policies\KitchenPolicy;
use App\Models\InventoryNodeEdge;
use App\Policies\RestaurantPolicy;
use App\Policies\MenuCategoryPolicy;
use App\Models\OrderLogistics;
use App\Policies\OrderLogisticsPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Http\Request;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider;

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
        Gate::policy(Combo::class, ComboPolicy::class);
        Gate::policy(Agent::class, AgentPolicy::class);
        Gate::policy(OrderLogistics::class, OrderLogisticsPolicy::class);

        ResetPassword::createUrlUsing(function (object $notifiable, string $token) {
            return config('app.frontend_url')."/password-reset/$token?email={$notifiable->getEmailForPasswordReset()}";
        });

        RateLimiter::for('otp-requests', function(Request $request){
            return Limit::perMinute(3)->by($request->input('phone_number'));
        } );
    }
}
