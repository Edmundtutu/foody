# Backend Changes Projection for the Delivery & Courier Management Module

This document outlines the planned backend extensions required to support courier registration, order dispatching, and delivery tracking.

---

## 1. Database Migrations & Schema Design

### 1.1 Agents Table (`agents`)

Stores courier / delivery personnel managed by restaurants.

**Fields:**

* `id`
* `restaurant_id` (FK → restaurants.id)
* `nin` (National ID Number)
* `name`
* `phone_number`
* `fleet_kind` (string: vehicle, motorbike, bicycle, foot — not ENUM for flexibility)
* `plate_number` (nullable, only if fleet_kind = vehicle)
* `photo` (path / url)
* `status` (active, suspended, inactive)
* `is_available` (boolean)
* `current_load` (int)
* timestamps

**Notes:**

* Each agent belongs to exactly one restaurant.
* Agents are managed by users with restaurant role.

---

### 1.2 Order Logistics Table (`order_logistics`)

Handles delivery execution for orders that require courier service.

**Fields:**

* `id`
* `order_id` (FK → orders.id, unique)
* `agent_id` (FK → agents.id, nullable until assigned)
* `pickup_address` (JSON – restaurant or custom pickup point)
* `delivery_address` (JSON – customer defined)
* `delivery_status`
  (`PENDING` | `ASSIGNED` | `PICKED_UP` | `ON_THE_WAY` | `DELIVERED`)
* `assigned_at`
* `picked_up_at`
* `delivered_at`
* timestamps

**Notes:**

* One order has at most one logistics record.
* When `delivery_status = DELIVERED`, the parent `orders.status` is updated to `COMPLETED`.

---
### 1.3 Refactor Orders table to support service/fulfillment modes

To ensure that the order knows when a logistics should be setup. 

**Modify**

*`add_order_type_on_orders_table` Migration
*`order_type` (`DINE_IN`| `TAKEAWAY` | `DELIVERY`)

--

## 2. Core Backend Features

### 2.1 Agent (Courier) Management

* Register new agents
* Update agent details
* Suspend / activate agents
* View agent availability and workload

### 2.2 Order Dispatch & Delivery Management

* Create logistics record for delivery orders
* Assign orders to available agents
* Agent order confirmation (accept / reject)
* Update delivery status flow:

  * ASSIGNED → PICKED_UP → ON_THE_WAY → DELIVERED
* Auto-complete order when delivery is marked as DELIVERED

---

## 3. Relationships & Access Control

### Relationships

* A **Restaurant has many Agents**
* An **Order may have one OrderLogistics record**
* An **Agent can handle many OrderLogistics records (over time)**

### Access Rules

* Only restaurant-role users can:

  * Register and manage agents
  * Assign delivery orders to agents

* Agents can:

  * View assigned orders
  * Update delivery status

---

