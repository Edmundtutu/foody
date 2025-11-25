import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, FormEvent } from 'react';
import type { InventoryNode, InventoryNodeEdge, KitchenGraph, MoveNodeData } from '@/types/kitchen';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDeleteNode, useMoveNode, useToggleNode, useCreateNode } from '@/hooks/queries/useKitchenNodes';
import { GripVertical, Loader2, Plus, Power, RefreshCw, Search, Trash2, Menu, X, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useMenuCategories, useCreateMenuCategory } from '@/hooks/queries/useMenuCategories';
import { useCreateDish } from '@/hooks/queries/useDishes';
import { useDishOptions } from '@/hooks/queries/useDishOptions';
import { useToast } from '@/hooks/use-toast';
import menuService from '@/services/menuService';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const EMPTY_GRAPH: KitchenGraph = {
    categories: [],
    nodes: [],
    edges: [],
};

const ENTITY_LABELS: Record<'dish' | 'modification' | 'category', string> = {
    dish: 'Dish',
    modification: 'Modification',
    category: 'Category',
};

const ENTITY_BADGES: Record<'dish' | 'modification' | 'category', string> = {
    dish: 'bg-blue-100 text-blue-700',
    modification: 'bg-amber-100 text-amber-700',
    category: 'bg-violet-100 text-violet-700',
};

const ENTITY_ACCENTS: Record<'dish' | 'modification' | 'category', string> = {
    dish: 'border-blue-200/80 bg-blue-50/70',
    modification: 'border-amber-200/80 bg-amber-50/70',
    category: 'border-violet-200/80 bg-violet-50/70',
};

const DEFAULT_BADGE_CLASS = 'bg-slate-200 text-slate-700';
const DEFAULT_ACCENT_CLASS = 'border-border/80 bg-card/90';

const NODE_PADDING_PERCENT = 8;
const USABLE_PERCENT = 100 - NODE_PADDING_PERCENT * 2;
const MIN_VIRTUAL_RANGE = 200;

type NodeSummary = Record<'dish' | 'modification' | 'category', number>;

function getEntityLabel(entityType?: string | null): string {
    if (!entityType) return 'Unknown';
    if (entityType in ENTITY_LABELS) {
        return ENTITY_LABELS[entityType as keyof typeof ENTITY_LABELS];
    }
    const normalized = entityType.replace(/_/g, ' ');
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function getEntityInitial(entityType?: string | null): string {
    const label = getEntityLabel(entityType);
    return label.charAt(0) || '?';
}

function getEntityBadgeClass(entityType?: string | null): string {
    if (!entityType) return DEFAULT_BADGE_CLASS;
    return ENTITY_BADGES[entityType as keyof typeof ENTITY_BADGES] ?? DEFAULT_BADGE_CLASS;
}

function getEntityAccentClass(entityType?: string | null): string {
    if (!entityType) return DEFAULT_ACCENT_CLASS;
    return ENTITY_ACCENTS[entityType as keyof typeof ENTITY_ACCENTS] ?? DEFAULT_ACCENT_CLASS;
}

function summarizeNodes(nodes: InventoryNode[]): NodeSummary {
    return nodes.reduce<NodeSummary>((acc, node) => {
        acc[node.entity_type] += 1;
        return acc;
    }, {
        dish: 0,
        modification: 0,
        category: 0,
    });
}

function getRecentNodes(nodes: InventoryNode[], limit = 6): InventoryNode[] {
    return [...nodes]
        .sort((a, b) => {
            const aDate = a.updated_at ?? a.created_at;
            const bDate = b.updated_at ?? b.created_at;
            return new Date(bDate).getTime() - new Date(aDate).getTime();
        })
        .slice(0, limit);
}

function formatTimestamp(value?: string | null): string {
    if (!value) return 'Unknown timestamp';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return 'Unknown timestamp';
    }
    return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export interface KitchenGraphBoardProps {
    graph?: KitchenGraph | null;
    onRefresh?: () => void;
    isRefreshing?: boolean;
    restaurantId?: string | null;
}

// Add missing interface
interface MenuCategory {
    id: string;
    restaurant_id: string;
    name: string;
    description: string | null;
    display_order: number;
    color_code: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export function KitchenGraphBoard({ graph, onRefresh, isRefreshing, restaurantId }: KitchenGraphBoardProps) {
    const safeGraph = graph ?? EMPTY_GRAPH;
    const nodes = safeGraph.nodes ?? EMPTY_GRAPH.nodes;
    const edges = safeGraph.edges ?? EMPTY_GRAPH.edges;
    const categories = safeGraph.categories ?? EMPTY_GRAPH.categories;

    const [entityFilters, setEntityFilters] = useState<Record<'dish' | 'modification' | 'category', boolean>>({
        dish: true,
        modification: true,
        category: true,
    });
    const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'unavailable'>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createEntityType, setCreateEntityType] = useState<'dish' | 'modification' | 'category'>('dish');
    const [nodeDisplayName, setNodeDisplayName] = useState('');
    const [nodeAvailable, setNodeAvailable] = useState(true);
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [selectedDishId, setSelectedDishId] = useState('');
    const [selectedOptionId, setSelectedOptionId] = useState('');
    const [showCategoryForm, setShowCategoryForm] = useState(false);
    const [showDishForm, setShowDishForm] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryDescription, setNewCategoryDescription] = useState('');
    const [newDishName, setNewDishName] = useState('');
    const [newDishPrice, setNewDishPrice] = useState('');
    const [formError, setFormError] = useState<string | null>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    useToast();

    const { data: categoriesQuery = [], isLoading: categoriesLoading } = useMenuCategories(restaurantId ?? null);
    const { data: dishesQuery = [], isLoading: dishesLoading } = useQuery({
        queryKey: ['dishes', restaurantId],
        queryFn: () => menuService.getDishes({ restaurant_id: restaurantId! }),
        enabled: Boolean(restaurantId),
        staleTime: 1000 * 60 * 5,
    });
    const { data: dishOptionsQuery = [], isLoading: dishOptionsLoading } = useDishOptions(
        createEntityType === 'modification' ? (selectedDishId || null) : null,
    );

    const createNodeMutation = useCreateNode();
    const moveNodeMutation = useMoveNode();
    const toggleNodeMutation = useToggleNode();
    const deleteNodeMutation = useDeleteNode();
    const createCategoryMutation = useCreateMenuCategory();
    const createDishMutation = useCreateDish();

    const nodeSummary = summarizeNodes(nodes);
    const recentNodes = getRecentNodes(nodes);

    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filteredNodes = nodes.filter((node) => {
        if (!entityFilters[node.entity_type]) return false;
        if (availabilityFilter !== 'all') {
            const shouldBeAvailable = availabilityFilter === 'available';
            if (node.available !== shouldBeAvailable) return false;
        }
        if (categoryFilter !== 'all' && node.category_id !== categoryFilter) return false;

        if (normalizedSearch) {
            const searchable = `${node.display_name ?? ''} ${node.metadata?.label ?? ''} ${node.metadata?.description ?? ''}`.toLowerCase();
            if (!searchable.includes(normalizedSearch)) return false;
        }
        return true;
    });

    const visibleIds = new Set(filteredNodes.map((node) => node.id));
    const filteredEdges = edges.filter((edge) => visibleIds.has(edge.source_node_id) && visibleIds.has(edge.target_node_id));

    const { positionedNodes: allPositionedNodes, bounds } = positionNodes(nodes);
    const positionedNodeLookup = new Map(allPositionedNodes.map((entry) => [entry.node.id, entry]));
    const positionedNodes = filteredNodes
        .map((node) => positionedNodeLookup.get(node.id))
        .filter((value): value is PositionedNode => Boolean(value));
    const positionedEdges = positionEdges(filteredEdges, positionedNodes);

    const totalNodes = nodes.length;
    const totalEdges = edges.length;
    const visibleNodes = filteredNodes.length;
    const visibleEdges = filteredEdges.length;

    const graphCategoriesList = categories.length ? categories : deriveCategoriesFromNodes(nodes);
    const creationCategories = categoriesQuery.length ? categoriesQuery : graphCategoriesList;

    const lastUpdatedAt = getLatestTimestamp(nodes);

    const handleToggleEntity = (type: 'dish' | 'modification' | 'category') => {
        setEntityFilters((prev) => ({
            ...prev,
            [type]: !prev[type],
        }));
    };

    const handleNodeMove = (nodeId: string, data: MoveNodeData) => {
        moveNodeMutation.mutate({ nodeId, data });
    };

    const handleToggleNode = (nodeId: string) => {
        if (toggleNodeMutation.isPending) return;
        toggleNodeMutation.mutate(nodeId);
    };

    const handleDeleteNode = (nodeId: string, nodeName?: string) => {
        const confirmationMessage = `Delete node "${nodeName ?? 'Untitled'}"? This cannot be undone.`;
        const acknowledged = typeof window !== 'undefined' ? window.confirm(confirmationMessage) : true;
        if (!acknowledged) return;
        deleteNodeMutation.mutate(nodeId);
    };

    const filteredDishesForSelect = useMemo(() => {
        if (!selectedCategoryId) return dishesQuery ?? [];
        return (dishesQuery ?? []).filter((dish) => dish.category_id === selectedCategoryId);
    }, [dishesQuery, selectedCategoryId]);

    const selectedDish = useMemo(() => {
        return (dishesQuery ?? []).find((dish) => dish.id === selectedDishId) ?? null;
    }, [dishesQuery, selectedDishId]);

    const dishOptions = dishOptionsQuery ?? [];

    const resetCreateForm = () => {
        setCreateEntityType('dish');
        setNodeDisplayName('');
        setNodeAvailable(true);
        setSelectedCategoryId('');
        setSelectedDishId('');
        setSelectedOptionId('');
        setShowCategoryForm(false);
        setShowDishForm(false);
        setNewCategoryName('');
        setNewCategoryDescription('');
        setNewDishName('');
        setNewDishPrice('');
        setFormError(null);
    };

    const handleEntityTypeChange = (value: 'dish' | 'modification' | 'category') => {
        setCreateEntityType(value);
        setFormError(null);
        if (value === 'category') {
            setSelectedDishId('');
            setSelectedOptionId('');
        } else if (value === 'dish') {
            setSelectedOptionId('');
        }
    };

    const handleQuickCreateCategory = () => {
        if (!restaurantId) {
            setFormError('Restaurant context missing');
            return;
        }
        if (!newCategoryName.trim()) {
            setFormError('Enter a category name');
            return;
        }
        setFormError(null);
        createCategoryMutation.mutate(
            {
                restaurant_id: restaurantId,
                name: newCategoryName.trim(),
                description: newCategoryDescription.trim() || undefined,
            },
            {
                onSuccess: (category) => {
                    setSelectedCategoryId(category.id);
                    setShowCategoryForm(false);
                    setNewCategoryName('');
                    setNewCategoryDescription('');
                },
                onError: (error) => {
                    setFormError((error as Error).message || 'Failed to create category');
                },
            },
        );
    };

    const handleQuickCreateDish = () => {
        if (!restaurantId) {
            setFormError('Restaurant context missing');
            return;
        }
        if (!selectedCategoryId) {
            setFormError('Select a category before creating a dish');
            return;
        }
        if (!newDishName.trim()) {
            setFormError('Enter a dish name');
            return;
        }
        const priceValue = Number(newDishPrice);
        if (Number.isNaN(priceValue) || priceValue < 0) {
            setFormError('Enter a valid price');
            return;
        }
        setFormError(null);
        createDishMutation.mutate(
            {
                restaurant_id: restaurantId,
                category_id: selectedCategoryId,
                name: newDishName.trim(),
                price: priceValue,
                available: true,
            },
            {
                onSuccess: (dish) => {
                    setSelectedDishId(dish.id);
                    setShowDishForm(false);
                    setNewDishName('');
                    setNewDishPrice('');
                },
                onError: (error) => {
                    setFormError((error as Error).message || 'Failed to create dish');
                },
            },
        );
    };

    const handleSubmitCreateNode = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!restaurantId) {
            setFormError('Restaurant context missing');
            return;
        }
        setFormError(null);

        let entityId: string | null = null;
        let categoryId: string | null = null;
        let finalDisplayName = nodeDisplayName.trim();
        const metadata: Record<string, unknown> = {};

        if (createEntityType === 'dish') {
            if (!selectedDishId) {
                setFormError('Select an existing dish or create one first');
                return;
            }
            entityId = selectedDishId;
            categoryId = selectedDish?.category_id ?? selectedCategoryId ?? null;
            if (!finalDisplayName) {
                finalDisplayName = selectedDish?.name ?? '';
            }
            metadata.label = finalDisplayName || selectedDish?.name;
        } else if (createEntityType === 'category') {
            if (!selectedCategoryId) {
                setFormError('Select an existing category or create one first');
                return;
            }
            entityId = selectedCategoryId;
            categoryId = selectedCategoryId;
            if (!finalDisplayName) {
                const category = creationCategories.find((entry) => entry.id === selectedCategoryId);
                finalDisplayName = category?.name ?? '';
                if (category?.name) {
                    metadata.label = category.name;
                }
            }
        } else {
            if (!selectedDishId) {
                setFormError('Select a dish before choosing a modification');
                return;
            }
            if (!selectedOptionId) {
                setFormError('Select a dish option to represent the modification node');
                return;
            }
            const option = dishOptions.find((entry) => entry.id === selectedOptionId);
            entityId = selectedOptionId;
            categoryId = selectedDish?.category_id ?? selectedCategoryId ?? null;
            if (!finalDisplayName) {
                finalDisplayName = option?.name ?? selectedDish?.name ?? '';
            }
            if (option?.name) {
                metadata.label = option.name;
            }
            if (selectedDish?.name) {
                metadata.dish_name = selectedDish.name;
            }
        }

        if (!entityId) {
            setFormError('Missing entity reference');
            return;
        }

        if (!categoryId) {
            setFormError('Select a category so the node can be grouped correctly');
            return;
        }

        const position = getDefaultPosition(bounds);

        createNodeMutation.mutate(
            {
                restaurant_id: restaurantId,
                category_id: categoryId,
                entity_type: createEntityType,
                entity_id: entityId,
                display_name: finalDisplayName || undefined,
                available: nodeAvailable,
                x: position.x,
                y: position.y,
                x_position: position.xPosition,
                y_position: position.yPosition,
                metadata: Object.keys(metadata).length ? metadata : undefined,
            },
            {
                onSuccess: () => {
                    setIsCreateOpen(false);
                    resetCreateForm();
                },
                onError: (error) => {
                    setFormError((error as Error).message || 'Failed to create node');
                },
            },
        );
    };

    return (
        <div className="relative h-screen flex flex-col">
            {/* Top Analytics Bar */}
            <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsPanelOpen(!isPanelOpen)}
                        className="lg:hidden"
                    >
                        <Menu className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Nodes:</span>
                            <span className="font-semibold">{visibleNodes}/{totalNodes}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Edges:</span>
                            <span className="font-semibold">{visibleEdges}/{totalEdges}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Types:</span>
                            <div className="flex gap-1">
                                {Object.entries(nodeSummary).map(([key, value]) => (
                                    <Badge key={key} variant="outline" className="text-xs">
                                        {ENTITY_LABELS[key as keyof NodeSummary]}: {value}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onRefresh}
                        disabled={!onRefresh || isRefreshing}
                    >
                        {isRefreshing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="h-4 w-4" />
                        )}
                    </Button>

                    {/* Analytics Popover */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm">
                                <BarChart3 className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                            <div className="space-y-4">
                                <h4 className="font-medium">Graph Analytics</h4>
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Total Nodes</span>
                                        <span className="font-semibold">{totalNodes}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Total Edges</span>
                                        <span className="font-semibold">{totalEdges}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Categories</span>
                                        <span className="font-semibold">{categories.length}</span>
                                    </div>
                                    <Separator />
                                    {Object.entries(nodeSummary).map(([key, value]) => (
                                        <div key={key} className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">
                                                {ENTITY_LABELS[key as keyof NodeSummary]}
                                            </span>
                                            <span className="font-semibold">{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* Desktop panel toggle */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsPanelOpen(!isPanelOpen)}
                        className="hidden lg:flex"
                    >
                        {isPanelOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 relative overflow-hidden">
                {/* Graph Viewport - Takes full remaining space */}
                <div className="flex-1">
                    <GraphViewport
                        nodes={positionedNodes}
                        edges={positionedEdges}
                        totals={{ totalNodes, totalEdges, visibleNodes, visibleEdges }}
                        bounds={bounds}
                        onNodeMove={handleNodeMove}
                        onToggleNode={handleToggleNode}
                        onDeleteNode={handleDeleteNode}
                        interactionState={{
                            movingNodeId: moveNodeMutation.variables?.nodeId ?? null,
                            isMovePending: moveNodeMutation.isPending,
                            togglingNodeId: toggleNodeMutation.variables ?? null,
                            isTogglePending: toggleNodeMutation.isPending,
                            deletingNodeId: deleteNodeMutation.variables ?? null,
                            isDeletePending: deleteNodeMutation.isPending,
                        }}
                    />
                </div>

                {/* Slide-out Panel - Now properly hidden by default */}
                <div className={`
                    fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-background border-l shadow-lg transform transition-transform duration-300 ease-in-out
                    lg:fixed lg:z-40
                    ${isPanelOpen ? 'translate-x-0' : 'translate-x-full'}
                `}>
                    <div className="flex flex-col h-full">
                        {/* Panel Header */}
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="font-semibold">Graph Controls</h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsPanelOpen(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Panel Content */}
                        <ScrollArea className="flex-1 p-4">
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Filters & Controls</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4 text-sm">
                                        <div className="space-y-2">
                                            <p className="text-xs text-muted-foreground">Node Types</p>
                                            <div className="flex flex-wrap gap-2">
                                                {(Object.keys(ENTITY_LABELS) as Array<'dish' | 'modification' | 'category'>).map((type) => (
                                                    <Button
                                                        key={type}
                                                        variant={entityFilters[type] ? 'default' : 'outline'}
                                                        size="sm"
                                                        className="h-7 text-xs capitalize"
                                                        onClick={() => handleToggleEntity(type)}
                                                    >
                                                        {ENTITY_LABELS[type]}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-xs text-muted-foreground">Availability</p>
                                            <Select value={availabilityFilter} onValueChange={(value: 'all' | 'available' | 'unavailable') => setAvailabilityFilter(value)}>
                                                <SelectTrigger className="h-8 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All nodes</SelectItem>
                                                    <SelectItem value="available">Available only</SelectItem>
                                                    <SelectItem value="unavailable">Unavailable only</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-xs text-muted-foreground">Category</p>
                                            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                                <SelectTrigger className="h-8 text-xs">
                                                    <SelectValue placeholder="All categories" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All categories</SelectItem>
                                                    {graphCategoriesList.map((category) => (
                                                        <SelectItem key={category.id} value={category.id}>
                                                            <div className="flex items-center gap-2">
                                                              {category.color_code && (
                                                                <div
                                                                  className="h-3 w-3 rounded-full flex-shrink-0"
                                                                  style={{ backgroundColor: category.color_code }}
                                                                />
                                                              )}
                                                              <span>{category.name}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-xs text-muted-foreground">Search</p>
                                            <div className="relative">
                                                <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                                                <Input
                                                    value={searchTerm}
                                                    onChange={(event) => setSearchTerm(event.target.value)}
                                                    placeholder="Search by name or note"
                                                    className="pl-7 text-xs"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card id="vendor-kitchen-create-node">
                                    <CardHeader>
                                        <CardTitle className="text-base">Create Node</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3 text-sm">
                                        <p className="text-xs text-muted-foreground">
                                            Use the builder below to create dishes, categories, or modification nodes. Quick forms are included for
                                            new menu entities when needed.
                                        </p>
                                        <Dialog
                                            open={isCreateOpen}
                                            onOpenChange={(open) => {
                                                setIsCreateOpen(open);
                                                if (!open) {
                                                    resetCreateForm();
                                                }
                                            }}
                                        >
                                            <DialogTrigger asChild>
                                                <Button className="w-full text-xs" disabled={!restaurantId}>
                                                    <Plus className="mr-2 h-3.5 w-3.5" />
                                                    New Node
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-3xl">
                                                <DialogHeader>
                                                    <DialogTitle>Create kitchen graph node</DialogTitle>
                                                    <DialogDescription>
                                                        Reference existing menu data or create new dishes/categories on the fly. Modification nodes must
                                                        link to real dish options per backend constraints.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <form className="space-y-4" onSubmit={handleSubmitCreateNode}>
                                                    <div className="grid gap-4 md:grid-cols-2">
                                                        <div className="space-y-2">
                                                            <Label>Entity type</Label>
                                                            <Select value={createEntityType} onValueChange={(value: 'dish' | 'modification' | 'category') => handleEntityTypeChange(value)}>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select type" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="dish">Dish</SelectItem>
                                                                    <SelectItem value="modification">Modification</SelectItem>
                                                                    <SelectItem value="category">Category</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Node availability</Label>
                                                            <div className="flex items-center justify-between rounded-md border px-3 py-2">
                                                                <span className="text-sm">{nodeAvailable ? 'Available immediately' : 'Marked unavailable'}</span>
                                                                <Switch checked={nodeAvailable} onCheckedChange={setNodeAvailable} />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3 rounded-md border p-3">
                                                        <div className="flex items-center justify-between">
                                                            <Label>Menu category</Label>
                                                            <Button type="button" variant="link" className="h-auto p-0 text-xs" onClick={() => setShowCategoryForm((prev) => !prev)}>
                                                                {showCategoryForm ? 'Hide quick category form' : 'Quick add category'}
                                                            </Button>
                                                        </div>
                                                        <Select value={selectedCategoryId} onValueChange={(value) => setSelectedCategoryId(value)} disabled={categoriesLoading || creationCategories.length === 0}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder={categoriesLoading ? 'Loading...' : 'Select category'} />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {creationCategories.map((category) => (
                                                                    <SelectItem key={category.id} value={category.id}>
                                                                        <div className="flex items-center gap-2">
                                                                          {category.color_code && (
                                                                            <div
                                                                              className="h-3 w-3 rounded-full flex-shrink-0"
                                                                              style={{ backgroundColor: category.color_code }}
                                                                            />
                                                                          )}
                                                                          <span>{category.name}</span>
                                                                        </div>
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        {creationCategories.length === 0 && (
                                                            <p className="text-xs text-muted-foreground">No categories yet. Use the quick form below to create one.</p>
                                                        )}
                                                        {showCategoryForm && (
                                                            <div className="space-y-2 rounded-md border border-dashed p-3">
                                                                <div className="space-y-1">
                                                                    <Label className="text-xs">Category name</Label>
                                                                    <Input value={newCategoryName} onChange={(event) => setNewCategoryName(event.target.value)} placeholder="E.g., Specials" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-xs">Description</Label>
                                                                    <Textarea value={newCategoryDescription} onChange={(event) => setNewCategoryDescription(event.target.value)} rows={2} />
                                                                </div>
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    onClick={handleQuickCreateCategory}
                                                                    disabled={createCategoryMutation.isPending}
                                                                    className="text-xs"
                                                                >
                                                                    {createCategoryMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Create category'}
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {(createEntityType === 'dish' || createEntityType === 'modification') && (
                                                        <div className="space-y-3 rounded-md border p-3">
                                                            <div className="flex items-center justify-between">
                                                                <Label>Dish</Label>
                                                                <Button type="button" variant="link" className="h-auto p-0 text-xs" onClick={() => setShowDishForm((prev) => !prev)}>
                                                                    {showDishForm ? 'Hide quick dish form' : 'Quick add dish'}
                                                                </Button>
                                                            </div>
                                                            <Select value={selectedDishId} onValueChange={(value) => setSelectedDishId(value)} disabled={dishesLoading || filteredDishesForSelect.length === 0}>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder={dishesLoading ? 'Loading...' : 'Select dish'} />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {filteredDishesForSelect.map((dish) => (
                                                                        <SelectItem key={dish.id} value={dish.id}>
                                                                            {dish.name}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            {filteredDishesForSelect.length === 0 && (
                                                                <p className="text-xs text-muted-foreground">No dishes match the selected category yet.</p>
                                                            )}
                                                            {showDishForm && (
                                                                <div className="space-y-2 rounded-md border border-dashed p-3">
                                                                    <div className="space-y-1">
                                                                        <Label className="text-xs">Dish name</Label>
                                                                        <Input value={newDishName} onChange={(event) => setNewDishName(event.target.value)} placeholder="E.g., Truffle pasta" />
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <Label className="text-xs">Price</Label>
                                                                        <Input value={newDishPrice} onChange={(event) => setNewDishPrice(event.target.value)} placeholder="25" type="number" min="0" step="0.01" />
                                                                    </div>
                                                                    <Button
                                                                        type="button"
                                                                        size="sm"
                                                                        onClick={handleQuickCreateDish}
                                                                        disabled={createDishMutation.isPending}
                                                                        className="text-xs"
                                                                    >
                                                                        {createDishMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Create dish'}
                                                                    </Button>
                                                                </div>
                                                            )}
                                                            {createEntityType === 'modification' && (
                                                                <div className="space-y-2">
                                                                    <Label>Dish option (modification)</Label>
                                                                    <Select
                                                                        value={selectedOptionId}
                                                                        onValueChange={(value) => setSelectedOptionId(value)}
                                                                        disabled={!selectedDishId || dishOptionsLoading || dishOptions.length === 0}
                                                                    >
                                                                        <SelectTrigger>
                                                                            <SelectValue placeholder={selectedDishId ? (dishOptionsLoading ? 'Loading options...' : 'Select option') : 'Select a dish first'} />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {dishOptions.map((option) => (
                                                                                <SelectItem key={option.id} value={option.id}>
                                                                                    {option.name}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                    {selectedDishId && dishOptions.length === 0 && !dishOptionsLoading && (
                                                                        <p className="text-xs text-destructive">
                                                                            This dish has no options yet. Create dish options in the menu area before adding modification nodes.
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="space-y-2">
                                                        <Label>Display label (optional)</Label>
                                                        <Input
                                                            value={nodeDisplayName}
                                                            onChange={(event) => setNodeDisplayName(event.target.value)}
                                                            placeholder="Overrides the default entity name"
                                                        />
                                                    </div>

                                                    {formError && <p className="text-sm text-destructive">{formError}</p>}

                                                    <DialogFooter>
                                                        <Button type="button" variant="outline" onClick={() => { setIsCreateOpen(false); resetCreateForm(); }}>
                                                            Cancel
                                                        </Button>
                                                        <Button type="submit" disabled={createNodeMutation.isPending || !restaurantId}>
                                                            {createNodeMutation.isPending ? (
                                                                <>
                                                                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Saving
                                                                </>
                                                            ) : (
                                                                'Create node'
                                                            )}
                                                        </Button>
                                                    </DialogFooter>
                                                </form>
                                            </DialogContent>
                                        </Dialog>
                                        {!restaurantId && (
                                            <p className="text-[11px] text-destructive">Link a restaurant profile to unlock node creation.</p>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Recently Updated Nodes</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {recentNodes.length === 0 ? (
                                            <div className="p-6 text-sm text-muted-foreground">
                                                No nodes available yet. Once data arrives from the backend, the most
                                                recently updated records will appear here for quick inspection.
                                            </div>
                                        ) : (
                                            <ScrollArea className="max-h-80">
                                                <ul className="divide-y divide-border">
                                                    {recentNodes.map((node) => (
                                                        <li key={node.id} className="flex items-start gap-3 px-4 py-3">
                                                            <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold ${getEntityBadgeClass(node.entity_type)}`}>
                                                                {getEntityInitial(node.entity_type)}
                                                            </div>
                                                            <div className="flex-1 space-y-1 text-sm">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <span className="font-medium text-foreground">
                                                                        {node.display_name ?? node.metadata?.label ?? 'Untitled node'}
                                                                    </span>
                                                                    <Badge variant="outline" className="text-[11px] capitalize">
                                                                        {node.entity_type}
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-xs text-muted-foreground break-all">
                                                                    Node ID: {node.id}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    Updated {formatTimestamp(node.updated_at ?? node.created_at)}
                                                                </p>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </ScrollArea>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </ScrollArea>
                    </div>
                </div>

                {/* Overlay for mobile when panel is open */}
                {isPanelOpen && (
                    <div
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:z-30"
                        onClick={() => setIsPanelOpen(false)}
                    />
                )}
            </div>
        </div>
    );
}

// ... (rest of the code remains the same - GraphViewport and helper functions)

interface PositionedNode {
    node: InventoryNode;
    leftPercent: number;
    topPercent: number;
    normalizedX: number;
    normalizedY: number;
}

interface PositionedEdge {
    edge: InventoryNodeEdge;
    points: {
        sourceX: number;
        sourceY: number;
        targetX: number;
        targetY: number;
        midX: number;
        midY: number;
    };
}

interface GraphViewportProps {
    nodes: PositionedNode[];
    edges: PositionedEdge[];
    totals: { totalNodes: number; totalEdges: number; visibleNodes: number; visibleEdges: number };
    bounds: PositioningBounds | null;
    onNodeMove?: (nodeId: string, data: MoveNodeData) => void;
    onToggleNode?: (nodeId: string) => void;
    onDeleteNode?: (nodeId: string, nodeName?: string) => void;
    interactionState?: GraphInteractionState;
}

interface GraphInteractionState {
    movingNodeId: string | null;
    isMovePending: boolean;
    togglingNodeId: string | null;
    isTogglePending: boolean;
    deletingNodeId: string | null;
    isDeletePending: boolean;
}

interface PositioningBounds {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    rangeX: number;
    rangeY: number;
}

interface DragState {
    nodeId: string;
    rect: DOMRect;
    offsetX: number;
    offsetY: number;
    currentLeft: number;
    currentTop: number;
    normalizedX: number;
    normalizedY: number;
    initialLeft: number;
    initialTop: number;
    initialNormalizedX: number;
    initialNormalizedY: number;
}

function GraphViewport({
                           nodes,
                           edges,
                           totals,
                           bounds,
                           onNodeMove,
                           onToggleNode,
                           onDeleteNode,
                           interactionState,
                       }: GraphViewportProps) {
    const hasGraphData = nodes.length > 0 || edges.length > 0;
    const containerRef = useRef<HTMLDivElement>(null);
    const [dragState, setDragState] = useState<DragState | null>(null);
    const dragStateRef = useRef<DragState | null>(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    // Measure container size for adaptive graph
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                setContainerSize({ width, height });
            }
        };

        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    useEffect(() => {
        dragStateRef.current = dragState;
    }, [dragState]);

    const isDragging = Boolean(dragState);

    useEffect(() => {
        if (!isDragging) return;
        const previousUserSelect = typeof document !== 'undefined' ? document.body.style.userSelect : undefined;

        const handlePointerMove = (event: PointerEvent) => {
            const current = dragStateRef.current;
            if (!current) return;
            event.preventDefault();
            const pointer = clientToPercent(event.clientX, event.clientY, current.rect);
            const nextLeft = clampPercent(pointer.x - current.offsetX);
            const nextTop = clampPercent(pointer.y - current.offsetY);

            setDragState((prev) => {
                if (!prev) return prev;
                const normalizedX = percentToNormalized(nextLeft);
                const normalizedY = percentToNormalized(nextTop);
                return {
                    ...prev,
                    currentLeft: nextLeft,
                    currentTop: nextTop,
                    normalizedX,
                    normalizedY,
                };
            });
        };

        const handlePointerEnd = () => {
            setDragState((current) => {
                if (!current) return null;
                if (onNodeMove && bounds) {
                    const payload = buildMovePayload(current, bounds);
                    const deltaX = Math.abs(current.normalizedX - current.initialNormalizedX);
                    const deltaY = Math.abs(current.normalizedY - current.initialNormalizedY);
                    if (deltaX > 0.001 || deltaY > 0.001) {
                        onNodeMove(current.nodeId, payload);
                    }
                }
                return null;
            });
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerEnd);
        window.addEventListener('pointercancel', handlePointerEnd);

        if (typeof document !== 'undefined') {
            document.body.style.userSelect = 'none';
        }

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerEnd);
            window.removeEventListener('pointercancel', handlePointerEnd);
            if (typeof document !== 'undefined') {
                document.body.style.userSelect = previousUserSelect ?? '';
            }
        };
    }, [isDragging, bounds, onNodeMove]);

    const disableNewDrags = !onNodeMove || !bounds || (interactionState?.isMovePending ?? false) || (interactionState?.isDeletePending ?? false);

    const resolvedNodes = dragState
        ? nodes.map((entry) => (
            entry.node.id === dragState.nodeId
                ? { ...entry, leftPercent: dragState.currentLeft, topPercent: dragState.currentTop }
                : entry
        ))
        : nodes;

    const resolvedEdges = dragState ? adjustEdgesForDrag(edges, dragState) : edges;

    const startDrag = (event: ReactPointerEvent<HTMLButtonElement>, positionedNode: PositionedNode) => {
        if (disableNewDrags || !bounds) return;
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        event.preventDefault();
        event.stopPropagation();
        const pointer = clientToPercent(event.clientX, event.clientY, rect);
        const offsetX = pointer.x - positionedNode.leftPercent;
        const offsetY = pointer.y - positionedNode.topPercent;

        setDragState({
            nodeId: positionedNode.node.id,
            rect,
            offsetX,
            offsetY,
            currentLeft: positionedNode.leftPercent,
            currentTop: positionedNode.topPercent,
            normalizedX: positionedNode.normalizedX,
            normalizedY: positionedNode.normalizedY,
            initialLeft: positionedNode.leftPercent,
            initialTop: positionedNode.topPercent,
            initialNormalizedX: positionedNode.normalizedX,
            initialNormalizedY: positionedNode.normalizedY,
        });

        event.currentTarget.setPointerCapture?.(event.pointerId);
    };

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full bg-gradient-to-br from-muted/20 to-background"
        >
            {!hasGraphData && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                    <div className="max-w-md space-y-3">
                        <p className="font-medium text-foreground">Awaiting kitchen graph data</p>
                        <p className="text-sm text-muted-foreground">
                            Once nodes and edges exist in the backend, they will be plotted here with
                            adaptive positioning that scales to fit your available space.
                        </p>
                    </div>
                </div>
            )}

            {hasGraphData && (
                <>
                    <svg
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                    >
                        {resolvedEdges.map(({ edge, points }) => (
                            <g key={edge.id}>
                                <line
                                    x1={points.sourceX}
                                    y1={points.sourceY}
                                    x2={points.targetX}
                                    y2={points.targetY}
                                    stroke="hsl(var(--muted-foreground))"
                                    strokeWidth={0.5}
                                    strokeOpacity={0.8}
                                />
                                {edge.label && (
                                    <text
                                        x={points.midX}
                                        y={points.midY - 1}
                                        textAnchor="middle"
                                        fontSize={2.5}
                                        fill="hsl(var(--muted-foreground))"
                                        className="select-none"
                                    >
                                        {edge.label}
                                    </text>
                                )}
                            </g>
                        ))}
                    </svg>

                    {resolvedNodes.map((entry) => {
                        const { node, leftPercent, topPercent } = entry;
                        const nodeLabel = node.display_name ?? node.metadata?.label ?? 'Untitled node';
                        const isNodeMoving = interactionState?.isMovePending && interactionState.movingNodeId === node.id;
                        const isNodeToggling = interactionState?.isTogglePending && interactionState.togglingNodeId === node.id;
                        const isNodeDeleting = interactionState?.isDeletePending && interactionState.deletingNodeId === node.id;
                        const actionDisabled = isNodeDeleting;
                        const handleDisabled = disableNewDrags || isNodeDeleting;
                        const draggingThisNode = dragState?.nodeId === node.id;

                        return (
                            <article
                                key={node.id}
                                className={`absolute w-48 -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-card/95 p-3 shadow-sm transition hover:shadow-md ${getEntityAccentClass(node.entity_type)} ${isNodeDeleting ? 'opacity-60' : ''}`}
                                style={{ left: `${leftPercent}%`, top: `${topPercent}%` }}
                            >
                                <header className="mb-2 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onPointerDown={(event) => startDrag(event, entry)}
                                            disabled={handleDisabled}
                                            className={`inline-flex h-6 w-6 items-center justify-center rounded border border-border/70 bg-background/70 text-muted-foreground transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${draggingThisNode ? 'cursor-grabbing' : 'cursor-grab'} disabled:cursor-not-allowed disabled:opacity-60`}
                                            aria-label="Drag to reposition node"
                                        >
                                            <GripVertical className="h-3.5 w-3.5" />
                                        </button>
                                        <Badge variant="outline" className="text-[10px] capitalize">
                                            {node.entity_type}
                                        </Badge>
                                    </div>
                                    <span
                                        className={`inline-flex h-2 w-2 rounded-full ${node.available ? 'bg-emerald-500' : 'bg-destructive'}`}
                                        title={node.available ? 'Available' : 'Unavailable'}
                                    />
                                </header>
                                <h4 className="text-sm font-semibold text-foreground truncate" title={nodeLabel}>
                                    {nodeLabel}
                                </h4>
                                {node.category?.name && (
                                    <div className="flex items-center gap-2">
                                      {node.category.color_code && (
                                        <div
                                          className="h-2 w-2 rounded-full flex-shrink-0"
                                          style={{ backgroundColor: node.category.color_code }}
                                        />
                                      )}
                                      <p className="text-xs text-muted-foreground truncate">
                                        Category: {node.category.name}
                                      </p>
                                    </div>
                                )}
                                {node.metadata?.description && (
                                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                        {node.metadata.description}
                                    </p>
                                )}
                                <p className="mt-1 text-[10px] font-medium text-muted-foreground">
                                    ({node.x}, {node.y})
                                </p>
                                <div className="mt-2 flex items-center justify-between gap-2">
                                    <Button
                                        type="button"
                                        variant={node.available ? 'secondary' : 'default'}
                                        size="sm"
                                        className="h-7 flex-1 px-2 text-[11px]"
                                        onClick={() => onToggleNode?.(node.id)}
                                        disabled={!onToggleNode || actionDisabled || isNodeToggling}
                                    >
                                        {isNodeToggling ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                            <div className="flex items-center justify-center gap-1">
                                                <Power className="h-3 w-3" />
                                                <span>{node.available ? 'Mark off' : 'Mark on'}</span>
                                            </div>
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => onDeleteNode?.(node.id, nodeLabel)}
                                        disabled={!onDeleteNode || actionDisabled}
                                    >
                                        {isNodeDeleting ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-3.5 w-3.5" />
                                        )}
                                    </Button>
                                </div>
                                {isNodeMoving && (
                                    <p className="mt-1 text-[10px] text-muted-foreground">Saving position…</p>
                                )}
                            </article>
                        );
                    })}
                </>
            )}
        </div>
    );
}

function clientToPercent(clientX: number, clientY: number, rect: DOMRect) {
    const width = rect.width || 1;
    const height = rect.height || 1;
    const x = ((clientX - rect.left) / width) * 100;
    const y = ((clientY - rect.top) / height) * 100;
    return { x, y };
}

function clampPercent(value: number) {
    return Math.min(100 - NODE_PADDING_PERCENT, Math.max(NODE_PADDING_PERCENT, value));
}

function percentToNormalized(percent: number) {
    const normalized = (percent - NODE_PADDING_PERCENT) / USABLE_PERCENT;
    return Math.min(1, Math.max(0, normalized));
}

function buildMovePayload(state: DragState, bounds: PositioningBounds): MoveNodeData {
    const safeRangeX = bounds.rangeX || MIN_VIRTUAL_RANGE;
    const safeRangeY = bounds.rangeY || MIN_VIRTUAL_RANGE;
    const baseMinX = Number.isFinite(bounds.minX) ? bounds.minX : 0;
    const baseMinY = Number.isFinite(bounds.minY) ? bounds.minY : 0;
    const normalizedX = clamp01(state.normalizedX);
    const normalizedY = clamp01(state.normalizedY);

    const x = Math.round(baseMinX + normalizedX * safeRangeX);
    const y = Math.round(baseMinY + normalizedY * safeRangeY);

    return {
        x,
        y,
        x_position: Number(normalizedX.toFixed(4)),
        y_position: Number(normalizedY.toFixed(4)),
    };
}

function clamp01(value: number) {
    if (!Number.isFinite(value)) return 0.5;
    if (value < 0) return 0;
    if (value > 1) return 1;
    return value;
}

function adjustEdgesForDrag(edges: PositionedEdge[], dragState: DragState): PositionedEdge[] {
    return edges.map((entry) => {
        const affectsSource = entry.edge.source_node_id === dragState.nodeId;
        const affectsTarget = entry.edge.target_node_id === dragState.nodeId;
        if (!affectsSource && !affectsTarget) return entry;

        const sourceX = affectsSource ? dragState.currentLeft : entry.points.sourceX;
        const sourceY = affectsSource ? dragState.currentTop : entry.points.sourceY;
        const targetX = affectsTarget ? dragState.currentLeft : entry.points.targetX;
        const targetY = affectsTarget ? dragState.currentTop : entry.points.targetY;

        return {
            ...entry,
            points: {
                sourceX,
                sourceY,
                targetX,
                targetY,
                midX: (sourceX + targetX) / 2,
                midY: (sourceY + targetY) / 2,
            },
        };
    });
}

function getDefaultPosition(bounds: PositioningBounds | null) {
    if (!bounds) {
        return { x: 0, y: 0, xPosition: 0.5, yPosition: 0.5 };
    }
    const x = Math.round(bounds.minX + bounds.rangeX / 2);
    const y = Math.round(bounds.minY + bounds.rangeY / 2);
    return {
        x,
        y,
        xPosition: 0.5,
        yPosition: 0.5,
    };
}

interface PositioningResult {
    positionedNodes: PositionedNode[];
    bounds: PositioningBounds | null;
}

function positionNodes(nodes: InventoryNode[]): PositioningResult {
    if (!nodes.length) {
        const half = MIN_VIRTUAL_RANGE / 2;
        const bounds: PositioningBounds = {
            minX: -half,
            maxX: half,
            minY: -half,
            maxY: half,
            rangeX: MIN_VIRTUAL_RANGE,
            rangeY: MIN_VIRTUAL_RANGE,
        };
        return { positionedNodes: [], bounds };
    }

    const xs = nodes.map((node) => (Number.isFinite(node.x) ? node.x : 0));
    const ys = nodes.map((node) => (Number.isFinite(node.y) ? node.y : 0));

    const rawMinX = Math.min(...xs);
    const rawMaxX = Math.max(...xs);
    const rawMinY = Math.min(...ys);
    const rawMaxY = Math.max(...ys);

    const { min: minX, max: maxX } = expandRange(rawMinX, rawMaxX, MIN_VIRTUAL_RANGE);
    const { min: minY, max: maxY } = expandRange(rawMinY, rawMaxY, MIN_VIRTUAL_RANGE);

    const rangeX = Math.max(maxX - minX, MIN_VIRTUAL_RANGE);
    const rangeY = Math.max(maxY - minY, MIN_VIRTUAL_RANGE);

    const bounds: PositioningBounds = { minX, maxX, minY, maxY, rangeX, rangeY };

    const positionedNodes = nodes.map((node) => {
        const rawX = Number.isFinite(node.x) ? node.x : 0;
        const rawY = Number.isFinite(node.y) ? node.y : 0;

        const normalizedX = rangeX ? (rawX - minX) / rangeX : 0.5;
        const normalizedY = rangeY ? (rawY - minY) / rangeY : 0.5;

        const leftPercent = NODE_PADDING_PERCENT + normalizedX * USABLE_PERCENT;
        const topPercent = NODE_PADDING_PERCENT + normalizedY * USABLE_PERCENT;

        return {
            node,
            leftPercent,
            topPercent,
            normalizedX,
            normalizedY,
        };
    });

    return { positionedNodes, bounds };
}

function expandRange(min: number, max: number, minimumSpan: number) {
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
        const half = minimumSpan / 2;
        return { min: -half, max: half };
    }
    const span = max - min;
    if (span >= minimumSpan) {
        return { min, max };
    }
    const midpoint = (min + max) / 2;
    const half = minimumSpan / 2;
    return {
        min: midpoint - half,
        max: midpoint + half,
    };
}

function positionEdges(edges: InventoryNodeEdge[], positionedNodes: PositionedNode[]): PositionedEdge[] {
    if (!edges.length || !positionedNodes.length) return [];

    const nodeLookup = new Map(positionedNodes.map((entry) => [entry.node.id, entry]));

    return edges
        .map((edge) => {
            const source = nodeLookup.get(edge.source_node_id);
            const target = nodeLookup.get(edge.target_node_id);

            if (!source || !target) return null;

            const points = {
                sourceX: source.leftPercent,
                sourceY: source.topPercent,
                targetX: target.leftPercent,
                targetY: target.topPercent,
                midX: (source.leftPercent + target.leftPercent) / 2,
                midY: (source.topPercent + target.topPercent) / 2,
            };

            return { edge, points };
        })
        .filter((value): value is PositionedEdge => Boolean(value));
}

function deriveCategoriesFromNodes(nodes: InventoryNode[]): KitchenGraph['categories'] {
    const map = new Map<string, { id: string; name: string }>();
    nodes.forEach((node) => {
        if (node.category_id && node.category?.name) {
            map.set(node.category_id, { id: node.category_id, name: node.category.name });
        }
    });

    return Array.from(map.values()).map((entry) => ({
        id: entry.id,
        restaurant_id: '',
        name: entry.name,
        description: null,
        display_order: 0,
        color_code: null,
        created_at: '',
        updated_at: '',
        deleted_at: null,
    }));
}

function getLatestTimestamp(nodes: InventoryNode[]): string | null {
    const timestamps = nodes
        .map((node) => node.updated_at ?? node.created_at)
        .filter((value): value is string => Boolean(value));

    if (!timestamps.length) return null;
    return timestamps.reduce((latest, current) =>
            new Date(current).getTime() > new Date(latest).getTime() ? current : latest,
        timestamps[0]);
}