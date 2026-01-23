import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Order, OrderItem } from '@/types';
import {
  MapPin,
  User as UserIcon,
  Store as StoreIcon,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  MessageCircle,
  Truck,
  ExternalLink,
  Layers,
} from 'lucide-react';
import CreatePostCard from '@/components/customer/profile/orders/CreatePostCard';
import { useImageCapture } from '@/hooks/useImageCapture';
import CameraCapture from '@/components/features/CameraCapture';
import { useToast } from '@/hooks/use-toast';
import { OrderChat } from '@/components/vendor/OrderChat';
import { DELIVERY_STATUS_CONFIG } from '@/types/delivery';

type OrderCardContext = 'customer' | 'vendor';

interface OrderCardProps {
  order: Order;
  context: OrderCardContext;
  onStartPost?: (order: Order) => void;
  isPostDisabled?: boolean;
  onConfirm?: (order: Order) => Promise<void>;
  onReject?: (order: Order) => Promise<void>;
}

const getStatusBadgeVariant = (status: Order['status']): 'default' | 'secondary' | 'destructive' => {
  switch (status) {
    case 'completed':
      return 'secondary';
    case 'cancelled':
      return 'destructive';
    case 'pending':
    case 'processing':
    default:
      return 'default';
  }
};

const formatUGX = (value: number) => `UGX ${Number(value).toLocaleString()}`;

/**
 * Get display name for an order item (handles both dish and combo types)
 */
const getOrderItemName = (item: OrderItem): string => {
  // Check if it's a combo item
  if (item.type === 'combo' || item.combo_selection_id) {
    // Try to get combo name from selection
    if (item.combo_selection) {
      const itemCount = item.combo_selection.items?.length || 0;
      // Generate name from selected dishes if available
      if (item.combo_selection.items && item.combo_selection.items.length > 0) {
        const dishNames = item.combo_selection.items
          .slice(0, 2)
          .map(i => i.dish?.name || 'Item')
          .join(', ');
        return itemCount > 2 
          ? `Combo: ${dishNames} +${itemCount - 2} more`
          : `Combo: ${dishNames}`;
      }
      return `Combo (${itemCount} items)`;
    }
    return 'Combo';
  }
  
  // Regular dish item
  return item.dish?.name || item.product?.name || 'Item';
};

/**
 * Check if item is a combo
 */
const isComboItem = (item: OrderItem): boolean => {
  return item.type === 'combo' || !!item.combo_selection_id;
};

export const OrderCard: React.FC<OrderCardProps> = ({
                                                      order,
                                                      context,
                                                      onStartPost,
                                                      isPostDisabled,
                                                      onConfirm,
                                                      onReject,
                                                    }) => {
  const navigate = useNavigate();
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isActionInProgress, setIsActionInProgress] = useState(false);
  const [hasActionCompleted, setHasActionCompleted] = useState(false);
  const [isOrderChatOpen, setIsOrderChatOpen] = useState(false);
  const imageCapture = useImageCapture();
  const { toast } = useToast();

  const createdAt = new Date(order.created_at);
  
  // Map order_type to display label
  const orderTypeLabel = {
    'DINE_IN': 'Dine In',
    'TAKEAWAY': 'Takeaway',
    'DELIVERY': 'Delivery',
  }[order.order_type] || order.order_type || 'Takeaway';
  
  const isDeliveryOrder = order.order_type === 'DELIVERY';

  // Check if order is in a state that allows confirm/reject actions
  const canPerformActions = order.status === 'pending';

  // Navigate to order details
  const handleViewDetails = (e: React.MouseEvent) => {
    // Prevent navigation if clicking on interactive elements
    if ((e.target as HTMLElement).closest('button, a, [role="button"]')) {
      return;
    }
    const path = context === 'vendor' ? `/vendor/orders/${order.id}` : `/orders/${order.id}`;
    navigate(path);
  };

  // Handle chat button click
  const handleChatClick = () => {
    setIsOrderChatOpen(true);
  };

  const handleConfirm = async () => {
    if (!onConfirm || isActionInProgress) return;
    
    setIsActionInProgress(true);
    try {
      await onConfirm(order);
      setHasActionCompleted(true);
      toast({
        title: 'Order Confirmed',
        description: 'Order has been confirmed successfully.',
      });
    } catch (error) {
      toast({
        title: 'Confirmation Failed',
        description: error instanceof Error ? error.message : 'Failed to confirm order.',
        variant: 'destructive',
      });
    } finally {
      setIsActionInProgress(false);
    }
  };

  const handleReject = async () => {
    if (!onReject || isActionInProgress) return;
    
    setIsActionInProgress(true);
    try {
      await onReject(order);
      setHasActionCompleted(true);
      toast({
        title: 'Order Rejected',
        description: 'Order has been rejected successfully.',
      });
    } catch (error) {
      toast({
        title: 'Rejection Failed',
        description: error instanceof Error ? error.message : 'Failed to reject order.',
        variant: 'destructive',
      });
    } finally {
      setIsActionInProgress(false);
    }
  };

  return (
      <Card 
        className="h-full flex flex-col relative w-full min-w-0 cursor-pointer hover:shadow-md transition-shadow"
        onClick={handleViewDetails}
      >
        <CardHeader className="p-2 sm:p-3 lg:p-4 pb-2">
          <div className="flex items-start justify-between gap-1.5 sm:gap-2">
            <div className="flex-1 min-w-0 pr-1">
              <CardTitle className="text-xs sm:text-sm md:text-base truncate leading-tight flex items-center gap-1">
                Order #{order.id.slice(-8).toUpperCase()}
                <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardTitle>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 leading-tight">
                {createdAt.toLocaleDateString()}
              </p>
            </div>
            <div className="text-right flex-shrink-0 min-w-0 space-y-1">
              <div className="flex items-center gap-1 justify-end flex-wrap">
                <Badge variant={getStatusBadgeVariant(order.status)} className="capitalize text-[9px] sm:text-xs px-1 py-0.5">
                  {order.status}
                </Badge>
                {isDeliveryOrder && (
                  <Badge variant="outline" className="text-[9px] sm:text-xs px-1 py-0.5 gap-0.5">
                    <Truck className="h-2.5 w-2.5" />
                  </Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm md:text-base font-bold leading-tight">
                {formatUGX(order.total)}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-2 sm:p-3 lg:p-4 pt-0 flex-1 flex flex-col min-w-0">
          {/* Delivery status badge - only show when agent is assigned (not PENDING) */}
          {isDeliveryOrder && order.logistics && order.logistics.delivery_status !== 'PENDING' && (
            <div className="mb-2">
              <Badge 
                className={`text-[9px] sm:text-xs px-1.5 py-0.5 ${DELIVERY_STATUS_CONFIG[order.logistics.delivery_status]?.bgColor || 'bg-gray-100'} ${DELIVERY_STATUS_CONFIG[order.logistics.delivery_status]?.color || 'text-gray-700'}`}
              >
                {DELIVERY_STATUS_CONFIG[order.logistics.delivery_status]?.label || order.logistics.delivery_status}
              </Badge>
            </div>
          )}

          <div className="flex items-center gap-1 sm:gap-2 mb-2 text-[10px] sm:text-xs text-muted-foreground min-w-0">
            {context === 'customer' ? (
                <>
                  <StoreIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 flex-shrink-0" />
                  <span className="truncate flex-1 min-w-0">{order.shop?.name ?? order.restaurant?.name ?? 'Shop'}</span>
                </>
            ) : (
                <>
                  <UserIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 flex-shrink-0" />
                  <span className="truncate flex-1 min-w-0">{order.user?.name ?? 'Customer'}</span>
                </>
            )}
            <span className="mx-0.5 sm:mx-1 flex-shrink-0 text-[8px] sm:text-[10px]">•</span>
            <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 flex-shrink-0" />
            <span className="truncate max-w-[3rem] sm:max-w-none">{orderTypeLabel}</span>
          </div>

          <div className="space-y-1 sm:space-y-1.5 flex-1 mb-2 min-w-0">
            {(order.items || []).slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center justify-between text-[10px] sm:text-xs gap-1 sm:gap-2 min-w-0">
              <span className="truncate flex-1 min-w-0 leading-tight flex items-center gap-1">
                {isComboItem(item) && <Layers className="h-3 w-3 flex-shrink-0 text-muted-foreground" />}
                {getOrderItemName(item)} × {item.quantity}
              </span>
                  <span className="flex-shrink-0 font-medium text-[9px] sm:text-xs">
                {formatUGX(item.unit_price * item.quantity)}
              </span>
                </div>
            ))}
            {(order.items ?? []).length > 3 && (
                <div className="text-[9px] sm:text-xs text-muted-foreground text-center py-0.5">
                  +{(order.items ?? []).length - 3} more items
                </div>
            )}
          </div>

          <div className="flex flex-wrap gap-1 mt-auto mb-2">
            <Badge variant="outline" className="text-[9px] sm:text-xs px-1 py-0.5 leading-tight">
              {orderTypeLabel}
            </Badge>
            {order.notes && (
                <Badge
                    variant="outline"
                    className="truncate max-w-[4rem] sm:max-w-[6rem] md:max-w-[8rem] text-[9px] sm:text-xs px-1 py-0.5 leading-tight"
                    title={order.notes}
                >
                  Note
                </Badge>
            )}
          </div>

          {/* Conditional rendering based on context */}
          <div className="mt-1 sm:mt-2">
            {context === 'customer' ? (
                /* Customer context - Post review functionality */
                <>
                  {/* Open CTA (disabled if already posted). Hidden while composer is open */}
                  {!isComposerOpen && (
                      <button
                          type="button"
                          onClick={() => {
                            setIsComposerOpen(true);
                            onStartPost?.(order);
                          }}
                          disabled={isPostDisabled}
                          className={`inline-flex items-center gap-1 text-[10px] sm:text-xs px-2 py-1 sm:px-3 sm:py-2 rounded-md border transition-colors w-full sm:w-auto justify-center sm:justify-start ${
                              isPostDisabled
                                  ? 'text-muted-foreground border-muted bg-muted/30 cursor-not-allowed'
                                  : 'text-primary border-primary/30 hover:bg-primary/5'
                          }`}
                      >
                        <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="truncate">Post review</span>
                      </button>
                  )}

                  {/* Composer content with its own Close control (always enabled) */}
                  <div
                      className={`${isComposerOpen ? 'max-h-[2000px] opacity-100 mt-2' : 'max-h-0 opacity-0'} overflow-hidden transition-all duration-300 ease-in-out`}
                  >
                    {isComposerOpen && (
                        <div className="flex items-center justify-between mb-1 sm:mb-2 gap-1">
                    <span className="text-[9px] sm:text-xs text-muted-foreground truncate flex-1">
                      Review Order #{order.id}
                    </span>
                          <button
                              type="button"
                              onClick={() => setIsComposerOpen(false)}
                              className="text-[9px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded-md border hover:bg-muted flex-shrink-0"
                          >
                            <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                        </div>
                    )}
                    {isComposerOpen && (
                        <div className="w-full min-w-0">
                          <CreatePostCard
                              imageCapture={imageCapture}
                              createContext={{ restaurantId: order.restaurant_id, dishId: (order.items?.[0]?.dish_id) }}
                              forceExpanded={true}
                          />
                        </div>
                    )}
                  </div>
                </>
            ) : (
                /* Vendor context - Action buttons */
                <div className="flex items-center gap-1 sm:gap-2">
                  {/* Confirm and Reject buttons - only show for pending orders and before action completion */}
                  {canPerformActions && !hasActionCompleted && (
                    <>
                      <button
                          type="button"
                          onClick={handleConfirm}
                          disabled={isActionInProgress}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 text-[10px] sm:text-xs px-2 py-1 sm:px-3 sm:py-2 rounded-md border border-green-200 text-green-700 hover:bg-green-50 transition-colors min-w-0 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Confirm order"
                      >
                        <Check className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="hidden sm:inline truncate">
                          {isActionInProgress ? 'Confirming...' : 'Confirm'}
                        </span>
                      </button>

                      <button
                          type="button"
                          onClick={handleReject}
                          disabled={isActionInProgress}
                          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 text-[10px] sm:text-xs px-2 py-1 sm:px-3 sm:py-2 rounded-md border border-red-200 text-red-700 hover:bg-red-50 transition-colors min-w-0 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Reject order"
                      >
                        <X className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="hidden sm:inline truncate">
                          {isActionInProgress ? 'Rejecting...' : 'Reject'}
                        </span>
                      </button>
                    </>
                  )}

                  {/* Chat button - always visible in vendor context */}
                  <button
                      type="button"
                      onClick={handleChatClick}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 text-[10px] sm:text-xs px-2 py-1 sm:px-3 sm:py-2 rounded-md border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors min-w-0"
                      title="Chat with customer"
                  >
                    <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="hidden sm:inline truncate">Chat</span>
                  </button>
                </div>
            )}
          </div>

          {/* Camera modal - only for customer context */}
          {context === 'customer' && imageCapture.showCameraModal && (
              <div className="fixed inset-0 z-[100] bg-background">
                <CameraCapture
                    onCapture={(img) => imageCapture.handleCameraCapture(img)}
                    onClose={() => imageCapture.handleCameraClose()}
                />
              </div>
          )}
        </CardContent>

        {/* Order Chat Component */}
        {isOrderChatOpen && (
          <OrderChat
            orderId={String(order.id)}
            isOpen={isOrderChatOpen}
            onClose={() => setIsOrderChatOpen(false)}
            context={context === 'vendor' ? 'restaurant' : 'customer'}
          />
        )}
      </Card>
  );
};

export default OrderCard;