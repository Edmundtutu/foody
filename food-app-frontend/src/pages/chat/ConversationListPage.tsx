import React, { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Clock, User, Store, Package, ArrowLeft } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { useResponsiveChat } from '@/hooks/useResponsiveChat';
import type { Conversation } from '@/services/chatService';

export const ConversationListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const chatMode = useResponsiveChat();
  
  const {
    conversations,
    getUnreadCount,
    getTypingUsers,
    isLoading,
    connectionStatus
  } = useChat();

  const formatTime = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  }, []);

  // Memoize formatted conversations to prevent unnecessary re-renders
  const formattedConversations = useMemo(() => {
    return conversations.map(conversation => {
      const unreadCount = getUnreadCount(conversation.id);
      const typingUsers = getTypingUsers(conversation.id);
      
      const title = user?.role === 'vendor' 
        ? conversation.user?.name || 'Customer'
        : conversation.shop?.name || 'Shop';
      
      const subtitle = typingUsers.length > 0
        ? `${typingUsers.map(t => t.name).join(', ')} ${typingUsers.length === 1 ? 'is' : 'are'} typing...`
        : (conversation as any).latest_message?.content || 'No messages yet';
      
      const time = conversation.last_message_at 
        ? formatTime(conversation.last_message_at) 
        : '';

      return {
        ...conversation,
        title,
        subtitle,
        time,
        unreadCount,
        typingUsers
      };
    });
  }, [conversations, getUnreadCount, getTypingUsers, user?.role, formatTime]);

  const handleConversationClick = (conversation: Conversation) => {
    navigate(`/chat/conversation/${conversation.order_id}`);
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  const renderConversationItem = (conversation: any) => (
    <Button
      key={conversation.id}
      variant="ghost"
      className="w-full justify-start p-4 h-auto border-b border-border/50"
      onClick={() => handleConversationClick(conversation)}
    >
      <div className="flex items-start gap-3 w-full">
        <Avatar className="h-12 w-12 flex-shrink-0">
          <AvatarFallback className="bg-primary text-primary-foreground">
            {user?.role === 'vendor' ? (
              <User className="h-6 w-6" />
            ) : (
              <Store className="h-6 w-6" />
            )}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="font-semibold text-base truncate">{conversation.title}</div>
            {conversation.time && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground flex-shrink-0">
                <Clock className="h-4 w-4" />
                {conversation.time}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground truncate mb-2">
            <Package className="h-4 w-4" />
            <span>Order #{conversation.order_id}</span>
          </div>
          
          <div className={`text-sm truncate ${
            conversation.typingUsers.length > 0 
              ? 'text-blue-600 font-medium' 
              : 'text-muted-foreground'
          }`}>
            {conversation.subtitle}
          </div>
        </div>

        {conversation.unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="h-6 w-6 flex items-center justify-center text-sm p-0 flex-shrink-0"
          >
            {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
          </Badge>
        )}
      </div>
    </Button>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading conversations...</div>
        </div>
      );
    }

    if (formattedConversations.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
          <div className="text-lg font-medium text-muted-foreground mb-2">No conversations yet</div>
          <div className="text-sm text-muted-foreground">
            Start a conversation by placing an order
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-0">
        {formattedConversations.map(renderConversationItem)}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackClick}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex-1">
            <h1 className="text-xl font-semibold">Conversations</h1>
            <p className="text-sm text-muted-foreground">
              {formattedConversations.length} conversation{formattedConversations.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          {connectionStatus !== 'connected' && (
            <Badge variant="outline" className="text-xs">
              {connectionStatus}
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 h-[calc(100vh-80px)]">
        {renderContent()}
      </ScrollArea>
    </div>
  );
};
