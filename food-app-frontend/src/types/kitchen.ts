/**
 * Kitchen Graph / Inventory System Types
 * Centralized type definitions for the kitchen graph feature
 */

export interface InventoryNode {
    id: string;
    restaurant_id: string;
    category_id: string | null;
    entity_type: 'dish' | 'modification' | 'category';
    entity_id: string;
    display_name: string | null;
    x: number;
    y: number;
    color_code: string | null;
    available: boolean;
    metadata: Record<string, any> | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    category?: {
        id: string;
        name: string;
        display_order: number;
        color_code?: string | null;
    };
}

export interface InventoryNodeEdge {
    id: string;
    restaurant_id: string;
    source_node_id: string;
    target_node_id: string;
    label: string | null;
    metadata: Record<string, any> | null;
    created_at: string;
    updated_at: string;
}

export interface MenuCategory {
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

export interface KitchenGraph {
    categories: MenuCategory[];
    nodes: InventoryNode[];
    edges: InventoryNodeEdge[];
}

export interface CreateNodeData {
    restaurant_id: string;
    category_id: string;
    entity_type: 'dish' | 'modification' | 'category';
    entity_id: string;
    display_name?: string;
    x?: number;
    y?: number;
    x_position?: number;
    y_position?: number;
    color_code?: string;
    available?: boolean;
    metadata?: Record<string, any>;
}

export interface MoveNodeData {
    x?: number;
    y?: number;
    x_position?: number;
    y_position?: number;
}

export interface CreateEdgeData {
    restaurant_id: string;
    source_node_id: string;
    target_node_id: string;
    label?: string;
    metadata?: Record<string, any>;
}
