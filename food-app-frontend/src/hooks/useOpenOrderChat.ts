import { useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { useMultiChat } from '@/context/MultiChatContext';
import { useChatLayout } from '@/hooks/useChatLayout';
import type { Order } from '@/services/orderService';

interface UseOpenOrderChatOptions {
  onError?: (error: Error) => void;
} 

/**
 * Custom hook to handle opening order conversations.
 * Abstracts away the complex logic of:
 * - Vendor vs customer flows
 * - Mobile vs desktop chat layouts
 * - Conversation creation/loading
 * - Error handling
 */
export const useOpenOrderChat = (options?: UseOpenOrderChatOptions) => {
  const { user } = useAuth();
  const { conversations, ensureConversationForOrder, loadConversations, setActiveConversation } = useChat();
  const { openChat } = useMultiChat();
  const chatLayout = useChatLayout();

  const openOrderChat = useCallback(
    async (order: Order) => {
      try {
        if (!user) {
          throw new Error('User not authenticated');
        }

        console.log('🔄 Opening chat for order:', order.id);
        console.log('👤 User role:', user.role);
        console.log('📱 Chat layout:', chatLayout);

        // Find existing conversation for this order
        const existingConversation = conversations.find(
          conv => conv.order_id === String(order.id)
        );

        if (user.role === 'restaurant') {
          // Vendor flow
          if (chatLayout === 'mobile') {
            // Mobile: Navigate to full-screen chat
            console.log('📱 Mobile vendor: Navigating to chat page');
            const currentPath = window.location.pathname;
            const targetPath = `/chat/conversation/${order.id}`;

            if (currentPath !== targetPath) {
              window.location.href = targetPath;
            }
          } else {
            // Desktop: Open docked chat window
            console.log('🖥️ Desktop vendor: Opening docked chat window');

            let conversation = existingConversation;

            if (!conversation) {
              // Create/load conversation if it doesn't exist
              console.log('🔄 Creating/loading conversation for order:', order.id);
              conversation = await ensureConversationForOrder(String(order.id));

              if (!conversation) {
                throw new Error('Failed to create conversation for this order');
              }

              // Refresh conversations list
              await loadConversations();
            }

            // Set as active conversation and open chat
            setActiveConversation(conversation);
            openChat(conversation, order);
            console.log('✅ Chat opened successfully');
          }
        } else {
          // Customer flow: Always navigate to conversation list
          console.log('👤 Customer: Navigating to chat conversations page');
          window.location.href = '/chat/conversations';
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to open chat');
        console.error('❌ Error opening chat:', err);

        if (options?.onError) {
          options.onError(err);
        } else {
          // Default fallback to conversation list
          console.log('↩️ Falling back to conversation list');
          window.location.href = '/chat/conversations';
        }

        throw err;
      }
    },
    [user, conversations, ensureConversationForOrder, loadConversations, setActiveConversation, openChat, chatLayout, options]
  );

  return { openOrderChat };
};
