import api from './api';
import type { ApiResponse } from '@/types/api';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
  updated_at: string;
  sender?: import('@/types/auth').User;
}

export interface Conversation {
  id: string;
  order_id: string;
  customer_id: string;
  restaurant_id: string;
  status: string;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
  customer?: import('@/types/auth').User;
  restaurant?: import('./restaurantService').Restaurant;
  order?: import('./orderService').Order;
  messages?: Message[];
}

export interface CreateMessageData {
  content: string;
}

export interface ConversationFilters {
  restaurant_id?: string;
}

const chatService = {
  /**
   * Get all conversations (authenticated)
   */
  async getConversations(filters?: ConversationFilters): Promise<Conversation[]> {
    const response = await api.get<ApiResponse<Conversation[]>>(
      '/v1/conversations',
      {
        params: filters,
      }
    );
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch conversations');
  },

  /**
   * Get a single conversation by ID (authenticated)
   */
  async getConversation(conversationId: string): Promise<Conversation> {
    const response = await api.get<ApiResponse<Conversation>>(
      `/v1/conversations/${conversationId}`
    );
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to fetch conversation');
  },

  /**
   * Create a new message in a conversation (authenticated)
   */
  async createMessage(
    conversationId: string,
    data: CreateMessageData
  ): Promise<Message> {
    const response = await api.post<ApiResponse<Message>>(
      `/v1/conversations/${conversationId}/messages`,
      data
    );
    if (response.data.status === 'success' && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Failed to create message');
  },

  /**
   * Get restaurant conversations (authenticated)
   */
  async getRestaurantConversations(restaurantId: string): Promise<Conversation[]> {
    return this.getConversations({ restaurant_id: restaurantId });
  },
};

export default chatService;

