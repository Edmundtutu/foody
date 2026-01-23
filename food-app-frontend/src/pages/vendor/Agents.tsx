import React, { useState } from 'react';
import { useVendor } from '@/context/VendorContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import agentService from '@/services/agentService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
    Plus,
    MoreVertical,
    UserCheck,
    UserX,
    Edit,
    Trash2,
    Phone,
    Bike,
    Car,
    Truck,
    User,
    AlertCircle,
} from 'lucide-react';
import type {
    Agent,
    CreateAgentData,
    UpdateAgentData,
    FleetKind,
    AgentStatus,
} from '@/types/delivery';
import {
    FLEET_KIND_CONFIG,
    AGENT_STATUS_CONFIG,
} from '@/types/delivery';

const FleetIcon: React.FC<{ kind: FleetKind; className?: string }> = ({ kind, className }) => {
    switch (kind) {
        case 'BICYCLE':
            return <Bike className={className} />;
        case 'MOTORCYCLE':
            return <Bike className={className} />;
        case 'CAR':
            return <Car className={className} />;
        case 'VAN':
            return <Truck className={className} />;
        case 'ON_FOOT':
            return <User className={className} />;
        default:
            return <Bike className={className} />;
    }
};

const VendorAgents: React.FC = () => {
    const { restaurantId, hasRestaurant, isLoading: vendorLoading } = useVendor();
    const queryClient = useQueryClient();

    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Form state
    const [formData, setFormData] = useState<CreateAgentData>({
        nin: '',
        name: '',
        phone_number: '',
        fleet_kind: 'MOTORCYCLE',
        plate_number: '',
    });

    // Fetch agents
    const { data: agents, isLoading, isError } = useQuery({
        queryKey: ['agents', restaurantId],
        queryFn: () => agentService.getAgents(restaurantId!),
        enabled: !!restaurantId,
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: CreateAgentData) =>
            agentService.createAgent(restaurantId!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agents', restaurantId] });
            toast.success('Agent created successfully');
            setIsCreateDialogOpen(false);
            resetForm();
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to create agent');
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateAgentData }) =>
            agentService.updateAgent(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agents', restaurantId] });
            toast.success('Agent updated successfully');
            setIsEditDialogOpen(false);
            setSelectedAgent(null);
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to update agent');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => agentService.deleteAgent(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agents', restaurantId] });
            toast.success('Agent deleted successfully');
            setIsDeleteDialogOpen(false);
            setSelectedAgent(null);
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to delete agent');
        },
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: AgentStatus }) =>
            agentService.updateAgentStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agents', restaurantId] });
            toast.success('Agent status updated');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to update status');
        },
    });

    const availabilityMutation = useMutation({
        mutationFn: (id: string) => agentService.toggleAvailability(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agents', restaurantId] });
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to toggle availability');
        },
    });

    const resetForm = () => {
        setFormData({
            nin: '',
            name: '',
            phone_number: '',
            fleet_kind: 'MOTORCYCLE',
            plate_number: '',
        });
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAgent) return;
        updateMutation.mutate({
            id: selectedAgent.id,
            data: formData,
        });
    };

    const openEditDialog = (agent: Agent) => {
        setSelectedAgent(agent);
        setFormData({
            nin: agent.nin,
            name: agent.name,
            phone_number: agent.phone_number,
            fleet_kind: agent.fleet_kind,
            plate_number: agent.plate_number || '',
        });
        setIsEditDialogOpen(true);
    };

    const openDeleteDialog = (agent: Agent) => {
        setSelectedAgent(agent);
        setIsDeleteDialogOpen(true);
    };

    // Filter agents
    const filteredAgents = agents?.filter((agent) => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'available') return agent.is_available && agent.status === 'ACTIVE';
        return agent.status === statusFilter;
    }) || [];

    // Stats
    const stats = {
        total: agents?.length || 0,
        active: agents?.filter((a) => a.status === 'ACTIVE').length || 0,
        available: agents?.filter((a) => a.is_available && a.status === 'ACTIVE').length || 0,
        pending: agents?.filter((a) => a.status === 'PENDING').length || 0,
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
                <div className="grid grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-48" />
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
                        Please create a restaurant profile first to manage delivery agents.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Delivery Agents</h1>
                    <p className="text-muted-foreground">
                        Manage your delivery personnel and their availability
                    </p>
                </div>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Agent
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-muted-foreground text-sm">Total Agents</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                        <p className="text-muted-foreground text-sm">Active</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-blue-600">{stats.available}</div>
                        <p className="text-muted-foreground text-sm">Available Now</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                        <p className="text-muted-foreground text-sm">Pending Approval</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filter */}
            <div className="flex gap-2 flex-wrap">
                {[
                    { value: 'all', label: 'All' },
                    { value: 'ACTIVE', label: 'Active' },
                    { value: 'available', label: 'Available' },
                    { value: 'PENDING', label: 'Pending' },
                    { value: 'SUSPENDED', label: 'Suspended' },
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

            {/* Agents Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-48" />
                    ))}
                </div>
            ) : isError ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                        <h3 className="text-lg font-medium">Failed to load agents</h3>
                        <p className="text-muted-foreground text-center mt-2">
                            Please try refreshing the page.
                        </p>
                    </CardContent>
                </Card>
            ) : filteredAgents.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <User className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">No agents found</h3>
                        <p className="text-muted-foreground text-center mt-2">
                            {statusFilter === 'all'
                                ? 'Add your first delivery agent to get started.'
                                : 'No agents match the selected filter.'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAgents.map((agent) => (
                        <Card key={agent.id} className="relative">
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                            <FleetIcon kind={agent.fleet_kind} className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">{agent.name}</CardTitle>
                                            <p className="text-sm text-muted-foreground">
                                                {FLEET_KIND_CONFIG[agent.fleet_kind].label}
                                            </p>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => openEditDialog(agent)}>
                                                <Edit className="h-4 w-4 mr-2" />
                                                Edit
                                            </DropdownMenuItem>
                                            {agent.status === 'PENDING' && (
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        statusMutation.mutate({
                                                            id: agent.id,
                                                            status: 'ACTIVE',
                                                        })
                                                    }
                                                >
                                                    <UserCheck className="h-4 w-4 mr-2" />
                                                    Approve
                                                </DropdownMenuItem>
                                            )}
                                            {agent.status === 'ACTIVE' && (
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        statusMutation.mutate({
                                                            id: agent.id,
                                                            status: 'SUSPENDED',
                                                        })
                                                    }
                                                >
                                                    <UserX className="h-4 w-4 mr-2" />
                                                    Suspend
                                                </DropdownMenuItem>
                                            )}
                                            {agent.status === 'SUSPENDED' && (
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        statusMutation.mutate({
                                                            id: agent.id,
                                                            status: 'ACTIVE',
                                                        })
                                                    }
                                                >
                                                    <UserCheck className="h-4 w-4 mr-2" />
                                                    Reactivate
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={() => openDeleteDialog(agent)}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    {agent.phone_number}
                                </div>
                                {agent.plate_number && (
                                    <div className="text-sm text-muted-foreground">
                                        Plate: {agent.plate_number}
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <Badge
                                        className={`${AGENT_STATUS_CONFIG[agent.status]?.bgColor ?? 'bg-gray-100'} ${AGENT_STATUS_CONFIG[agent.status]?.color ?? 'text-gray-700'}`}
                                    >
                                        {AGENT_STATUS_CONFIG[agent.status]?.label ?? agent.status}
                                    </Badge>
                                    {(agent.status === 'ACTIVE' || agent.status === 'active') && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground">
                                                {agent.is_available ? 'Available' : 'Busy'}
                                            </span>
                                            <Switch
                                                checked={agent.is_available}
                                                onCheckedChange={() =>
                                                    availabilityMutation.mutate(agent.id)
                                                }
                                                disabled={availabilityMutation.isPending}
                                            />
                                        </div>
                                    )}
                                </div>
                                {agent.current_load > 0 && (
                                    <div className="text-sm text-muted-foreground">
                                        Active deliveries: {agent.current_load}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create Agent Dialog */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Agent</DialogTitle>
                        <DialogDescription>
                            Add a delivery agent to your restaurant.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="nin">National ID (NIN)</Label>
                            <Input
                                id="nin"
                                value={formData.nin}
                                onChange={(e) =>
                                    setFormData({ ...formData, nin: e.target.value })
                                }
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                type="tel"
                                value={formData.phone_number}
                                onChange={(e) =>
                                    setFormData({ ...formData, phone_number: e.target.value })
                                }
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fleet">Vehicle Type</Label>
                            <Select
                                value={formData.fleet_kind}
                                onValueChange={(value: FleetKind) =>
                                    setFormData({ ...formData, fleet_kind: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(FLEET_KIND_CONFIG).map(([key, config]) => (
                                        <SelectItem key={key} value={key}>
                                            {config.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="plate">Plate Number (optional)</Label>
                            <Input
                                id="plate"
                                value={formData.plate_number}
                                onChange={(e) =>
                                    setFormData({ ...formData, plate_number: e.target.value })
                                }
                            />
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsCreateDialogOpen(false);
                                    resetForm();
                                }}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={createMutation.isPending}>
                                {createMutation.isPending ? 'Creating...' : 'Create Agent'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Agent Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Agent</DialogTitle>
                        <DialogDescription>
                            Update agent information.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Full Name</Label>
                            <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({ ...formData, name: e.target.value })
                                }
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-nin">National ID (NIN)</Label>
                            <Input
                                id="edit-nin"
                                value={formData.nin}
                                onChange={(e) =>
                                    setFormData({ ...formData, nin: e.target.value })
                                }
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-phone">Phone Number</Label>
                            <Input
                                id="edit-phone"
                                type="tel"
                                value={formData.phone_number}
                                onChange={(e) =>
                                    setFormData({ ...formData, phone_number: e.target.value })
                                }
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-fleet">Vehicle Type</Label>
                            <Select
                                value={formData.fleet_kind}
                                onValueChange={(value: FleetKind) =>
                                    setFormData({ ...formData, fleet_kind: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(FLEET_KIND_CONFIG).map(([key, config]) => (
                                        <SelectItem key={key} value={key}>
                                            {config.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-plate">Plate Number (optional)</Label>
                            <Input
                                id="edit-plate"
                                value={formData.plate_number}
                                onChange={(e) =>
                                    setFormData({ ...formData, plate_number: e.target.value })
                                }
                            />
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsEditDialogOpen(false);
                                    setSelectedAgent(null);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={updateMutation.isPending}>
                                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Agent</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete {selectedAgent?.name}? This action
                            cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsDeleteDialogOpen(false);
                                setSelectedAgent(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => selectedAgent && deleteMutation.mutate(selectedAgent.id)}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default VendorAgents;
