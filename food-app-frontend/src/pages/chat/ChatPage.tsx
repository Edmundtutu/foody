import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, Package, Store, User, Circle } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { useAuth } from '@/context/AuthContext';
import type { Message } from '@/services/chatService';

export const ChatPage: React.FC = () => {
  console.log('🚀 ChatPage component rendering');
  
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initializedRef = useRef<string | null>(null);
  
  console.log('📋 ChatPage params:', { orderId, user: user?.role });
  
  // Debug ChatPage loading
  useEffect(() => {
    console.log('📱 ChatPage loaded for order:', orderId);
    console.log('📍 Current URL:', window.location.href);
    console.log('👤 User:', user);
    return () => {
      console.log('📱 ChatPage unmounting for order:', orderId);
      initializedRef.current = null; // Reset initialization flag on unmount
    };
  }, [orderId, user]);
  
  const {
    conversations,
    messages,
    sendMessage,
    startTyping,
    stopTyping,
    getTypingUsers,
    markAsRead,
    ensureConversationForOrder,
    setActiveConversation,
    isLoading,
    connectionStatus
  } = useChat();

  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Find the conversation for this order
  const conversation = conversations.find(conv => conv.order_id === orderId);

  // Filter messages for this conversation
  const conversationMessages = messages.filter(msg => msg.conversation_id === conversation?.id);
  const typingUsers = conversation ? getTypingUsers(conversation.id) : [];

  // Initialize conversation when component mounts
  useEffect(() => {
    const initConversation = async () => {
      if (!orderId) return;
      
      // Prevent multiple initializations for the same order
      if (initializedRef.current === orderId) {
        console.log('⏭️ ChatPage: Already initialized for order:', orderId);
        return;
      }
      
      console.log('🔄 ChatPage: Initializing conversation for order:', orderId);
      initializedRef.current = orderId;
      
      try {
        const conv = await ensureConversationForOrder(orderId);
        console.log('📞 ChatPage: ensureConversationForOrder result:', conv);
        
        if (conv) {
          console.log('🎯 ChatPage: Setting active conversation:', conv);
          // CRITICAL: Set as active conversation to load messages and subscribe to real-time updates
          setActiveConversation(conv);
        }
      } catch (error) {
        console.error('❌ ChatPage: Failed to initialize conversation:', error);
        initializedRef.current = null; // Reset on error
      }
    };

    initConversation();
  }, [orderId]); // Only depend on orderId to prevent infinite loops

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  const handleSendMessage = useCallback(async () => {
    if (!messageText.trim() || !conversation) return;

    try {
      // Stop typing indicator when sending
      if (isTyping) {
        await stopTyping(conversation.id);
        setIsTyping(false);
      }

      await sendMessage({
        conversation_id: conversation.id,
        content: messageText.trim(),
        message_type: 'text'
      });
      
      setMessageText('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [messageText, conversation, isTyping, sendMessage, stopTyping]);

  const handleTyping = useCallback((text: string) => {
    setMessageText(text);
    
    if (!conversation) return;

    // Start typing if not already typing
    if (!isTyping && text.trim()) {
      setIsTyping(true);
      startTyping(conversation.id);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(async () => {
      if (isTyping) {
        await stopTyping(conversation.id);
        setIsTyping(false);
      }
    }, 2000);
  }, [conversation, isTyping, startTyping, stopTyping]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleBackClick = () => {
    navigate('/chat/conversations');
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isOwnMessage = (message: Message) => {
    return message.sender_id === user?.id;
  };

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  if (!conversation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium text-muted-foreground mb-2">Conversation not found</div>
          <Button onClick={handleBackClick} variant="outline">
            Back to conversations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className="text-xs">
                Order #{conversation.order_id}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {user?.role === 'customer' ? (
                <>
                  <Store className="h-4 w-4" />
                  <span>{conversation.shop?.name || 'Shop'}</span>
                </>
              ) : (
                <>
                  <User className="h-4 w-4" />
                  <span>{conversation.user?.name || 'Customer'}</span>
                </>
              )}
            </div>
          </div>
          
          {connectionStatus !== 'connected' && (
            <Badge variant="outline" className="text-xs">
              {connectionStatus}
            </Badge>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {conversationMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-muted-foreground mb-2">No messages yet</div>
              <div className="text-sm text-muted-foreground">Start the conversation!</div>
            </div>
          ) : (
            conversationMessages.map((message, index) => {
              const isOwn = isOwnMessage(message);
              const isLastMessage = index === conversationMessages.length - 1;
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      isOwn
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                    
                    <div className={`flex items-center justify-between mt-2 gap-2 ${
                      isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}>
                      <span className="text-xs">
                        {formatTime(message.created_at)}
                      </span>
                      
                      {isOwn && isLastMessage && (
                        <div className="flex items-center gap-1">
                          {message.read_at ? (
                            <Circle className="h-3 w-3 fill-blue-400 text-blue-400" />
                          ) : (
                            <Circle className="h-3 w-3 fill-gray-400 text-gray-400" />
                          )}
                          <span className="text-xs">
                            {message.read_at ? 'Read' : 'Sent'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          
          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div 
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" 
                      style={{ animationDelay: '0ms' }} 
                    />
                    <div 
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" 
                      style={{ animationDelay: '150ms' }} 
                    />
                    <div 
                      className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" 
                      style={{ animationDelay: '300ms' }} 
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {typingUsers.map(user => user.name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t p-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              value={messageText}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={connectionStatus !== 'connected' ? "Connecting..." : "Type your message..."}
              className="pr-12"
              disabled={isLoading || connectionStatus !== 'connected'}
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!messageText.trim() || isLoading || connectionStatus !== 'connected'}
            size="icon"
            className="h-10 w-10"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
