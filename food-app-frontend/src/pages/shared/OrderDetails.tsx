import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useVendor } from '@/context/VendorContext';
import { useOrder, useUpdateOrderStatus } from '@/hooks/queries/useOrders';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import agentService from '@/services/agentService';
import dispatchService from '@/services/dispatchService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    ArrowLeft,
    Clock,
    MapPin,
    Phone,
    Truck,
    User,
    Package,
    CheckCircle,
    AlertCircle,
    Navigation,
    Store,
    Receipt,
    MessageCircle,
    Layers,
    UserPlus,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { DELIVERY_STATUS_CONFIG, FLEET_KIND_CONFIG } from '@/types/delivery';
import type { DeliveryStatus, Order, OrderItem, Agent } from '@/types';
import OrderChat from '@/components/vendor/OrderChat';
import DeliveryMap from '@/components/delivery/DeliveryMap';
import { toast } from 'sonner';

/**
 * Order status configuration for display
 */
const ORDER_STATUS_CONFIG: Record<Order['status'], {
    label: string;
    color: string;
    bgColor: string;
}> = {
    pending: { label: 'Pending', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
    confirmed: { label: 'Confirmed', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    processing: { label: 'Preparing', color: 'text-purple-700', bgColor: 'bg-purple-100' },
    ready: { label: 'Ready', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
    completed: { label: 'Completed', color: 'text-green-700', bgColor: 'bg-green-100' },
    cancelled: { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-100' },
};

/**
 * Delivery progress tracker component
 * Note: PENDING is an internal status - customer tracking starts at ASSIGNED
 */
const DeliveryProgress: React.FC<{ status: DeliveryStatus }> = ({ status }) => {
    // Delivery tracking starts at ASSIGNED (when agent is assigned)
    // PENDING is internal status before agent assignment
    const steps: { key: DeliveryStatus; label: string }[] = [
        { key: 'ASSIGNED', label: 'Assigned' },
        { key: 'PICKED_UP', label: 'Picked Up' },
        { key: 'ON_THE_WAY', label: 'On The Way' },
        { key: 'DELIVERED', label: 'Delivered' },
    ];

    // If status is PENDING, show no progress (index -1)
    const currentIndex = status === 'PENDING' ? -1 : steps.findIndex((step) => step.key === status);

    return (
        <div className="relative">
            <div className="flex justify-between mb-2">
                {steps.map((step, index) => {
                    const isActive = index <= currentIndex;
                    const isCurrent = index === currentIndex;
                    return (
                        <div key={step.key} className="flex flex-col items-center flex-1">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                                    isCurrent
                                        ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                                        : isActive
                                            ? 'bg-primary/80 text-primary-foreground'
                                            : 'bg-muted text-muted-foreground'
                                }`}
                            >
                                {index + 1}
                            </div>
                            <span className={`text-xs mt-1 text-center ${isActive ? 'font-medium' : 'text-muted-foreground'}`}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted -z-10 mx-8">
                <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
                />
            </div>
        </div>
    );
};

/**
 * Order status progress tracker for vendors
 */
const OrderProgress: React.FC<{ status: Order['status'] }> = ({ status }) => {
    const steps: { key: Order['status']; label: string }[] = [
        { key: 'pending', label: 'Pending' },
        { key: 'confirmed', label: 'Confirmed' },
        { key: 'processing', label: 'Preparing' },
        { key: 'ready', label: 'Ready' },
        { key: 'completed', label: 'Completed' },
    ];

    const currentIndex = steps.findIndex((step) => step.key === status);
    const isCancelled = status === 'cancelled';

    if (isCancelled) {
        return (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-700 font-medium">Order Cancelled</span>
            </div>
        );
    }

    return (
        <div className="relative">
            <div className="flex justify-between mb-2">
                {steps.map((step, index) => {
                    const isActive = index <= currentIndex;
                    const isCurrent = index === currentIndex;
                    return (
                        <div key={step.key} className="flex flex-col items-center flex-1">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                                    isCurrent
                                        ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                                        : isActive
                                            ? 'bg-primary/80 text-primary-foreground'
                                            : 'bg-muted text-muted-foreground'
                                }`}
                            >
                                {isActive ? <CheckCircle className="h-4 w-4" /> : index + 1}
                            </div>
                            <span className={`text-xs mt-1 text-center ${isActive ? 'font-medium' : 'text-muted-foreground'}`}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted -z-10 mx-8">
                <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
                />
            </div>
        </div>
    );
};

/**
 * Format currency in UGX
 */
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-UG', {
        style: 'currency',
        currency: 'UGX',
        minimumFractionDigits: 0,
    }).format(amount);
};

/**
 * Format date for display
 */
const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-UG', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
};

/**
 * Loading skeleton for order details
 */
const OrderDetailsSkeleton: React.FC = () => (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded" />
            <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
            </div>
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
    </div>
);

/**
 * Shared OrderDetails page component
 * Serves both customers and vendors with role-based content
 */
const OrderDetails: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { restaurant } = useVendor();
    const queryClient = useQueryClient();
    const { data: order, isLoading, error } = useOrder(orderId ?? null);
    const updateOrderStatusMutation = useUpdateOrderStatus();
    const [isChatOpen, setIsChatOpen] = React.useState(false);
    const [isAssignDialogOpen, setIsAssignDialogOpen] = React.useState(false);
    const [selectedAgentId, setSelectedAgentId] = React.useState<string>('');
    const [expandedCombos, setExpandedCombos] = React.useState<Set<string>>(new Set());

    const isVendor = user?.role === 'restaurant';
    const isCustomer = user?.role === 'customer';

    // Fetch available agents for assignment (vendor only)
    const { data: availableAgents, isLoading: isLoadingAgents } = useQuery({
        queryKey: ['available-agents', restaurant?.id],
        queryFn: () => agentService.getAvailableAgents(restaurant?.id ?? ''),
        enabled: isVendor && !!restaurant?.id && isAssignDialogOpen,
        staleTime: 30000,
    });

    // Agent assignment mutation - auto-creates logistics if needed
    const assignAgentMutation = useMutation({
        mutationFn: async ({ orderId, agentId }: { orderId: string; agentId: string }) => {
            // Auto-create logistics record if it doesn't exist yet
            // This happens when order reaches READY status for DELIVERY orders
            if (!order?.logistics) {
                await dispatchService.createLogistics(orderId);
            }
            return dispatchService.assignAgent(orderId, { agent_id: agentId });
        },
        onSuccess: () => {
            toast.success('Agent assigned successfully');
            setIsAssignDialogOpen(false);
            setSelectedAgentId('');
            queryClient.invalidateQueries({ queryKey: ['order', orderId] });
        },
        onError: (err: Error) => {
            toast.error(err.message || 'Failed to assign agent');
        },
    });

    // Helper: Get item name for polymorphic items (dish or combo)
    const getOrderItemName = (item: OrderItem): string => {
        if (item.type === 'combo' && item.combo_selection) {
            const dishNames = item.combo_selection.items
                .map((ci) => ci.dish?.name)
                .filter(Boolean);
            return dishNames.length > 0 ? dishNames.join(', ') : 'Combo';
        }
        return item.dish?.name || item.product?.name || 'Item';
    };

    // Helper: Check if item is a combo
    const isComboItem = (item: OrderItem): boolean => {
        return item.type === 'combo' || !!item.combo_selection_id;
    };

    // Toggle combo expansion
    const toggleComboExpand = (itemId: string) => {
        setExpandedCombos((prev) => {
            const next = new Set(prev);
            if (next.has(itemId)) {
                next.delete(itemId);
            } else {
                next.add(itemId);
            }
            return next;
        });
    };

    // Can assign agent: vendor + ready status + delivery order + no agent assigned
    const canAssignAgent =
        isVendor &&
        order?.status === 'ready' &&
        order?.order_type === 'DELIVERY' &&
        !order?.logistics?.agent;

    const handleAssignAgent = () => {
        if (!orderId || !selectedAgentId) return;
        assignAgentMutation.mutate({ orderId, agentId: selectedAgentId });
    };

    const handleStatusUpdate = (newStatus: Order['status']) => {
        if (!orderId) return;
        updateOrderStatusMutation.mutate(
            { orderId, status: newStatus },
            {
                onSuccess: () => {
                    // Status updated successfully
                },
            }
        );
    };

    const handleBack = () => {
        if (isVendor) {
            navigate('/vendor/orders');
        } else {
            navigate('/profile');
        }
    };

    if (isLoading) {
        return (
            <div className="container max-w-4xl mx-auto px-4 py-6">
                <OrderDetailsSkeleton />
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="container max-w-4xl mx-auto px-4 py-6">
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                        <h3 className="text-lg font-medium">Order not found</h3>
                        <p className="text-muted-foreground mt-2">
                            The order you're looking for doesn't exist or you don't have permission to view it.
                        </p>
                        <Button className="mt-4" onClick={handleBack}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Go Back
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const statusConfig = ORDER_STATUS_CONFIG[order.status];

    return (
        <div className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={handleBack}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-xl font-semibold">
                            Order #{order.id.slice(-8).toUpperCase()}
                        </h1>
                        <Badge className={`${statusConfig.bgColor} ${statusConfig.color}`}>
                            {statusConfig.label}
                        </Badge>
                        {order.order_type === 'DELIVERY' && (
                            <Badge variant="outline" className="gap-1">
                                <Truck className="h-3 w-3" />
                                Delivery
                            </Badge>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="h-4 w-4" />
                        {formatDate(order.created_at)}
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setIsChatOpen(true)}>
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Chat
                </Button>
            </div>

            {/* Order Progress - Vendor View */}
            {isVendor && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Order Progress
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <OrderProgress status={order.status} />
                    </CardContent>
                </Card>
            )}

            {/* Delivery Tracking - Customer View for Delivery Orders */}
            {isCustomer && order.order_type === 'DELIVERY' && order.logistics && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            Delivery Tracking
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <DeliveryProgress status={order.logistics.delivery_status} />

                        {/* Live Delivery Map */}
                        {['ASSIGNED', 'PICKED_UP', 'ON_THE_WAY'].includes(order.logistics.delivery_status) && (
                            <DeliveryMap
                                orderId={order.id}
                                pickupLocation={order.logistics.pickup_address?.lat && order.logistics.pickup_address?.lng ? {
                                    lat: order.logistics.pickup_address.lat,
                                    lng: order.logistics.pickup_address.lng,
                                    name: order.restaurant?.name || 'Restaurant',
                                } : undefined}
                                dropoffLocation={order.logistics.delivery_address?.lat && order.logistics.delivery_address?.lng ? {
                                    lat: order.logistics.delivery_address.lat,
                                    lng: order.logistics.delivery_address.lng,
                                    name: order.delivery_address?.street || 'Delivery Address',
                                } : undefined}
                                agent={order.logistics.agent}
                                deliveryStatus={order.logistics.delivery_status}
                                showHeader={false}
                                height="250px"
                            />
                        )}

                        {/* Agent Info */}
                        {order.logistics.agent && (
                            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center border">
                                    <User className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium">{order.logistics.agent.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                        {FLEET_KIND_CONFIG[order.logistics.agent.fleet_kind]?.label || order.logistics.agent.fleet_kind}
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" asChild>
                                    <a href={`tel:${order.logistics.agent.phone_number}`}>
                                        <Phone className="h-4 w-4 mr-1" />
                                        Call
                                    </a>
                                </Button>
                            </div>
                        )}

                        {/* Delivery Address */}
                        {order.delivery_address && (
                            <div className="flex items-start gap-2 text-sm">
                                <Navigation className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <div className="text-muted-foreground">Delivery Address</div>
                                    <div>
                                        {order.delivery_address.street}
                                        {order.delivery_address.city && `, ${order.delivery_address.city}`}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Confirm Delivery Button */}
                        {order.logistics.delivery_status === 'DELIVERED' && order.status !== 'completed' && (
                            <Button
                                className="w-full"
                                onClick={() => handleStatusUpdate('completed')}
                                disabled={updateOrderStatusMutation.isPending}
                            >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {updateOrderStatusMutation.isPending ? 'Confirming...' : 'Confirm Delivery Received'}
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Delivery Info - Vendor View for Delivery Orders */}
            {isVendor && order.order_type === 'DELIVERY' && order.logistics && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            Delivery Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Status</span>
                            <Badge className={`${DELIVERY_STATUS_CONFIG[order.logistics.delivery_status].bgColor} ${DELIVERY_STATUS_CONFIG[order.logistics.delivery_status].color}`}>
                                {DELIVERY_STATUS_CONFIG[order.logistics.delivery_status].label}
                            </Badge>
                        </div>

                        {/* Live Delivery Map - Vendor View */}
                        {['ASSIGNED', 'PICKED_UP', 'ON_THE_WAY'].includes(order.logistics.delivery_status) && (
                            <DeliveryMap
                                orderId={order.id}
                                pickupLocation={order.logistics.pickup_address?.lat && order.logistics.pickup_address?.lng ? {
                                    lat: order.logistics.pickup_address.lat,
                                    lng: order.logistics.pickup_address.lng,
                                    name: 'Restaurant',
                                } : undefined}
                                dropoffLocation={order.logistics.delivery_address?.lat && order.logistics.delivery_address?.lng ? {
                                    lat: order.logistics.delivery_address.lat,
                                    lng: order.logistics.delivery_address.lng,
                                    name: order.delivery_address?.street || 'Delivery Address',
                                } : undefined}
                                agent={order.logistics.agent}
                                deliveryStatus={order.logistics.delivery_status}
                                showHeader={false}
                                height="200px"
                            />
                        )}

                        {order.logistics.agent ? (
                            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                <div className="h-10 w-10 rounded-full bg-background flex items-center justify-center border">
                                    <User className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium">{order.logistics.agent.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                        {FLEET_KIND_CONFIG[order.logistics.agent.fleet_kind]?.label || order.logistics.agent.fleet_kind}
                                        {order.logistics.agent.phone_number && ` • ${order.logistics.agent.phone_number}`}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">No agent assigned yet</p>
                                {canAssignAgent && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsAssignDialogOpen(true)}
                                        className="w-full"
                                    >
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Assign Delivery Agent
                                    </Button>
                                )}
                            </div>
                        )}

                        {order.delivery_address && (
                            <div className="flex items-start gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <div className="text-muted-foreground">Delivery To</div>
                                    <div>
                                        {order.delivery_address.street}
                                        {order.delivery_address.city && `, ${order.delivery_address.city}`}
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Assign Agent Button - Show when no logistics yet but can assign */}
            {canAssignAgent && !order.logistics && (
                <Card>
                    <CardContent className="pt-6">
                        <Button
                            variant="outline"
                            onClick={() => setIsAssignDialogOpen(true)}
                            className="w-full"
                        >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Assign Delivery Agent
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Customer Info - Vendor View */}
            {isVendor && order.user && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Customer
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                <User className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <div className="font-medium">{order.user.name}</div>
                                {order.user.email && (
                                    <div className="text-sm text-muted-foreground">{order.user.email}</div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Restaurant Info - Customer View */}
            {isCustomer && order.restaurant && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Store className="h-4 w-4" />
                            Restaurant
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                <Store className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                                <div className="font-medium">{order.restaurant.name}</div>
                                {order.restaurant.address && (
                                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {order.restaurant.address}
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Order Items */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Receipt className="h-4 w-4" />
                        Order Items
                    </CardTitle>
                    <CardDescription>
                        {order.items?.length || 0} item(s)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {order.items?.map((item) => {
                            const isCombo = isComboItem(item);
                            const isExpanded = expandedCombos.has(item.id);
                            const comboItems = item.combo_selection?.items || [];

                            return (
                                <div key={item.id} className="border rounded-lg overflow-hidden">
                                    <div
                                        className={`flex items-center justify-between p-3 ${isCombo ? 'cursor-pointer hover:bg-muted/50' : ''}`}
                                        onClick={() => isCombo && comboItems.length > 0 && toggleComboExpand(item.id)}
                                    >
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            {isCombo && (
                                                <Layers className="h-4 w-4 text-muted-foreground shrink-0" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate">
                                                    {getOrderItemName(item)}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    Qty: {item.quantity} × {formatCurrency(item.unit_price)}
                                                </div>
                                                {item.notes && (
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        Note: {item.notes}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold">
                                                {formatCurrency(item.quantity * item.unit_price)}
                                            </span>
                                            {isCombo && comboItems.length > 0 && (
                                                isExpanded ? (
                                                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                                ) : (
                                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                )
                                            )}
                                        </div>
                                    </div>
                                    {/* Expanded combo items */}
                                    {isCombo && isExpanded && comboItems.length > 0 && (
                                        <div className="border-t bg-muted/30 px-3 py-2 space-y-1">
                                            <div className="text-xs text-muted-foreground font-medium mb-1">
                                                Combo includes:
                                            </div>
                                            {comboItems.map((ci) => (
                                                <div key={ci.id} className="flex items-center justify-between text-sm">
                                                    <span>{ci.dish?.name || 'Item'}</span>
                                                    <span className="text-muted-foreground">
                                                        {formatCurrency(ci.price)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        <div className="border-t pt-3 flex justify-between font-semibold text-lg">
                            <span>Total</span>
                            <span>{formatCurrency(order.total)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Order Notes */}
            {order.notes && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{order.notes}</p>
                    </CardContent>
                </Card>
            )}

            {/* Vendor Action Buttons */}
            {isVendor && order.status !== 'cancelled' && order.status !== 'completed' && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-wrap gap-2">
                            {order.status === 'pending' && (
                                <>
                                    <Button
                                        className="flex-1"
                                        onClick={() => handleStatusUpdate('confirmed')}
                                        disabled={updateOrderStatusMutation.isPending}
                                    >
                                        {updateOrderStatusMutation.isPending ? 'Accepting...' : 'Accept Order'}
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        className="flex-1"
                                        onClick={() => handleStatusUpdate('cancelled')}
                                        disabled={updateOrderStatusMutation.isPending}
                                    >
                                        {updateOrderStatusMutation.isPending ? 'Cancelling...' : 'Cancel Order'}
                                    </Button>
                                </>
                            )}
                            {order.status === 'confirmed' && (
                                <Button
                                    className="flex-1"
                                    onClick={() => handleStatusUpdate('processing')}
                                    disabled={updateOrderStatusMutation.isPending}
                                >
                                    {updateOrderStatusMutation.isPending ? 'Starting...' : 'Start Preparing'}
                                </Button>
                            )}
                            {order.status === 'processing' && (
                                <Button
                                    className="flex-1"
                                    onClick={() => handleStatusUpdate('ready')}
                                    disabled={updateOrderStatusMutation.isPending}
                                >
                                    {updateOrderStatusMutation.isPending ? 'Updating...' : 'Mark as Ready'}
                                </Button>
                            )}
                            {/* Complete Order - only for non-delivery orders at ready status */}
                            {/* Delivery orders are auto-completed when delivery_status = DELIVERED */}
                            {order.status === 'ready' && order.order_type !== 'DELIVERY' && (
                                <Button
                                    className="flex-1"
                                    onClick={() => handleStatusUpdate('completed')}
                                    disabled={updateOrderStatusMutation.isPending}
                                >
                                    {updateOrderStatusMutation.isPending ? 'Completing...' : 'Complete Order'}
                                </Button>
                            )}
                            {/* For delivery orders at ready status, show assign agent prompt */}
                            {order.status === 'ready' && order.order_type === 'DELIVERY' && !order.logistics?.agent && (
                                <Button
                                    className="flex-1"
                                    onClick={() => setIsAssignDialogOpen(true)}
                                    variant="default"
                                >
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Assign Delivery Agent
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Order Chat */}
            {isChatOpen && (
                <OrderChat
                    orderId={order.id}
                    isOpen={isChatOpen}
                    onClose={() => setIsChatOpen(false)}
                    context={isVendor ? 'restaurant' : 'customer'}
                />
            )}

            {/* Agent Assignment Dialog */}
            <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Delivery Agent</DialogTitle>
                        <DialogDescription>
                            Select an available agent to deliver this order.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        {isLoadingAgents ? (
                            <div className="space-y-2">
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ) : availableAgents && availableAgents.length > 0 ? (
                            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an agent" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableAgents
                                        .sort((a: Agent, b: Agent) => (a.current_load || 0) - (b.current_load || 0))
                                        .map((agent: Agent) => (
                                            <SelectItem key={agent.id} value={agent.id}>
                                                <div className="flex items-center gap-2">
                                                    <span>{agent.name}</span>
                                                    <span className="text-muted-foreground text-xs">
                                                        ({FLEET_KIND_CONFIG[agent.fleet_kind]?.label || agent.fleet_kind})
                                                    </span>
                                                    {agent.current_load !== undefined && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {agent.current_load} active
                                                        </Badge>
                                                    )}
                                                </div>
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No available agents at the moment.
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAssignAgent}
                            disabled={!selectedAgentId || assignAgentMutation.isPending}
                        >
                            {assignAgentMutation.isPending ? 'Assigning...' : 'Assign Agent'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default OrderDetails;
