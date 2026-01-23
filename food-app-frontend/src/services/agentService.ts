import api from './api';
import type { ApiResponse } from '@/types/api';
import type {
    Agent,
    CreateAgentData,
    UpdateAgentData,
    AgentFilters,
    AgentStatus,
} from '@/types/delivery';

const apiVersion = import.meta.env.VITE_API_VERSION || 'v1';

const agentService = {
    /**
     * Get all agents for a restaurant
     */
    async getAgents(restaurantId: string, filters?: AgentFilters): Promise<Agent[]> {
        const response = await api.get<ApiResponse<Agent[]>>(
            `/${apiVersion}/restaurants/${restaurantId}/agents`,
            { params: filters }
        );
        if (response.data.status === 'success' && response.data.data) {
            return response.data.data;
        }
        throw new Error(response.data.message || 'Failed to fetch agents');
    },

    /**
     * Get available agents for a restaurant
     */
    async getAvailableAgents(restaurantId: string): Promise<Agent[]> {
        const response = await api.get<ApiResponse<Agent[]>>(
            `/${apiVersion}/restaurants/${restaurantId}/agents/available`
        );
        if (response.data.status === 'success' && response.data.data) {
            return response.data.data;
        }
        throw new Error(response.data.message || 'Failed to fetch available agents');
    },

    /**
     * Get a single agent by ID
     */
    async getAgent(agentId: string): Promise<Agent> {
        const response = await api.get<ApiResponse<Agent>>(
            `/${apiVersion}/agents/${agentId}`
        );
        if (response.data.status === 'success' && response.data.data) {
            return response.data.data;
        }
        throw new Error(response.data.message || 'Failed to fetch agent');
    },

    /**
     * Create a new agent for a restaurant
     */
    async createAgent(restaurantId: string, data: CreateAgentData): Promise<Agent> {
        const response = await api.post<ApiResponse<Agent>>(
            `/${apiVersion}/restaurants/${restaurantId}/agents`,
            data
        );
        if (response.data.status === 'success' && response.data.data) {
            return response.data.data;
        }
        throw new Error(response.data.message || 'Failed to create agent');
    },

    /**
     * Update an existing agent
     */
    async updateAgent(agentId: string, data: UpdateAgentData): Promise<Agent> {
        const response = await api.put<ApiResponse<Agent>>(
            `/${apiVersion}/agents/${agentId}`,
            data
        );
        if (response.data.status === 'success' && response.data.data) {
            return response.data.data;
        }
        throw new Error(response.data.message || 'Failed to update agent');
    },

    /**
     * Delete an agent
     */
    async deleteAgent(agentId: string): Promise<void> {
        const response = await api.delete<ApiResponse<null>>(
            `/${apiVersion}/agents/${agentId}`
        );
        if (response.data.status !== 'success') {
            throw new Error(response.data.message || 'Failed to delete agent');
        }
    },

    /**
     * Update agent status (activate/suspend)
     */
    async updateAgentStatus(agentId: string, status: AgentStatus): Promise<Agent> {
        const response = await api.patch<ApiResponse<Agent>>(
            `/${apiVersion}/agents/${agentId}/status`,
            { status }
        );
        if (response.data.status === 'success' && response.data.data) {
            return response.data.data;
        }
        throw new Error(response.data.message || 'Failed to update agent status');
    },

    /**
     * Toggle agent availability
     */
    async toggleAvailability(agentId: string): Promise<Agent> {
        const response = await api.patch<ApiResponse<Agent>>(
            `/${apiVersion}/agents/${agentId}/availability`
        );
        if (response.data.status === 'success' && response.data.data) {
            return response.data.data;
        }
        throw new Error(response.data.message || 'Failed to toggle availability');
    },
};

export default agentService;
