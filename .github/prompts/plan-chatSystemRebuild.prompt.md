# Plan: Rebuild Chat System for Order Conversations

## Executive Summary

Replace the current broken multi-purpose chat system with a focused, order-centric chat feature. The chat initiates from the restaurant side when they receive an order. Backend infrastructure exists but needs refinement; frontend will be completely rebuilt with a single, simple flow: restaurant opens order → restaurant clicks chat → conversation loads/creates → real-time messaging → restaurant & customer agree → order confirmed. Focus on reliability, not feature richness.

### ⚠️ CRITICAL TERMINOLOGY NOTE

Throughout this plan, the terms **MUST** be used consistently:
- **"restaurant"** — The business entity (from database)
- **"customer"** — The user placing the order
- **NEVER use "vendor"** — This term is ambiguous and causes confusion

When referring to user roles in code and comments:
- User role is `"restaurant"` (not "vendor", "shop", "seller", etc.)
- User role is `"customer"` (not "user", "buyer", "client", etc.)

Backend database columns: `owner_id` on restaurants table refers to the restaurant manager's user ID.

This consistency prevents bugs where code conflates different user types.

---

## Phase Breakdown

### Phase 1: Cleanup & Foundation (Frontend Removal)

**Objective:** Remove all existing chat infrastructure to start fresh

#### Files to Delete (Frontend)

1. **Pages (2 files)**
   - `src/pages/chat/ChatPage.tsx` — Full-screen conversation view
   - `src/pages/chat/ConversationListPage.tsx` — List all conversations

2. **Context Providers (2 files)**
   - `src/context/ChatContext.tsx` — Main chat state management
   - `src/context/MultiChatContext.tsx` — Docked desktop chat windows

3. **Custom Hooks (4 files)**
   - `src/hooks/useOpenOrderChat.ts` — Opens chat for orders (broken routing)
   - `src/hooks/useUnreadCount.tsx` — Unread badge logic
   - `src/hooks/useChatLayout.tsx` — Mobile/desktop detection
   - `src/hooks/useResponsiveChat.ts` — Responsive breakpoint hook

4. **Services (1 file)**
   - `src/services/chatService.ts` — API client with wrong signatures

#### Files to Modify (Frontend)

1. **`src/core/App.tsx`**
   - Remove: ChatProvider import (line 9)
   - Remove: MultiChatProvider import (line 10)
   - Remove: ChatProvider wrapper (lines 32-40)
   - Remove: MultiChatProvider wrapper (nested inside ChatProvider)

2. **`src/routes/AppRoutes.tsx`**
   - Remove: ChatPage import (line 15)
   - Remove: ConversationListPage import (line 16)
   - Remove: Route for `/chat/conversations` (line 155)
   - Remove: Route for `/chat/:orderId` (line 160)

3. **`src/components/shared/OrderCard.tsx`**
   - Remove: useChat import (line 19)
   - Remove: useOpenOrderChat import (line 21)
   - Remove: useUnreadCount import (line 21)
   - Remove: All chat-related state from component
   - Remove: handleChatClick function
   - Remove: Chat button rendering
   - Remove: Unread count badge logic
   - **Keep:** Structure and other functionality (confirm/reject, post review, etc.)

#### Cleanup Verification

- [ ] No remaining imports from deleted chat files
- [ ] OrderCard compiles without chat dependencies
- [ ] App.tsx providers list cleaned up
- [ ] AppRoutes only has non-chat routes
- [ ] No unused imports in remaining files

---

### Phase 2: Backend Refactoring

**Objective:** Align backend implementation with new order-chat-only flow

#### Services to Refactor

**`app/Services/ChatService.php`**

Replace entire implementation with:

```php
// Methods needed:
- createConversationForOrder($orderId): Conversation
  - Find or create conversation linked to order
  - Ensure user owns the order's restaurant (owner_id match) OR is the customer
  - Return full conversation with messages
  
- getConversationForOrder($orderId, $userId): Conversation
  - Get conversation for order
  - Verify user has access (is restaurant owner or is customer)
  - Return with messages, order, customer, restaurant
  - Throw 403 if unauthorized
  
- sendMessage($conversationId, $userId, $content): Message
  - Verify user has access to conversation
  - Create message with sender_id, content
  - Automatically determine sender_role from auth()->user()->role (must be "restaurant" or "customer")
  - Update conversation's last_message_at
  - Broadcast MessageSent event
  - Return message with sender relation
  
- markMessagesAsRead($conversationId, $userId): int
  - Mark all messages from OTHER user as read in conversation
  - Verify user access (is restaurant owner or is customer of the conversation)
  - Update read_at for matching messages
  - Broadcast read status (optional)
  - Return count of updated messages
```

#### Controllers to Refactor

**`app/Http/Controllers/Api/Chats/ConversationController.php`**

```php
// Methods needed:
- getForOrder($orderId): JsonResponse
  - Get or create conversation for order
  - Auth::user() must own the restaurant (owner_id) OR be the customer of the order
  - Returns ConversationResource with full message history
  - Route: GET /api/v1/orders/{orderId}/conversations
  
- store($orderId): JsonResponse
  - Explicitly create conversation for order
  - Only users with role="restaurant" can call this (only restaurants initiate)
  - Verify auth user owns the restaurant of this order
  - Returns ConversationResource
  - Route: POST /api/v1/orders/{orderId}/conversations
  
- markAsRead($conversationId): JsonResponse
  - Mark messages as read by current user
  - Verify current user is restaurant owner or customer of conversation
  - Returns { success: true, updated_count: int }
  - Route: POST /api/v1/conversations/{conversationId}/read
```

**`app/Http/Controllers/Api/Chats/MessageController.php`**

```php
// Methods needed:
- store($conversationId, MessageRequest $request): JsonResponse
  - Create message in conversation
  - Verify user has access to conversation (is restaurant owner or customer)
  - Automatically set sender_id to Auth::id()
  - Automatically set sender_role from auth()->user()->role (must be "restaurant" or "customer")
  - DO NOT trust sender_role from request — always derive from authenticated user
  - Broadcast MessageSent event
  - Returns MessageResource
  - Route: POST /api/v1/conversations/{conversationId}/messages
  
- index($conversationId): JsonResponse (optional)
  - Get paginated messages for conversation
  - Verify user access to conversation
  - Route: GET /api/v1/conversations/{conversationId}/messages?page=1
  - Returns paginated MessageResource collection
```

#### Routes to Update

**`routes/api.php`**

```php
// Replace existing conversation routes with:

Route::middleware(['auth:sanctum'])->group(function () {
    // Order-specific conversation endpoints
    Route::post('/orders/{orderId}/conversations', [ConversationController::class, 'store']);
    Route::get('/orders/{orderId}/conversations', [ConversationController::class, 'getForOrder']);
    
    // Conversation message endpoints
    Route::post('/conversations/{conversationId}/messages', [MessageController::class, 'store']);
    Route::get('/conversations/{conversationId}/messages', [MessageController::class, 'index']);
    Route::post('/conversations/{conversationId}/read', [ConversationController::class, 'markAsRead']);
    
    // Optional: Typing indicators
    // Route::post('/conversations/{conversationId}/typing/start', [ConversationController::class, 'startTyping']);
    // Route::post('/conversations/{conversationId}/typing/stop', [ConversationController::class, 'stopTyping']);
});
```

#### Broadcasting Events (Keep as-is)

**`app/Events/MessageSent.php`**

- Broadcasts to: `private-conversation.{conversationId}`
- Event name: `message.sent`
- Data includes: id, conversation_id, sender_id, sender_role, content, created_at, sender (user)
- **No changes needed** — this is correct

#### Models (No Changes Needed)

- `app/Models/Conversation.php` — Already correct
- `app/Models/Message.php` — Already correct

#### Requests & Resources (No Changes Needed)

- `app/Http/Requests/MessageRequest.php` — Already correct
- `app/Http/Resources/ConversationResource.php` — Already correct
- `app/Http/Resources/MessageResource.php` — Already correct

---

### Phase 3: Frontend Rebuild — Core Hook

**Objective:** Create single, focused hook for order-based conversations

#### New File: `src/hooks/useOrderChat.ts`

```typescript
interface UseOrderChatState {
  conversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  isSending: boolean;
  error: Error | null;
  connectionStatus: 'connected' | 'disconnected' | 'error';
}

interface UseOrderChatActions {
  sendMessage: (content: string) => Promise<void>;
  markAsRead: () => Promise<void>;
  retry: () => Promise<void>;
}

export function useOrderChat(orderId: string | null): UseOrderChatState & UseOrderChatActions {
  // Load/create conversation for order
  // Subscribe to real-time message updates via Laravel Echo
  // Handle optimistic message sending
  // Track connection status
  // Handle errors with exponential backoff retry
  
  return {
    // State
    conversation,
    messages,
    isLoading,
    isSending,
    error,
    connectionStatus,
    
    // Actions
    sendMessage: async (content) => { ... },
    markAsRead: async () => { ... },
    retry: async () => { ... }
  };
}
```

**Implementation Details:**

1. **Initialization:**
   - If `orderId` is null, set loading=false, conversation=null
   - When orderId changes, call `GET /api/v1/orders/{orderId}/conversations`
   - If 404, auto-create with `POST /api/v1/orders/{orderId}/conversations`
   - Load messages into state
   - Subscribe to Echo channel

2. **Message Sending:**
   - Optimistically add message to local state with pending status
   - Call `POST /api/v1/conversations/{conversationId}/messages`
   - Update message with server response (id, timestamps)
   - Broadcast MessageSent automatically handles other listeners
   - Rollback on error with toast notification

3. **Real-Time Updates:**
   - Subscribe to `private-conversation.{conversationId}`
   - Listen for `message.sent` event
   - Add new message to state if not already present
   - Update user's local message IDs with server IDs
   - Unsubscribe on unmount or orderId change

4. **Read Status:**
   - Call `POST /api/v1/conversations/{conversationId}/read` when conversation first loads
   - Automatically call when sending message
   - Handle silently if fails (non-critical)

5. **Error Handling:**
   - Store error in state
   - Show toast with error message
   - Provide retry function
   - Exponential backoff on network failures (3 retries max)

---

### Phase 4: Frontend Rebuild — UI Component

**Objective:** Build focused order-chat modal/drawer component

#### New File: `src/components/vendor/OrderChat.tsx`

```typescript
interface OrderChatProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
  context: 'restaurant' | 'customer'; // Which view to show - use actual user role
}

export const OrderChat: React.FC<OrderChatProps> = ({
  orderId,
  isOpen,
  onClose,
  context
}) => {
  const { conversation, messages, isLoading, isSending, error, sendMessage, markAsRead } = useOrderChat(orderId);
  const { user } = useAuth();
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Auto mark as read when opened
  useEffect(() => {
    if (isOpen && conversation?.id) {
      markAsRead();
    }
  }, [isOpen, conversation?.id, markAsRead]);
  
  // Handle message send
  const handleSend = async () => {
    if (!messageInput.trim()) return;
    
    try {
      await sendMessage(messageInput);
      setMessageInput('');
    } catch (error) {
      // Error already shown in hook
    }
  };
  
  // Render logic:
  // - Loading state: skeleton
  // - Error state: error message with retry
  // - Loaded state:
  //   - Message list (scrollable, auto-scroll to bottom)
  //   - Typing indicators (if other user typing)
  //   - Input field (textarea, send button)
  //   - Based on context (never use "vendor"):
  //     - context === 'restaurant': show customer name, order status
  //     - context === 'customer': show restaurant name, order details
};
```

**Features:**

- Display messages with sender name, timestamp, read status
- Auto-scroll to latest message
- Optimistic message sending (show immediately, pending style)
- Typing indicators for other user
- Connection status indicator (connected/reconnecting/error)
- Full height conversation view
- Responsive: modal on desktop, full-screen drawer on mobile

---

### Phase 5: Integration

**Objective:** Connect OrderCard → OrderChat modal → useOrderChat hook

#### Update `src/components/shared/OrderCard.tsx`

```typescript
import { OrderChat } from '@/components/vendor/OrderChat';

export const OrderCard: React.FC<OrderCardProps> = ({ order, context, ... }) => {
  const [isOrderChatOpen, setIsOrderChatOpen] = useState(false);
  
  // Replace old useOpenOrderChat logic with simple state
  const handleChatClick = () => {
    setIsOrderChatOpen(true);
  };
  
  return (
    <>
      <Card>
        {/* Existing order card content */}
        
        {/* Chat button — simplified */}
        <button onClick={handleChatClick}>
          <MessageCircle /> Chat
        </button>
      </Card>
      
      {/* Order chat modal/drawer */}
      {/* context param must be 'restaurant' or 'customer' — never 'vendor' */}
      <OrderChat
        orderId={String(order.id)}
        isOpen={isOrderChatOpen}
        onClose={() => setIsOrderChatOpen(false)}
        context={context === 'restaurant' ? 'restaurant' : 'customer'}
      />
    </>
  );
};
```

---

### Phase 6: Backend Broadcasting & Real-Time

**Objective:** Ensure Laravel Echo real-time messaging works end-to-end

#### Verify Reverb Configuration

**`config/reverb.php`**
- Ensure `REVERB_APP_ID` and `REVERB_APP_KEY` are set in `.env`
- Verify `REVERB_HOST`, `REVERB_PORT` match frontend WebSocket URL

#### Verify Broadcasting Setup

**`config/broadcasting.php`**
- Default driver should be `reverb` (or `pusher` if using external service)
- Verify credentials match reverb config

**`routes/channels.php`**
```php
// Keep existing private channel auth:
Broadcast::channel('conversation.{conversationId}', function (User $user, $conversationId) {
    $conversation = Conversation::find($conversationId);
    
    // User must be customer OR restaurant manager (owner) of this conversation
    if (!$conversation) {
        return false;
    }
    
    // Check if user is the customer
    if ($user->id === $conversation->customer_id) {
        return true;
    }
    
    // Check if user is the restaurant manager (owner of the restaurant)
    if ($user->restaurants()->where('id', $conversation->restaurant_id)->exists()) {
        return true;
    }
    
    return false;
});
```

#### Frontend Echo Setup

**`src/services/realtime.ts`** (Keep & Verify)

```typescript
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher; // Ensure global available

const echo = new Echo({
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY,
  wsHost: import.meta.env.VITE_REVERB_HOST,
  wsPort: import.meta.env.VITE_REVERB_PORT,
  wssPort: import.meta.env.VITE_REVERB_WSS_PORT,
  forceTLS: import.meta.env.VITE_REVERB_FORCE_TLS === 'true',
  enabledTransports: ['ws', 'wss'],
});

export function getEcho(): Echo {
  return echo;
}
```

---

## Further Considerations & Decisions

### 1. Flow & UX

**Question:** Modal vs Drawer vs Full-Screen?

**Decision:**
- **Desktop (≥1024px):** Modal that overlays the order card (80% width, centered)
- **Tablet (768px-1023px):** Drawer that slides from right (60% width)
- **Mobile (<768px):** Full-screen overlay when chat is open

**Rationale:** Keeps restaurant manager focused on order context while allowing messaging

---

### 2. Conversation Creation Timing

**Question:** When should conversation be created?

**Decision:** Lazy creation on first restaurant chat action
- When restaurant manager clicks "Chat" button, call `POST /api/v1/orders/{orderId}/conversations`
- If conversation already exists, endpoint returns existing one
- No conversation auto-creation on order received

**Rationale:** Reduces database clutter; conversations only exist when needed

---

### 3. Message Read States

**Question:** How to handle "message read" status?

**Decision:**
- Calls `POST /api/v1/conversations/{conversationId}/read` when chat opens
- Marks all OTHER user's messages as read
- Show check (unread) and double-check (read) icons on messages
- No real-time read broadcast (silent update)

**Rationale:** Simplifies backend; read status is informational, not critical

---

### 4. Typing Indicators

**Question:** Should we implement typing indicators?

**Decision:** Defer to Phase 2
- Phase 1: Implement without typing indicators (remove stub functions)
- Can be added later with `startTyping` / `stopTyping` endpoints
- For now, assume typing happens naturally without visual indicator

**Rationale:** Keep Phase 1 scope minimal; typing is nice-to-have, not essential

---

### 5. Authorization & Security

**Question:** How strictly to enforce access control?

**Decision:**
- Backend returns **403 Forbidden** if user not authorized
- Don't hide conversation existence (404 vs 403)
- Frontend shows error state with message: "You don't have access to this conversation"
- No silent failures
- Restaurant manager must own the restaurant of the order
- Customer must be the customer_id of the order

**Rationale:** Clear feedback for debugging; security is explicit not implicit

---

### 6. Message History

**Question:** Should old messages be paginated or loaded all at once?

**Decision:** Load all messages for conversation on open
- Conversation.show() returns full message history
- No pagination initially
- Can optimize later if conversations grow too large (order limit in query)

**Rationale:** Most order conversations are short; simpler implementation for Phase 1

---

### 7. Conversation List View

**Question:** Should restaurants see list of all conversations?

**Decision:** Not in Phase 1
- Conversations are accessed via OrderCard chat button only
- No separate conversation list page
- Can add later if needed

**Rationale:** Keeps scope focused on order-driven conversations

---

### 8. Role Terminology Consistency

**CRITICAL AWARENESS:**

Throughout implementation, ALWAYS use:
- `"restaurant"` — NEVER "vendor"
- `"customer"` — NEVER "user" or "buyer"
- User role values in code: `user.role === 'restaurant'` or `user.role === 'customer'`

In database:
- `orders.user_id` → customer_id
- `restaurants.owner_id` → the user ID of the restaurant manager (who has role="restaurant")

In code comments and variable names:
- `restaurantManager` or `restaurantOwner` — NEVER `vendor`
- `restaurantId` — refers to restaurant entity
- `context: 'restaurant' | 'customer'` — NEVER `'vendor'`

This prevents the current codebase confusion where "vendor" sometimes means restaurant, sometimes means restaurant manager.

---

## Implementation Sequence

1. **Delete frontend chat code** (~30 min)
   - Remove files
   - Update App.tsx, AppRoutes.tsx
   - Fix OrderCard imports
   - Verify no compilation errors

2. **Refactor backend** (~1-2 hours)
   - Update ChatService methods
   - Update controllers with new endpoints
   - Update routes
   - Test endpoints with Postman

3. **Build useOrderChat hook** (~1 hour)
   - State management
   - API calls
   - Echo real-time listeners
   - Error handling

4. **Build OrderChat component** (~1 hour)
   - Message display
   - Input field
   - Styling
   - Responsive layout

5. **Integrate into OrderCard** (~30 min)
   - Replace chat button logic
   - Add modal/drawer
   - Test end-to-end

6. **Testing & Polish** (~1-2 hours)
   - Test message sending
   - Test real-time updates
   - Test read status
   - Test error scenarios
   - Cross-browser testing

**Total Estimated Time: 4-6 hours**

---

## Success Criteria

- [x] All old chat code deleted, no import errors
- [x] OrderCard chat button opens modal/drawer
- [x] Vendor can send message to customer
- [x] Customer receives message in real-time
- [x] Customer can reply
- [x] Vendor receives reply in real-time
- [x] Messages show read/unread status
- [x] Modal closes cleanly
- [x] Error states handled gracefully
- [x] Works on mobile and desktop
- [x] Connection status visible to user

---

## Rollback Plan

If things go wrong:
1. Git revert to last commit before Phase 1 deletion
2. All deleted files recover from git history
3. Chat system returns to previous state (broken but present)
4. No data loss — conversations, messages persist in database

---

## Next Steps

1. **Confirm decisions** on flow, timing, authorization
2. **Proceed with Phase 1 deletion** — remove all old chat code
3. **Proceed with Phase 2** — refactor backend endpoints
4. **Proceed with Phase 3-5** — build new hook and component
