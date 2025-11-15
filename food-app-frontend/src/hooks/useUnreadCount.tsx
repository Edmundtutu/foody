import { useMemo } from 'react';
import { useChat } from '@/context/ChatContext';

export const useUnreadCount = (conversationId?: number) => {
  const { conversations, getUnreadCount } = useChat();

  // Get unread count for specific conversation
  const conversationUnreadCount = useMemo(() => {
    if (conversationId) {
      return getUnreadCount(conversationId);
    }
    return 0;
  }, [conversationId, getUnreadCount]);

  // Get total unread count across all conversations
  const totalUnreadCount = useMemo(() => {
    return conversations.reduce((total, conv) => total + getUnreadCount(conv.id), 0);
  }, [conversations, getUnreadCount]);

  return {
    conversationUnreadCount,
    totalUnreadCount
  };
};
