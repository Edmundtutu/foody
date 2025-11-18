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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
            Incoming Orders
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and track your restaurant orders
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="preparing">Preparing</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
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
              onStartPost={() => {}}
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