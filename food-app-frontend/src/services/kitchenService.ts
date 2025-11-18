import api from './api';
import type { ApiResponse } from '@/types/api';

const apiVersion = import.meta.env.VITE_API_VERSION || 'v1';

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

const kitchenService = {
  /**
   * Get the complete kitchen graph for a restaurant
   */
  async getGraph(restaurantId: string): Promise<KitchenGraph> {
    const response = await api.get<ApiResponse<KitchenGraph>>(
      `/${apiVersion}/kitchen/restaurants/${restaurantId}/graph`
    );
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch kitchen graph');
  },

  /**
   * Get a single node by ID
   */
  async getNode(nodeId: string): Promise<InventoryNode> {
    const response = await api.get<ApiResponse<InventoryNode>>(
      `/${apiVersion}/kitchen/nodes/${nodeId}`
    );
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch node');
  },

  /**
   * Create a new inventory node
   */
  async createNode(data: CreateNodeData): Promise<InventoryNode> {
    const response = await api.post<ApiResponse<InventoryNode>>(
      `/${apiVersion}/kitchen/nodes`,
      data
    );
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to create node');
  },

  /**
   * Toggle node availability
   */
  async toggleNode(nodeId: string): Promise<InventoryNode> {
    const response = await api.patch<ApiResponse<InventoryNode>>(
      `/${apiVersion}/kitchen/nodes/${nodeId}/toggle`
    );
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to toggle node');
  },

  /**
   * Update node position
   */
  async moveNode(nodeId: string, data: MoveNodeData): Promise<InventoryNode> {
    const response = await api.patch<ApiResponse<InventoryNode>>(
      `/${apiVersion}/kitchen/nodes/${nodeId}/move`,
      data
    );
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to move node');
  },

  /**
   * Delete a node
   */
  async deleteNode(nodeId: string): Promise<void> {
    const response = await api.delete<ApiResponse<null>>(
      `/${apiVersion}/kitchen/nodes/${nodeId}`
    );
    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Failed to delete node');
    }
  },

  /**
   * Create an edge connection
   */
  async createEdge(data: CreateEdgeData): Promise<InventoryNodeEdge> {
    const response = await api.post<ApiResponse<InventoryNodeEdge>>(
      `/${apiVersion}/kitchen/edges`,
      data
    );
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to create edge');
  },

  /**
   * Delete an edge
   */
  async deleteEdge(edgeId: string): Promise<void> {
    const response = await api.delete<ApiResponse<null>>(
      `/${apiVersion}/kitchen/edges/${edgeId}`
    );
    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Failed to delete edge');
    }
  },
};

export default kitchenService;

