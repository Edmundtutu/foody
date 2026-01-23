## Plan: Delivery & Courier Management Module Implementation

**TL;DR**: Implement backend schema (agents, logistics tables), Laravel APIs for agent/dispatch management, PWA UI extensions for vendor/customer flows, and integrate delivery-agent app with Firebase real-time tracking. Firebase handles all live location updates; backend handles order state and persistence.

---

### Phase 1: Backend Schema & Models

#### Step 1.1: Database Migrations

**Create migrations in order:**

1. **`add_order_type_to_orders_table`** - Add `order_type` column to existing orders table
   - Add `order_type` enum: `DINE_IN`, `TAKEAWAY`, `DELIVERY` (default: `DINE_IN`)
   - Add `delivery_address` JSON column (nullable)
   - Add `delivery_contact` string (nullable)

2. **`create_agents_table`** - Per schema.plan.md
   - Fields: `id` (ulid), `restaurant_id`, `nin`, `name`, `phone_number`, `fleet_kind`, `plate_number`, `photo`, `status`, `is_available`, `current_load`, timestamps, soft deletes
   - Indexes: `restaurant_id`, `status`, `is_available`

3. **`create_order_logistics_table`** - Per schema.plan.md
   - Fields: `id` (ulid), `order_id` (unique), `agent_id` (nullable), `pickup_address` (JSON), `delivery_address` (JSON), `delivery_status`, `assigned_at`, `picked_up_at`, `delivered_at`, timestamps
   - `delivery_status` enum: `PENDING`, `ASSIGNED`, `PICKED_UP`, `ON_THE_WAY`, `DELIVERED`
   - Indexes: `agent_id`, `delivery_status`

#### Step 1.2: Models & Relationships

| Model | File | Relationships |
|-------|------|---------------|
| `Agent` | `app/Models/Agent.php` | belongsTo `Restaurant`, hasMany `OrderLogistics` |
| `OrderLogistics` | `app/Models/OrderLogistics.php` | belongsTo `Order`, belongsTo `Agent` |
| Update `Restaurant` | Add `agents()` hasMany | |
| Update `Order` | Add `logistics()` hasOne, `order_type` cast | |

---

### Phase 2: Backend Services & APIs

#### Step 2.1: Agent Management Service

**File:** `app/Services/AgentService.php`

| Method | Purpose |
|--------|---------|
| `create(Restaurant, array $data)` | Register new agent |
| `update(Agent, array $data)` | Update agent details |
| `suspend(Agent)` | Set status = suspended, is_available = false |
| `activate(Agent)` | Set status = active |
| `toggleAvailability(Agent)` | Toggle is_available |
| `getForRestaurant(Restaurant)` | List agents with load stats |
| `getAvailable(Restaurant)` | Available agents sorted by current_load |

#### Step 2.2: Dispatch Service

**File:** `app/Services/DispatchService.php`

| Method | Purpose |
|--------|---------|
| `createLogistics(Order)` | Create logistics record for DELIVERY orders |
| `assignAgent(OrderLogistics, Agent)` | Assign agent, increment load, set assigned_at |
| `unassignAgent(OrderLogistics)` | Remove agent, decrement load |
| `updateDeliveryStatus(OrderLogistics, status)` | Transition status with validation |

**Status Transition Rules:**
```
PENDING → ASSIGNED (requires agent_id)
ASSIGNED → PICKED_UP
PICKED_UP → ON_THE_WAY
ON_THE_WAY → DELIVERED (auto-completes parent order)
```

#### Step 2.3: API Controllers & Routes

**New Controllers:**
- `AgentController` - CRUD for agents
- `DispatchController` - Assignment and status updates
- `DeliveryTrackingController` - Customer tracking endpoint

**Routes to add in api.php:**

```
Vendor (restaurant role):
  GET    /v1/restaurants/{id}/agents           → list agents
  POST   /v1/restaurants/{id}/agents           → create agent
  PUT    /v1/agents/{id}                       → update agent
  PATCH  /v1/agents/{id}/status                → activate/suspend
  PATCH  /v1/agents/{id}/availability          → toggle availability
  
  GET    /v1/restaurants/{id}/logistics        → list delivery orders
  POST   /v1/orders/{id}/logistics/assign      → assign agent
  
Agent (new auth guard or agent-linked user):
  GET    /v1/agent/orders                      → assigned orders
  PATCH  /v1/logistics/{id}/status             → update delivery status
  
Customer:
  GET    /v1/orders/{id}/tracking              → logistics + Firebase path
  POST   /v1/orders/{id}/confirm-delivery      → customer confirms receipt
```

#### Step 2.4: Policies

| Policy | Rules |
|--------|-------|
| `AgentPolicy` | Restaurant owner can manage their agents |
| Update `OrderPolicy` | Add `assignDelivery`, `updateDeliveryStatus` |

---

### Phase 3: Firebase Integration Strategy

**Architecture:** Laravel backend is source of truth for order/logistics state. Firebase Realtime DB handles live GPS tracking only.

#### Step 3.1: Firebase Paths (align with existing firebaseService.ts)

| Path | Writer | Readers | Data |
|------|--------|---------|------|
| `/liveLocations/{orderId}` | Delivery Agent | PWA, Backend webhook | `{riderId, lat, lng, speed, bearing, ts}` |
| `/orderStatus/{orderId}` | Delivery Agent | PWA | `{status, updatedAt, riderId}` |
| `/riderStatus/{agentId}` | Delivery Agent | PWA (vendor) | `{online, lastSeen}` |

#### Step 3.2: Backend → Firebase Sync (optional, for audit)

- Add Firebase Admin SDK to Laravel
- On `logistics.delivery_status` change, mirror to `/orderStatus/{orderId}`
- Store location snapshots periodically for delivery history

#### Step 3.3: PWA Firebase Listener

- Add Firebase JS SDK to frontend
- Subscribe to `/liveLocations/{orderId}` for live map updates
- Subscribe to `/orderStatus/{orderId}` for status badge updates
- Unsubscribe on component unmount

---

### Phase 4: Frontend PWA Changes

#### Step 4.1: Types Extension

**Update orders.ts:**

```typescript
// Add to Order interface
order_type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
logistics?: OrderLogistics;

// New interfaces
interface OrderLogistics {
  id: string;
  order_id: string;
  agent_id: string | null;
  pickup_address: AddressData;
  delivery_address: AddressData;
  delivery_status: DeliveryStatus;
  assigned_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  agent?: Agent;
}

type DeliveryStatus = 'PENDING' | 'ASSIGNED' | 'PICKED_UP' | 'ON_THE_WAY' | 'DELIVERED';

interface Agent {
  id: string;
  name: string;
  phone_number: string;
  fleet_kind: string;
  photo: string | null;
  is_available: boolean;
  current_load: number;
}
```

#### Step 4.2: New Services

| Service | Methods |
|---------|---------|
| `agentService.ts` | `getAgents`, `createAgent`, `updateAgent`, `toggleStatus`, `toggleAvailability` |
| `dispatchService.ts` | `getDeliveryOrders`, `assignAgent`, `unassignAgent` |
| `trackingService.ts` | `getTrackingInfo`, `confirmDelivery`, Firebase subscriptions |

#### Step 4.3: Shared OrderDetails Page

**File:** `src/pages/shared/OrderDetails.tsx`

Per pwa.plan.md - single page with role-based rendering:

| Section | Vendor View | Customer View |
|---------|-------------|---------------|
| Order Info | Full details + edit notes | Full details |
| Items | All items + prices | All items + prices |
| Logistics | Assign agent dropdown, status controls | Delivery status timeline |
| Tracking Map | Live map + agent location | Live map + agent location |
| Actions | Reassign, cancel delivery | Confirm delivery, contact agent |

#### Step 4.4: Vendor Pages

| Page | Purpose |
|------|---------|
| `pages/vendor/agents/AgentList.tsx` | List agents with status/load chips |
| `pages/vendor/agents/AgentForm.tsx` | Create/edit agent form |
| `pages/vendor/delivery/DeliveryDashboard.tsx` | Unassigned orders, dispatch queue |

#### Step 4.5: Customer Flow Changes

| Component | Change |
|-----------|--------|
| Checkout flow | Add order type selector; show address form when DELIVERY |
| Order confirmation | Show "Track Order" button for DELIVERY orders |
| `pages/customer/TrackOrder.tsx` | New page with map + status timeline |

#### Step 4.6: Map Component

**File:** DeliveryMap.tsx

- Use Google Maps JS API (key already in frontend env)
- Props: `orderId`, `pickupLocation`, `dropoffLocation`
- Subscribe to Firebase `/liveLocations/{orderId}`
- Render: pickup marker, dropoff marker, courier marker (animated), polyline

---

### Phase 5: Delivery Agent App Integration

#### Step 5.1: Connect to Backend API

**Update orderService.ts:**

| Current | Change To |
|---------|-----------|
| Mock orders from `mockOrders.ts` | Fetch from `GET /v1/agent/orders` |
| Local status updates | POST to `PATCH /v1/logistics/{id}/status` then update Firebase |

**Add new service:** `apiService.ts`
- Base URL from env
- Auth token storage (agent login)
- Methods: `login`, `getAssignedOrders`, `updateDeliveryStatus`, `acceptOrder`

#### Step 5.2: Agent Authentication

Options (pick one):
1. **Agent as User** - Agents get user accounts with `role = 'agent'`
2. **Separate Agent Auth** - Agent model with own auth (phone + PIN)

Recommendation: Option 1 is simpler - create user for each agent, link via `agent.user_id`

#### Step 5.3: Sync Flow

```
Agent App                    Backend                     Firebase
    |                           |                           |
    |-- GET /agent/orders ----->|                           |
    |<-- assigned orders -------|                           |
    |                           |                           |
    |-- PATCH /logistics/status ->|                         |
    |<-- success ---------------|                           |
    |-- updateOrderStatus() ----|-------------------------->|
    |                           |                           |
    |-- (GPS loop) -------------|-------------------------->|
    |   updateLiveLocation()    |     /liveLocations/{id}   |
```

#### Step 5.4: Update Types

**Modify delivery.ts:**
- Add `logistics_id` to Order type
- Add `agent_id` (self reference for multi-restaurant support later)
- Ensure status enum matches backend: `PENDING | ASSIGNED | PICKED_UP | ON_THE_WAY | DELIVERED`

---

### Phase 6: Execution Order

| # | Task | Depends On |
|---|------|------------|
| 1 | Backend migrations | - |
| 2 | Backend models + relationships | 1 |
| 3 | Backend AgentService + AgentController | 2 |
| 4 | Backend DispatchService + DispatchController | 2 |
| 5 | Backend policies + route registration | 3, 4 |
| 6 | Frontend types + agentService | 5 |
| 7 | Frontend vendor agent management pages | 6 |
| 8 | Frontend dispatchService + delivery dashboard | 6 |
| 9 | Shared OrderDetails page | 6 |
| 10 | Frontend Firebase integration (trackingService) | 9 |
| 11 | Customer checkout flow + TrackOrder page | 10 |
| 12 | Delivery agent API service | 5 |
| 13 | Delivery agent auth flow | 12 |
| 14 | Delivery agent order sync | 13 |
| 15 | End-to-end testing | All |

---

### Further Considerations

1. **Agent login method?** Phone + OTP / Phone + PIN / Full email auth?
2. **Order acceptance flow?** Auto-assign or agent accepts/rejects?
3. **Load balancing?** Manual assignment only or suggest least-loaded agent?
4. **Delivery fee calculation?** Fixed, distance-based, or restaurant-defined?