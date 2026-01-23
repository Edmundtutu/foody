import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVendor } from '@/context/VendorContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dispatchService from '@/services/dispatchService';
import agentService from '@/services/agentService';
import orderService from '@/services/orderService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
    Package,
    MapPin,
    User,
    AlertCircle,
    CheckCircle,
    Navigation,
    Truck,
    Clock,
    UserPlus,
} from 'lucide-react';
import type {
    OrderLogistics,
    Agent,
    DeliveryStatus,
} from '@/types/delivery';
import type { Order } from '@/types';
import {
    DELIVERY_STATUS_CONFIG,
    FLEET_KIND_CONFIG,
} from '@/types/delivery';

const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
};

const formatAddress = (address: { street?: string; city?: string } | null): string => {
    if (!address) return 'N/A';
    return [address.street, address.city].filter(Boolean).join(', ');
};

const VendorDeliveries: React.FC = () => {
    const { restaurantId, hasRestaurant, isLoading: vendorLoading } = useVendor();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    const [selectedLogistics, setSelectedLogistics] = useState<OrderLogistics | null>(null);
    const [selectedAgentId, setSelectedAgentId] = useState<string>('');

    // State for assigning agent to ready orders (orders without logistics yet)
    const [selectedReadyOrder, setSelectedReadyOrder] = useState<Order | null>(null);
    const [isReadyOrderDialogOpen, setIsReadyOrderDialogOpen] = useState(false);

    // Fetch logistics
    const { data: logistics, isLoading, isError } = useQuery({
        queryKey: ['logistics', restaurantId],
        queryFn: () => dispatchService.getLogistics(restaurantId!),
        enabled: !!restaurantId,
    });

    // Fetch restaurant orders to find DELIVERY orders at READY status without logistics
    const { data: orders } = useQuery({
        queryKey: ['restaurantOrders', restaurantId],
        queryFn: () => orderService.getRestaurantOrders(restaurantId!),
        enabled: !!restaurantId,
    });

    // Filter for orders ready for dispatch (DELIVERY + ready status + no logistics)
    const readyForDispatch = orders?.filter(
        (order) =>
            order.order_type === 'DELIVERY' &&
            order.status === 'ready' &&
            !order.logistics
    ) || [];

    // Fetch available agents for assignment
    const { data: availableAgents } = useQuery({
        queryKey: ['agents', restaurantId, 'available'],
        queryFn: () => agentService.getAvailableAgents(restaurantId!),
        enabled: !!restaurantId && (isAssignDialogOpen || isReadyOrderDialogOpen),
    });

    // Mutations
    const assignMutation = useMutation({
        mutationFn: ({ orderId, agentId }: { orderId: string; agentId: string }) =>
            dispatchService.assignAgent(orderId, { agent_id: agentId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['logistics', restaurantId] });
            queryClient.invalidateQueries({ queryKey: ['agents', restaurantId] });
            toast.success('Agent assigned successfully');
            setIsAssignDialogOpen(false);
            setSelectedLogistics(null);
            setSelectedAgentId('');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to assign agent');
        },
    });

    const unassignMutation = useMutation({
        mutationFn: (orderId: string) => dispatchService.unassignAgent(orderId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['logistics', restaurantId] });
            queryClient.invalidateQueries({ queryKey: ['agents', restaurantId] });
            toast.success('Agent unassigned');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to unassign agent');
        },
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: DeliveryStatus }) =>
            dispatchService.updateStatus(id, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['logistics', restaurantId] });
            toast.success('Delivery status updated');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to update status');
        },
    });

    // Mutation to create logistics and assign agent for ready orders
    const assignToReadyOrderMutation = useMutation({
        mutationFn: async ({ orderId, agentId }: { orderId: string; agentId: string }) => {
            // First create logistics (uses order's delivery_address automatically)
            await dispatchService.createLogistics(orderId);
            // Then assign agent
            return dispatchService.assignAgent(orderId, { agent_id: agentId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['logistics', restaurantId] });
            queryClient.invalidateQueries({ queryKey: ['restaurantOrders', restaurantId] });
            queryClient.invalidateQueries({ queryKey: ['agents', restaurantId] });
            toast.success('Agent assigned successfully');
            setIsReadyOrderDialogOpen(false);
            setSelectedReadyOrder(null);
            setSelectedAgentId('');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to assign agent');
        },
    });

    // Filter logistics
    const filteredLogistics = logistics?.filter((item) => {
        if (statusFilter === 'all') return true;
        return item.delivery_status === statusFilter;
    }) || [];

    // Stats
    const stats = {
        total: logistics?.length || 0,
        pending: logistics?.filter((l) => l.delivery_status === 'PENDING').length || 0,
        inProgress: logistics?.filter((l) =>
            ['ASSIGNED', 'PICKED_UP', 'ON_THE_WAY'].includes(l.delivery_status)
        ).length || 0,
        delivered: logistics?.filter((l) => l.delivery_status === 'DELIVERED').length || 0,
        readyForDispatch: readyForDispatch.length,
    };

    const openAssignDialog = (logistics: OrderLogistics) => {
        setSelectedLogistics(logistics);
        setIsAssignDialogOpen(true);
    };

    const handleAssign = () => {
        if (!selectedLogistics || !selectedAgentId) return;
        assignMutation.mutate({
            orderId: selectedLogistics.order_id,
            agentId: selectedAgentId,
        });
    };

    // Handler for assigning agent to ready order
    const handleAssignToReadyOrder = () => {
        if (!selectedReadyOrder || !selectedAgentId) return;
        assignToReadyOrderMutation.mutate({
            orderId: selectedReadyOrder.id,
            agentId: selectedAgentId,
        });
    };

    const getNextStatus = (current: DeliveryStatus): DeliveryStatus | null => {
        const progression: Record<DeliveryStatus, DeliveryStatus | null> = {
            PENDING: 'ASSIGNED',
            ASSIGNED: 'PICKED_UP',
            PICKED_UP: 'ON_THE_WAY',
            ON_THE_WAY: 'DELIVERED',
            DELIVERED: null,
        };
        return progression[current];
    };

    if (vendorLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-24" />
                    ))}
                </div>
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
            </div>
        );
    }

    if (!hasRestaurant) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No Restaurant Found</h3>
                    <p className="text-muted-foreground text-center mt-2">
                        Please create a restaurant profile first to manage deliveries.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold">Deliveries</h1>
                <p className="text-muted-foreground">
                    Track and manage delivery orders
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-muted-foreground text-sm">Total Deliveries</p>
                    </CardContent>
                </Card>
                <Card className={stats.readyForDispatch > 0 ? 'border-orange-300 bg-orange-50' : ''}>
                    <CardContent className="pt-6">
                        <div className={`text-2xl font-bold ${stats.readyForDispatch > 0 ? 'text-orange-600' : ''}`}>
                            {stats.readyForDispatch}
                        </div>
                        <p className="text-muted-foreground text-sm">Ready for Dispatch</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                        <p className="text-muted-foreground text-sm">Pending Assignment</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
                        <p className="text-muted-foreground text-sm">In Progress</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
                        <p className="text-muted-foreground text-sm">Delivered</p>
                    </CardContent>
                </Card>
            </div>

            {/* Ready for Dispatch Section */}
            {readyForDispatch.length > 0 && (
                <Card className="border-orange-200 bg-orange-50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2 text-orange-800">
                            <Clock className="h-5 w-5" />
                            Ready for Dispatch ({readyForDispatch.length})
                        </CardTitle>
                        <p className="text-sm text-orange-700">
                            These delivery orders are ready and need an agent assigned
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {readyForDispatch.map((order) => (
                            <div
                                key={order.id}
                                className="flex items-center justify-between p-3 bg-white rounded-lg border"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Package className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">
                                            Order #{order.id.slice(-8).toUpperCase()}
                                        </span>
                                        <Badge variant="outline" className="text-xs">
                                            <Truck className="h-3 w-3 mr-1" />
                                            Delivery
                                        </Badge>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {order.user?.name || 'Customer'} • {order.items?.length || 0} items
                                    </div>
                                    {order.delivery_address && (
                                        <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                            <MapPin className="h-3 w-3" />
                                            {order.delivery_address.street}
                                            {order.delivery_address.city && `, ${order.delivery_address.city}`}
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => navigate(`/vendor/orders/${order.id}`)}
                                    >
                                        View
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            setSelectedReadyOrder(order);
                                            setIsReadyOrderDialogOpen(true);
                                        }}
                                    >
                                        <UserPlus className="h-4 w-4 mr-1" />
                                        Assign Agent
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Filter */}
            <div className="flex gap-2 flex-wrap">
                {[
                    { value: 'all', label: 'All' },
                    { value: 'PENDING', label: 'Pending' },
                    { value: 'ASSIGNED', label: 'Assigned' },
                    { value: 'PICKED_UP', label: 'Picked Up' },
                    { value: 'ON_THE_WAY', label: 'On The Way' },
                    { value: 'DELIVERED', label: 'Delivered' },
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

            {/* Deliveries List */}
            {isLoading ? (
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-32" />
                    ))}
                </div>
            ) : isError ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                        <h3 className="text-lg font-medium">Failed to load deliveries</h3>
                        <p className="text-muted-foreground text-center mt-2">
                            Please try refreshing the page.
                        </p>
                    </CardContent>
                </Card>
            ) : filteredLogistics.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Package className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">No deliveries found</h3>
                        <p className="text-muted-foreground text-center mt-2">
                            {statusFilter === 'all'
                                ? 'No delivery orders yet.'
                                : 'No deliveries match the selected filter.'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredLogistics.map((item) => (
                        <Card key={item.id}>
                            <CardContent className="pt-6">
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                    {/* Order Info */}
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Package className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">
                                                Order #{item.order_id.slice(-8).toUpperCase()}
                                            </span>
                                            <Badge
                                                className={`${DELIVERY_STATUS_CONFIG[item.delivery_status].bgColor} ${DELIVERY_STATUS_CONFIG[item.delivery_status].color}`}
                                            >
                                                {DELIVERY_STATUS_CONFIG[item.delivery_status].label}
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                            <div className="flex items-start gap-2">
                                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                <div>
                                                    <div className="text-muted-foreground">Pickup</div>
                                                    <div>{formatAddress(item.pickup_address)}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <Navigation className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                <div>
                                                    <div className="text-muted-foreground">Delivery</div>
                                                    <div>{formatAddress(item.delivery_address)}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {item.agent && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <span>
                                                    {item.agent.name} ({FLEET_KIND_CONFIG[item.agent.fleet_kind].label})
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                                            {item.assigned_at && (
                                                <span>Assigned: {formatDate(item.assigned_at)}</span>
                                            )}
                                            {item.picked_up_at && (
                                                <span>Picked up: {formatDate(item.picked_up_at)}</span>
                                            )}
                                            {item.delivered_at && (
                                                <span>Delivered: {formatDate(item.delivered_at)}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-wrap gap-2">
                                        {item.delivery_status === 'PENDING' && (
                                            <Button
                                                size="sm"
                                                onClick={() => openAssignDialog(item)}
                                            >
                                                <User className="h-4 w-4 mr-1" />
                                                Assign Agent
                                            </Button>
                                        )}
                                        {item.delivery_status === 'ASSIGNED' && item.agent_id && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => unassignMutation.mutate(item.order_id)}
                                                disabled={unassignMutation.isPending}
                                            >
                                                Unassign
                                            </Button>
                                        )}
                                        {getNextStatus(item.delivery_status) && item.agent_id && (
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() =>
                                                    statusMutation.mutate({
                                                        id: item.id,
                                                        status: getNextStatus(item.delivery_status)!,
                                                    })
                                                }
                                                disabled={statusMutation.isPending}
                                            >
                                                {item.delivery_status === 'ASSIGNED' && 'Mark Picked Up'}
                                                {item.delivery_status === 'PICKED_UP' && 'Mark On The Way'}
                                                {item.delivery_status === 'ON_THE_WAY' && 'Mark Delivered'}
                                            </Button>
                                        )}
                                        {item.delivery_status === 'DELIVERED' && (
                                            <div className="flex items-center gap-1 text-green-600">
                                                <CheckCircle className="h-4 w-4" />
                                                <span className="text-sm">Completed</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Assign Agent Dialog */}
            <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Delivery Agent</DialogTitle>
                        <DialogDescription>
                            Select an available agent to handle this delivery.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {selectedLogistics && (
                            <div className="text-sm space-y-2">
                                <div className="flex items-center gap-2">
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                    <span>
                                        Order #{selectedLogistics.order_id.slice(-8).toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <Navigation className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <span>{formatAddress(selectedLogistics.delivery_address)}</span>
                                </div>
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Select Agent</label>
                            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose an agent" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableAgents?.length === 0 ? (
                                        <div className="p-2 text-sm text-muted-foreground text-center">
                                            No available agents
                                        </div>
                                    ) : (
                                        availableAgents?.map((agent: Agent) => (
                                            <SelectItem key={agent.id} value={agent.id}>
                                                <div className="flex items-center gap-2">
                                                    <span>{agent.name}</span>
                                                    <span className="text-muted-foreground">
                                                        ({FLEET_KIND_CONFIG[agent.fleet_kind].label})
                                                    </span>
                                                    {agent.current_load > 0 && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {agent.current_load} active
                                                        </Badge>
                                                    )}
                                                </div>
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsAssignDialogOpen(false);
                                setSelectedLogistics(null);
                                setSelectedAgentId('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAssign}
                            disabled={!selectedAgentId || assignMutation.isPending}
                        >
                            {assignMutation.isPending ? 'Assigning...' : 'Assign Agent'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog for assigning agent to ready orders */}
            <Dialog open={isReadyOrderDialogOpen} onOpenChange={setIsReadyOrderDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Delivery Agent</DialogTitle>
                        <DialogDescription>
                            Select an available agent to dispatch this order.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {selectedReadyOrder && (
                            <div className="text-sm space-y-2 p-3 bg-muted rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium">
                                        Order #{selectedReadyOrder.id.slice(-8).toUpperCase()}
                                    </span>
                                </div>
                                {selectedReadyOrder.delivery_address && (
                                    <div className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <span>
                                            {selectedReadyOrder.delivery_address.street}
                                            {selectedReadyOrder.delivery_address.city && `, ${selectedReadyOrder.delivery_address.city}`}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Select Agent</label>
                            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose an agent" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableAgents?.length === 0 ? (
                                        <div className="p-2 text-sm text-muted-foreground text-center">
                                            No available agents
                                        </div>
                                    ) : (
                                        availableAgents?.map((agent: Agent) => (
                                            <SelectItem key={agent.id} value={agent.id}>
                                                <div className="flex items-center gap-2">
                                                    <span>{agent.name}</span>
                                                    <span className="text-muted-foreground">
                                                        ({FLEET_KIND_CONFIG[agent.fleet_kind].label})
                                                    </span>
                                                    {agent.current_load > 0 && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {agent.current_load} active
                                                        </Badge>
                                                    )}
                                                </div>
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsReadyOrderDialogOpen(false);
                                setSelectedReadyOrder(null);
                                setSelectedAgentId('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAssignToReadyOrder}
                            disabled={!selectedAgentId || assignToReadyOrderMutation.isPending}
                        >
                            {assignToReadyOrderMutation.isPending ? 'Assigning...' : 'Assign Agent'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default VendorDeliveries;
