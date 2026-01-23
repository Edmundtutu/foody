import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import orderService from '@/services/orderService';
import dispatchService from '@/services/dispatchService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
    Package,
    Clock,
    MapPin,
    CheckCircle,
    AlertCircle,
    Truck,
    Navigation,
    Phone,
    User,
} from 'lucide-react';
import type { Order } from '@/types/orders';
import type { DeliveryStatus } from '@/types/delivery';
import { DELIVERY_STATUS_CONFIG, FLEET_KIND_CONFIG } from '@/types/delivery';

const ORDER_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
    pending: { label: 'Pending', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
    confirmed: { label: 'Confirmed', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    processing: { label: 'Processing', color: 'text-purple-700', bgColor: 'bg-purple-100' },
    ready: { label: 'Ready', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
    completed: { label: 'Completed', color: 'text-green-700', bgColor: 'bg-green-100' },
    cancelled: { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-100' },
};

const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
};

const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
    }).format(amount);
};

const DeliveryProgress: React.FC<{ status: DeliveryStatus }> = ({ status }) => {
    const steps: DeliveryStatus[] = ['PENDING', 'ASSIGNED', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED'];
    const currentIndex = steps.indexOf(status);

    return (
        <div className="flex items-center justify-between w-full">
            {steps.map((step, index) => {
                const isCompleted = index <= currentIndex;
                const isCurrent = index === currentIndex;
                return (
                    <React.Fragment key={step}>
                        <div className="flex flex-col items-center">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                    isCompleted
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground'
                                } ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                            >
                                {isCompleted ? <CheckCircle className="h-4 w-4" /> : index + 1}
                            </div>
                            <span className={`text-xs mt-1 ${isCompleted ? 'text-primary' : 'text-muted-foreground'}`}>
                                {DELIVERY_STATUS_CONFIG[step].label}
                            </span>
                        </div>
                        {index < steps.length - 1 && (
                            <div
                                className={`flex-1 h-0.5 mx-2 ${
                                    index < currentIndex ? 'bg-primary' : 'bg-muted'
                                }`}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

const Order: React.FC = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Fetch user orders
    const { data: orders, isLoading, isError } = useQuery({
        queryKey: ['orders'],
        queryFn: () => orderService.getOrders(),
    });

    // Filter orders
    const filteredOrders = orders?.filter((order) => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'active') {
            return ['pending', 'confirmed', 'processing', 'ready'].includes(order.status);
        }
        return order.status === statusFilter;
    }) || [];

    // Sort by created_at descending
    const sortedOrders = [...filteredOrders].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Navigate to order details
    const handleViewOrder = (orderId: string) => {
        navigate(`/orders/${orderId}`);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen p-4">
                <div className="max-w-4xl mx-auto space-y-6">
                    <Skeleton className="h-8 w-48" />
                    <div className="flex gap-2">
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-9 w-24" />
                        ))}
                    </div>
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} className="h-48" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="min-h-screen p-4">
                <div className="max-w-4xl mx-auto">
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                            <h3 className="text-lg font-medium">Failed to load orders</h3>
                            <p className="text-muted-foreground text-center mt-2">
                                Please try refreshing the page.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4">
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">My Orders</h1>
                    <p className="text-muted-foreground">Track and manage your orders</p>
                </div>

                {/* Filter */}
                <div className="flex gap-2 flex-wrap">
                    {[
                        { value: 'all', label: 'All' },
                        { value: 'active', label: 'Active' },
                        { value: 'completed', label: 'Completed' },
                        { value: 'cancelled', label: 'Cancelled' },
                    ].map((filter) => (
                        <Button
                            key={filter.value}
                            variant={statusFilter === filter.value ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStatusFilter(filter.value)}
                        >
                            {filter.label}
                        </Button>
                    ))}
                </div>

                {/* Orders List */}
                {sortedOrders.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Package className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium">No orders found</h3>
                            <p className="text-muted-foreground text-center mt-2">
                                {statusFilter === 'all'
                                    ? "You haven't placed any orders yet."
                                    : 'No orders match the selected filter.'}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {sortedOrders.map((order) => (
                            <Card key={order.id} className="cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => handleViewOrder(order.id)}>
                                <CardContent className="pt-6">
                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-medium">
                                                    Order #{order.id.slice(-8).toUpperCase()}
                                                </span>
                                                <Badge className={`${ORDER_STATUS_CONFIG[order.status].bgColor} ${ORDER_STATUS_CONFIG[order.status].color}`}>
                                                    {ORDER_STATUS_CONFIG[order.status].label}
                                                </Badge>
                                                {order.order_type === 'DELIVERY' && (
                                                    <Badge variant="outline" className="gap-1">
                                                        <Truck className="h-3 w-3" />
                                                        Delivery
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                                                <Clock className="h-4 w-4" />
                                                {formatDate(order.created_at)}
                                            </div>
                                            {order.restaurant && (
                                                <div className="text-sm">{order.restaurant.name}</div>
                                            )}
                                            <div className="text-sm">
                                                {order.items?.length || 0} item(s) - {formatCurrency(order.total)}
                                            </div>
                                        </div>

                                        {/* Delivery tracking mini view - only show when agent assigned (not PENDING) */}
                                        {order.order_type === 'DELIVERY' && order.logistics && order.logistics.delivery_status !== 'PENDING' && (
                                            <div className="flex items-center gap-2">
                                                <Badge className={`${DELIVERY_STATUS_CONFIG[order.logistics.delivery_status].bgColor} ${DELIVERY_STATUS_CONFIG[order.logistics.delivery_status].color}`}>
                                                    {DELIVERY_STATUS_CONFIG[order.logistics.delivery_status].label}
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Order;
