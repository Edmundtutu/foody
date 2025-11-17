import React, { useState, useEffect, useRef } from 'react';
import { useOrderChat } from '@/hooks/useOrderChat';
import { useAuth } from '@/context/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Send, AlertCircle, Wifi, WifiOff, Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface OrderChatProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
  context: 'restaurant' | 'customer';
}

export const OrderChat: React.FC<OrderChatProps> = ({
  orderId,
  isOpen,
  onClose,
  context
}) => {
  const { conversation, messages, isLoading, isSending, error, connectionStatus, sendMessage, markAsRead, retry } = useOrderChat(isOpen ? orderId : null);
  const { user } = useAuth();
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto mark as read when opened
  useEffect(() => {
    if (isOpen && conversation?.id) {
      markAsRead();
    }
  }, [isOpen, conversation?.id, markAsRead]);

  // Handle message send
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim() || isSending) return;

    try {
      await sendMessage(messageInput);
      setMessageInput('');
    } catch (error) {
      // Error already shown in hook
      console.error('Send error:', error);
    }
  };

  // Handle key press (Enter to send, Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Get display name based on context
  const getDisplayName = () => {
    if (context === 'restaurant') {
      return conversation?.customer?.name || 'Customer';
    }
    return conversation?.restaurant?.name || 'Restaurant';
  };

  // Render message content
  const renderMessages = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
          <Button onClick={retry} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      );
    }

    if (messages.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-center p-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">No messages yet</p>
            <p className="text-xs text-muted-foreground">Start the conversation!</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4 p-4">
        {messages.map((message) => {
          const isOwn = message.sender_id === user?.id;
          const isRead = message.read_at !== null;
          
          return (
            <div
              key={message.id}
              className={cn(
                'flex flex-col',
                isOwn ? 'items-end' : 'items-start'
              )}
            >
              <div
                className={cn(
                  'max-w-[70%] rounded-lg px-3 py-2 text-sm',
                  isOwn
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                <p className="break-words">{message.content}</p>
              </div>
              <div className="flex items-center gap-1 mt-1 px-1">
                <span className="text-xs text-muted-foreground">
                  {formatTime(message.created_at)}
                </span>
                {isOwn && (
                  <span className="text-xs">
                    {isRead ? (
                      <CheckCheck className="h-3 w-3 text-blue-500" />
                    ) : (
                      <Check className="h-3 w-3 text-muted-foreground" />
                    )}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    );
  };

  // Render connection status indicator
  const renderConnectionStatus = () => {
    if (connectionStatus === 'error') {
      return (
        <Alert variant="destructive" className="mb-2">
          <WifiOff className="h-4 w-4" />
          <AlertDescription className="text-xs ml-2">
            Connection lost. Messages may not be delivered.
          </AlertDescription>
        </Alert>
      );
    }
    
    if (connectionStatus === 'disconnected') {
      return (
        <Alert className="mb-2 bg-yellow-50 border-yellow-200">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription className="text-xs ml-2">
            Connecting...
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  };

  // Shared content for both Dialog and Drawer
  const renderContent = () => (
    <>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{getDisplayName()}</h3>
          {connectionStatus === 'connected' && (
            <Badge variant="outline" className="h-5 px-1.5 text-xs">
              <Wifi className="h-3 w-3 mr-1 text-green-500" />
              Online
            </Badge>
          )}
        </div>
        {conversation?.order && (
          <Badge variant="secondary" className="text-xs">
            Order #{conversation.order.id}
          </Badge>
        )}
      </div>

      {renderConnectionStatus()}

      {/* Messages Area */}
      <ScrollArea className="flex-1 -mx-4 px-4 mb-4" style={{ height: isMobile ? 'calc(100vh - 280px)' : '400px' }}>
        {renderMessages()}
      </ScrollArea>

      {/* Input Area */}
      <form onSubmit={handleSend} className="flex gap-2">
        <Input
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={isSending || isLoading || !!error}
          className="flex-1"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!messageInput.trim() || isSending || isLoading || !!error}
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </>
  );

  // Render as Drawer on mobile, Dialog on desktop
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Chat</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col flex-1 px-4 pb-4">
            {renderContent()}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Chat</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderChat;
