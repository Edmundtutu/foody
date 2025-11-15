import React, { useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRestaurantsByOwner } from '@/hooks/queries/useRestaurants';
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
import { Package, Eye } from 'lucide-react';
import type { Order } from '@/services/orderService';

const VendorOrders: React.FC = () => {
  const { user } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Load current vendor's first restaurant as the active restaurant
  const { data: restaurants } = useRestaurantsByOwner(user?.id);
  const activeRestaurantId = useMemo(
    () => restaurants?.[0]?.id as string | undefined,
    [restaurants]
  );

  // Fetch orders for the restaurant
  const { data: orders, isLoading, isError } = useRestaurantOrders(
    activeRestaurantId || null
  );
  const updateOrderStatusMutation = useUpdateOrderStatus();

  // Filter orders by status
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    if (statusFilter === 'all') return orders;
    return orders.filter((order) => order.status === statusFilter);
  }, [orders, statusFilter]);

  // Handle order status update
  const handleUpdateStatus = async (
    orderId: string,
    status: Order['status']
  ) => {
    try {
      await updateOrderStatusMutation.mutateAsync({ orderId, status });
      toast.success(`Order status updated to ${status}`);
      setSelectedOrder(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update order status');
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
  if (!activeRestaurantId) {
    return (
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No restaurant found</h3>
            <p className="text-muted-foreground">
              Create a restaurant to view orders.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">Incoming Orders</h1>
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Could not fetch vendor orders. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
            Incoming Orders
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and track your restaurant orders
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
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
            <p className="text-muted-foreground">
              {statusFilter === 'all'
                ? 'No orders found.'
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
              onOpenConversation={() => setSelectedOrder(order)}
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
                    <Badge variant="outline" className="mt-1">
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
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <div>
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
                        <p className="font-semibold">
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
                    <p className="p-2 border rounded bg-muted/50">
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
                        Accept Order
                      </Button>
                      <Button
                        onClick={() =>
                          handleUpdateStatus(selectedOrder.id, 'cancelled')
                        }
                        disabled={updateOrderStatusMutation.isPending}
                        variant="destructive"
                        className="flex-1"
                      >
                        Cancel Order
                      </Button>
                    </>
                  )}
                  {selectedOrder.status === 'confirmed' && (
                    <Button
                      onClick={() =>
                        handleUpdateStatus(selectedOrder.id, 'preparing')
                      }
                      disabled={updateOrderStatusMutation.isPending}
                      className="flex-1"
                    >
                      Start Preparing
                    </Button>
                  )}
                  {selectedOrder.status === 'preparing' && (
                    <Button
                      onClick={() =>
                        handleUpdateStatus(selectedOrder.id, 'ready')
                      }
                      disabled={updateOrderStatusMutation.isPending}
                      className="flex-1"
                    >
                      Mark as Ready
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
                      Complete Order
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