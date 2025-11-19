import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/services/api';
import { getEcho } from '@/services/realtime';
import type { Conversation, Message, ConnectionStatus } from '@/types/chat';
import { useToast } from './use-toast';

const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';
const buildApiUrl = (path: string) => `/api/${API_VERSION}${path}`;

interface UseOrderChatState {
  conversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
  error: Error | null;
  connectionStatus: ConnectionStatus;
}

interface UseOrderChatActions {
  sendMessage: (content: string) => Promise<void>;
  markAsRead: () => Promise<void>;
  retry: () => Promise<void>;
}

type UseOrderChat = UseOrderChatState & UseOrderChatActions;

/**
 * Custom hook for order-based chat functionality
 * Handles conversation loading, real-time updates, and message sending
 */
export function useOrderChat(orderId: string | null): UseOrderChat {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const { toast } = useToast();
  
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const echoChannelRef = useRef<string | null>(null);

  /**
   * Load or create conversation for the order
   */
  const loadConversation = useCallback(async () => {
    if (!orderId) {
      setIsLoading(false);
      setConversation(null);
      setMessages([]);
      setConnectionStatus('disconnected');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Try to get existing conversation
      const response = await api.get(
        buildApiUrl(`/orders/${orderId}/conversations`),
      );

      const conversationData = response.data.data;
      setConversation(conversationData);
      setMessages(conversationData.messages || []);
      retryCountRef.current = 0;
    } catch (err) {
      const error = err as { response?: { status?: number; data?: { message?: string } } };
      if (error.response?.status === 404) {
        // Conversation doesn't exist, create it
        try {
          const createResponse = await api.post(
            buildApiUrl(`/orders/${orderId}/conversations`),
            {},
          );

          const conversationData = createResponse.data.data;
          setConversation(conversationData);
          setMessages(conversationData.messages || []);
          retryCountRef.current = 0;
        } catch (createErr) {
          const createError = createErr as { response?: { data?: { message?: string } } };
          const errorMsg = createError.response?.data?.message || 'Failed to create conversation';
          setError(new Error(errorMsg));
          toast({
            title: 'Error',
            description: errorMsg,
            variant: 'destructive',
          });
        }
      } else {
        const errorMsg = error.response?.data?.message || 'Failed to load conversation';
        setError(new Error(errorMsg));
        
        // Retry with exponential backoff
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          const delay = Math.pow(2, retryCountRef.current) * 1000;
          setTimeout(() => loadConversation(), delay);
        } else {
          toast({
            title: 'Error',
            description: errorMsg,
            variant: 'destructive',
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [orderId, toast]);

  /**
   * Subscribe to real-time message updates via Laravel Echo
   */
  const subscribeToConversation = useCallback(() => {
    if (!conversation?.id) {
      setConnectionStatus('disconnected');
      return;
    }

    try {
      const echo = getEcho();

      if (echoChannelRef.current) {
        echo.leave(echoChannelRef.current);
      }

      const channelName = `conversation.${conversation.id}`;
      echoChannelRef.current = channelName;
      setConnectionStatus('disconnected');

      const channel = echo.private(channelName);

      channel.listen('MessageSent', (event: { message: Message }) => {
        const newMessage = event.message;

        setMessages((prevMessages) => {
          const exists = prevMessages.some((m) => m.id === newMessage.id);
          if (exists) {
            return prevMessages;
          }
          return [...prevMessages, newMessage];
        });
      });

      channel.subscribed(() => {
        setConnectionStatus('connected');
      });

      channel.error((error: unknown) => {
        console.error('Echo channel error:', error);
        setConnectionStatus('error');
      });
    } catch (err) {
      console.error('Failed to subscribe to Echo:', err);
      setConnectionStatus('error');
    }
  }, [conversation?.id]);

  /**
   * Mark all messages from other user as read
   */
  const markAsRead = useCallback(async () => {
    if (!conversation?.id) return;

    try {
      await api.post(
        buildApiUrl(`/conversations/${conversation.id}/read`),
        {},
      );
      
      // Update local messages to mark them as read
      const userId = localStorage.getItem('user_id');
      setMessages((prev) =>
        prev.map(m =>
          m.sender_id !== userId && !m.read_at
            ? { ...m, read_at: new Date().toISOString() }
            : m
        )
      );
    } catch (err) {
      // Silently fail - read status is not critical
      console.error('Failed to mark messages as read:', err);
    }
  }, [conversation?.id]);

  /**
   * Send a message in the conversation
   */
  const sendMessage = useCallback(async (content: string) => {
    if (!conversation?.id || !content.trim()) return;

    setIsSending(true);
    
    // Optimistic update - add temporary message
    const tempId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      id: tempId,
      conversation_id: conversation.id,
      sender_id: localStorage.getItem('user_id') || '',
      sender_role: 'customer', // Will be overwritten by server
      content: content.trim(),
      read_at: null,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMessage]);

    try {
      const response = await api.post(
        buildApiUrl(`/conversations/${conversation.id}/messages`),
        { content: content.trim() },
      );

      const serverMessage = response.data.data;
      
      // Replace temp message with server message
      setMessages((prev) => 
        prev.map(m => m.id === tempId ? serverMessage : m)
      );
      
      // Auto mark as read after sending (optional - can be deferred to component)
      // await markAsRead();
    } catch (err) {
      // Rollback optimistic update
      setMessages((prev) => prev.filter(m => m.id !== tempId));
      
      const error = err as { response?: { data?: { message?: string } } };
      const errorMsg = error.response?.data?.message || 'Failed to send message';
      toast({
        title: 'Failed to send message',
        description: errorMsg,
        variant: 'destructive',
      });
      
      throw new Error(errorMsg);
    } finally {
      setIsSending(false);
    }
  }, [conversation?.id, toast]);

  /**
   * Retry loading conversation
   */
  const retry = useCallback(async () => {
    retryCountRef.current = 0;
    await loadConversation();
  }, [loadConversation]);

  // Load conversation when orderId changes
  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  // Subscribe to real-time updates when conversation is loaded
  useEffect(() => {
    subscribeToConversation();

    // Cleanup on unmount or conversation change
    return () => {
      if (echoChannelRef.current) {
        try {
          const echo = getEcho();
          echo.leave(echoChannelRef.current);
        } catch (err) {
          console.error('Failed to leave channel:', err);
        }
        echoChannelRef.current = null;
      }
      setConnectionStatus('disconnected');
    };
  }, [subscribeToConversation]);

  return {
    conversation,
    messages,
    isLoading,
    isSending,
    error,
    connectionStatus,
    sendMessage,
    markAsRead,
    retry,
  };
}
