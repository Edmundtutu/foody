# Changes Projection to accomodate the Delivery & Courier Management Module

**Path:** `./food-app-frontend`
**Feature:** Delivery & Courier Management Module

This document outlines the required UI extensions and component changes to support courier management, order dispatching, and real-time delivery tracking in the PWA.

---

## 1. Core UI Functionalities

### 1.1 Vendor (Restaurant) Interface

#### 1.1.1 Courier Management UI

Features for restaurant users to manage delivery agents:

* Register new delivery agents

  * Registration forms
  * Identity and fleet details input
  * Confirmation feedback

* View and manage agents

  * List all registered agents
  * View agent profiles and status
  * Update agent details
  * Activate / suspend agents

* Availability & workload monitoring

  * Display agent availability state
  * Show number of active deliveries per agent

---

#### 1.1.2 Order Dispatch & Delivery Management UI

Features for managing delivery execution:

* Assign delivery orders to agents

* View order dispatch status (unassigned, assigned, in transit, delivered)

* Control and monitor order lifecycle transitions

* Real-time delivery tracking

  * Live map showing courier navigation path
  * Current courier position and ETA
  * Order delivery status updates

---

### 1.2 Customer Interface

#### 1.2.1 Ordering Flow Enhancements

* Extend ordering flow to support:

  * `DINE_IN`
  * `TAKEAWAY`
  * `DELIVERY`

* When `DELIVERY` is selected:

  * Capture delivery address details
  * Allow optional live location sharing
  * Validate delivery contact information

---

#### 1.2.2 Delivery Tracking & Confirmation

* “Track My Order” feature:

  * Live map showing courier in transit
  * Current delivery status (assigned, on the way, near you)

* Delivery confirmation:

  * Customer confirms order receipt
  * Triggers final order completion on backend

---


### Note:
>There is already a component (OrderCard.tsx) in the current ui implemetation that displays a breif over view about an order record... Although this component is fine enough at the current state, it doesnt provide the full order details and definately doesnt contend to the newer Order Ui changes towards the Delivery logistics. This OrderCard component is to be left for overview display capabilities whiles we shall make an implementation of a shared OrderDetails.tsx page which conditionally displays All the Order details respectively according to the role (vendor|customer) with every capable executional power up.

> #### 1. WE are NOT to duplicate logic in vendor & customer pages

`OrderDetails.tsx` should be:

* One page
* One data source
* Conditional rendering by role

That keeps:

* Fewer bugs
* Easier maintenance
* Consistent behavior

---


