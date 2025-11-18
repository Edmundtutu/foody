import type { User } from './auth';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: 'customer' | 'restaurant';
  content: string;
  read_at: string | null;
  created_at: string;
  sender?: User;
}

export interface Conversation {
  id: string;
  order_id: string;
  customer_id: string;
  restaurant_id: string;
  status: 'active' | 'closed';
  last_message_at: string;
  created_at: string;
  updated_at: string;
  messages?: Message[];
  customer?: User;
  restaurant?: {
    id: string;
    name: string;
    owner_id: string;
  };
  order?: {
    id: string;
    status: string;
    total: number;
  };
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'error';
