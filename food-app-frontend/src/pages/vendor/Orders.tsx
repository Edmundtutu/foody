import React, { useMemo, useState } from 'react';
import { useVendor } from '@/context/VendorContext';
import {
  useRestaurantOrders,
  useUpdateOrderStatus,
} from '@/hooks/queries/useOrders';
import { Skeleton } from '@/components/ui/skeleton';
import OrderCard from '@/components/shared/OrderCard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

import { toast } from 'sonner';
import { Package, AlertCircle } from 'lucide-react';
import type { Order } from '@/types';

const VendorOrders: React.FC = () => {
  const { restaurantId, hasRestaurant, isLoading: vendorLoading } = useVendor();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch orders for the restaurant
  const { data: orders, isLoading, isError, error } = useRestaurantOrders(
    restaurantId || null
  );
  const updateOrderStatusMutation = useUpdateOrderStatus();

  // Filter orders by status
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    if (statusFilter === 'all') return orders;
    return orders.filter((order) => order.status === statusFilter);
  }, [orders, statusFilter]);

  // Calculate order counts per status
  const statusCounts = useMemo(() => {
    if (!orders) return {
      all: 0,
      pending: 0,
      confirmed: 0,
      ready: 0,
      completed: 0,
      cancelled: 0,
    };
    return {
      all: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      ready: orders.filter(o => o.status === 'ready').length,
      completed: orders.filter(o => o.status === 'completed').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
    };
  }, [orders]);

  // Status filter configuration
  const statusFilterConfig = [
    {
      status: 'all',
      label: 'All Orders',
      activeClasses: 'bg-primary text-white shadow-sm',
      inactiveClasses: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    },
    {
      status: 'pending',
      label: 'Pending',
      activeClasses: 'bg-amber-100 text-amber-800 border border-amber-200',
      inactiveClasses: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    },
    {
      status: 'confirmed',
      label: 'Confirmed',
      activeClasses: 'bg-blue-100 text-blue-800 border border-blue-200',
      inactiveClasses: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    },
    {
      status: 'ready',
      label: 'Ready',
      activeClasses: 'bg-green-100 text-green-800 border border-green-200',
      inactiveClasses: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    },
    {
      status: 'completed',
      label: 'Completed',
      activeClasses: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
      inactiveClasses: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    },
    {
      status: 'cancelled',
      label: 'Cancelled',
      activeClasses: 'bg-red-100 text-red-800 border border-red-200',
      inactiveClasses: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    },
  ];

  // Handle order status update with better error handling
  const handleUpdateStatus = async (
    orderId: string,
    status: Order['status']
  ) => {
    try {
      await updateOrderStatusMutation.mutateAsync({ orderId, status });
      toast.success(`Order status updated to ${status}`);
      setSelectedOrder(null);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message ||
        error?.message ||
        'Failed to update order status';
      toast.error(errorMessage);
      console.error('Order status update failed:', error);
    }
  };

  // Handle confirm order (set to confirmed)
  const handleConfirmOrder = async (order: Order) => {
    await handleUpdateStatus(order.id, 'confirmed');
  };

  // Handle reject order (set to cancelled)
  const handleRejectOrder = async (order: Order) => {
    await handleUpdateStatus(order.id, 'cancelled');
  };

  // Loading state
  if (vendorLoading || isLoading) {
    return (
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // No restaurant found
  if (!hasRestaurant) {
    return (
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No restaurant found</h3>
            <p className="text-muted-foreground text-center">
              You need to create a restaurant to view orders.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error loading orders
  if (isError) {
    return (
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">Incoming Orders</h1>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-lg font-medium mb-2">Failed to load orders</h3>
            <p className="text-muted-foreground text-center mb-4">
              {error instanceof Error ? error.message : 'An error occurred while loading orders'}
            </p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
            Incoming Orders
          </h1>
        </div>

        {/* Enhanced Pill Tabs with count badges */}
        <div className="flex flex-wrap gap-2">
          {statusFilterConfig.map((filter) => {
            const count = statusCounts[filter.status as keyof typeof statusCounts];
            const isActive = statusFilter === filter.status;
            
            return (
              <button
                key={filter.status}
                onClick={() => setStatusFilter(filter.status)}
                className={`
                  inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all
                  ${isActive ? filter.activeClasses : filter.inactiveClasses}
                `}
              >
                <span>{filter.label}</span>
                <Badge
                  className={`
                    h-5 min-w-[20px] px-1.5 text-[10px] font-semibold
                    ${isActive 
                      ? 'bg-white/20 text-current border-current/20' 
                      : 'bg-gray-200 text-gray-700 border-gray-300'
                    }
                  `}
                  variant="outline"
                >
                  {count > 99 ? '99+' : count}
                </Badge>
              </button>
            );
          })}
        </div>
      </div>

      {!filteredOrders || filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              {statusFilter === 'all'
                ? 'No orders yet. Orders will appear here when customers place them.'
                : `No ${statusFilter} orders found.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 auto-rows-fr">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              context="vendor"
              onConfirm={handleConfirmOrder}
              onReject={handleRejectOrder}
              onStartPost={() => { }}
              isPostDisabled={true}
            />
          ))}
        </div>
      )}

      {/* Order Details Modal */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Order #{selectedOrder.id}</DialogTitle>
                <DialogDescription>
                  Order details and status management
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Status
                    </p>
                    <Badge variant="outline" className="mt-1 capitalize">
                      {selectedOrder.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total
                    </p>
                    <p className="text-lg font-semibold mt-1">
                      {selectedOrder.total.toLocaleString()} UGX
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Customer
                    </p>
                    <p className="mt-1">
                      {selectedOrder.user?.name || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Date
                    </p>
                    <p className="mt-1">
                      {new Date(selectedOrder.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Items
                  </p>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {selectedOrder.items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <div className="flex-1">
                          <p className="font-medium">
                            {item.dish?.name || 'Unknown Dish'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.quantity} ×{' '}
                            {item.unit_price.toLocaleString()} UGX
                          </p>
                          {item.notes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Note: {item.notes}
                            </p>
                          )}
                        </div>
                        <p className="font-semibold ml-2 flex-shrink-0">
                          {(item.quantity * item.unit_price).toLocaleString()}{' '}
                          UGX
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Notes */}
                {selectedOrder.notes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Order Notes
                    </p>
                    <p className="p-2 border rounded bg-muted/50 text-sm">
                      {selectedOrder.notes}
                    </p>
                  </div>
                )}

                {/* Status Update Buttons */}
                <div className="flex flex-wrap gap-2 pt-4 border-t">
                  {selectedOrder.status === 'pending' && (
                    <>
                      <Button
                        onClick={() =>
                          handleUpdateStatus(selectedOrder.id, 'confirmed')
                        }
                        disabled={updateOrderStatusMutation.isPending}
                        className="flex-1"
                      >
                        {updateOrderStatusMutation.isPending ? 'Accepting...' : 'Accept Order'}
                      </Button>
                      <Button
                        onClick={() =>
                          handleUpdateStatus(selectedOrder.id, 'cancelled')
                        }
                        disabled={updateOrderStatusMutation.isPending}
                        variant="destructive"
                        className="flex-1"
                      >
                        {updateOrderStatusMutation.isPending ? 'Cancelling...' : 'Cancel Order'}
                      </Button>
                    </>
                  )}
                  {selectedOrder.status === 'confirmed' && (
                    <Button
                      onClick={() =>
                        handleUpdateStatus(selectedOrder.id, 'processing')
                      }
                      disabled={updateOrderStatusMutation.isPending}
                      className="flex-1"
                    >
                      {updateOrderStatusMutation.isPending ? 'Starting...' : 'Start Preparing'}
                    </Button>
                  )}
                  {selectedOrder.status === 'processing' && (
                    <Button
                      onClick={() =>
                        handleUpdateStatus(selectedOrder.id, 'ready')
                      }
                      disabled={updateOrderStatusMutation.isPending}
                      className="flex-1"
                    >
                      {updateOrderStatusMutation.isPending ? 'Updating...' : 'Mark as Ready'}
                    </Button>
                  )}
                  {selectedOrder.status === 'ready' && (
                    <Button
                      onClick={() =>
                        handleUpdateStatus(selectedOrder.id, 'completed')
                      }
                      disabled={updateOrderStatusMutation.isPending}
                      className="flex-1"
                    >
                      {updateOrderStatusMutation.isPending ? 'Completing...' : 'Complete Order'}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorOrders;