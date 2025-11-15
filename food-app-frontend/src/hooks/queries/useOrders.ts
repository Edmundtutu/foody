import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import orderService, {
  type Order,
  type OrderFilters,
  type UpdateOrderStatusData,
} from '@/services/orderService';

/**
 * Hook to fetch orders with optional filters
 */
export function useOrders(filters?: OrderFilters) {
  return useQuery<Order[]>({
    queryKey: ['orders', filters],
    queryFn: () => orderService.getOrders(filters),
    staleTime: 1000 * 30, // 30 seconds (orders change frequently)
    refetchInterval: 1000 * 60, // Refetch every minute
  });
}

/**
 * Hook to fetch restaurant orders
 */
export function useRestaurantOrders(restaurantId: string | null) {
  return useQuery<Order[]>({
    queryKey: ['restaurantOrders', restaurantId],
    queryFn: () => orderService.getRestaurantOrders(restaurantId!),
    enabled: !!restaurantId,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
  });
}

/**
 * Hook to fetch a single order
 */
export function useOrder(orderId: string | null) {
  return useQuery<Order>({
    queryKey: ['order', orderId],
    queryFn: () => orderService.getOrder(orderId!),
    enabled: !!orderId,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 30, // Refetch every 30 seconds
  });
}

/**
 * Hook to update order status with optimistic updates
 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      status,
    }: {
      orderId: string;
      status: UpdateOrderStatusData['status'];
    }) => orderService.updateOrderStatus(orderId, status),
    onMutate: async ({ orderId, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['order', orderId] });
      await queryClient.cancelQueries({ queryKey: ['orders'] });
      await queryClient.cancelQueries({ queryKey: ['restaurantOrders'] });

      // Snapshot previous values
      const previousOrder = queryClient.getQueryData<Order>(['order', orderId]);
      const previousOrders = queryClient.getQueryData<Order[]>(['orders']);

      // Optimistically update the order
      if (previousOrder) {
        queryClient.setQueryData<Order>(['order', orderId], {
          ...previousOrder,
          status,
        });
      }

      // Optimistically update orders list
      if (previousOrders) {
        queryClient.setQueryData<Order[]>(
          ['orders'],
          previousOrders.map((order) =>
            order.id === orderId ? { ...order, status } : order
          )
        );
      }

      // Return context with snapshots
      return { previousOrder, previousOrders };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousOrder) {
        queryClient.setQueryData(['order', variables.orderId], context.previousOrder);
      }
      if (context?.previousOrders) {
        queryClient.setQueryData(['orders'], context.previousOrders);
      }
    },
    onSuccess: (updatedOrder) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['order', updatedOrder.id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['restaurantOrders'] });
    },
  });
}

