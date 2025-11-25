import React, { useMemo } from 'react';
import { useVendor } from '@/context/VendorContext';
import { useRestaurantOrders } from '@/hooks/queries/useOrders';
import { useDishes } from '@/hooks/queries/useDishes';
import { useRestaurantAnalytics } from '@/hooks/queries/useAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, Package, ShoppingCart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnalyticsSkeleton } from '@/components/vendor/LoadingSkeletons';

const VendorDashboard: React.FC = () => {
  const { restaurantId, hasRestaurant, isLoading: vendorLoading } = useVendor();
  
  // Fetch orders and analytics
  const { data: orders, isLoading: ordersLoading } = useRestaurantOrders(restaurantId || null);
  const { data: dishes, isLoading: dishesLoading } = useDishes(
    restaurantId ? { restaurant_id: restaurantId } : undefined
  );
  const { data: analytics, isLoading: analyticsLoading } = useRestaurantAnalytics(
    restaurantId,
    7 // Last 7 days
  );

  const isLoading = vendorLoading || ordersLoading || dishesLoading || analyticsLoading;

  // Calculate metrics
  const metrics = useMemo(() => {
    return {
      totalOrders: orders?.length ?? 0,
      totalDishes: dishes?.length ?? 0,
      totalRevenue: analytics?.revenue ?? 0,
      revenueChange: analytics?.revenue_change ?? 0,
      ordersChange: analytics?.orders_change ?? 0,
    };
  }, [orders, dishes, analytics]);

  if (!hasRestaurant) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Get started by creating a restaurant</p>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No restaurant found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create a restaurant profile to get started with your dashboard
            </p>
            <Button asChild>
              <Link to="/vendor/profile">Create Restaurant</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Your restaurant overview</p>
        </div>
        <AnalyticsSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Your restaurant overview and quick actions</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {typeof metrics.totalRevenue === 'number' 
                ? `UGX ${metrics.totalRevenue.toLocaleString()}`
                : 'UGX 0'
              }
            </div>
            <p className={`text-xs mt-1 ${metrics.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {metrics.revenueChange >= 0 ? '+' : ''}{metrics.revenueChange}% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalOrders}</div>
            <p className={`text-xs mt-1 ${metrics.ordersChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {metrics.ordersChange >= 0 ? '+' : ''}{metrics.ordersChange}% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menu Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalDishes}</div>
            <p className="text-xs text-muted-foreground mt-1">Active dishes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7d</div>
            <p className="text-xs text-muted-foreground mt-1">Period analyzed</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <Button asChild variant="outline" className="justify-between">
              <Link to="/vendor/orders">
                View Orders
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-between">
              <Link to="/vendor/menu">
                Manage Menu
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-between">
              <Link to="/vendor/kitchen">
                Kitchen Layout
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-between">
              <Link to="/vendor/analytics">
                View Analytics
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-between">
              <Link to="/vendor/profile">
                Restaurant Profile
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-between">
              <Link to="/vendor/account">
                Account Settings
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorDashboard;