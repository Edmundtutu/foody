<?php

namespace App\Policies;

use App\Models\Agent;
use App\Models\Order;
use App\Models\OrderLogistics;
use App\Models\User;

class OrderLogisticsPolicy
{
    /**
     * Determine if the user can mark order as picked up.
     * Only vendor can mark as PICKED_UP when order is READY.
     */
    public function markAsPickedUp($user, OrderLogistics $logistics): bool
    {
        // Only vendor can mark as picked up
        if ($user instanceof User && $user->role === 'restaurant') {
            $order = $logistics->order;
            return $user->id === $order->restaurant->owner_id 
                && $order->status === Order::STATUS_READY
                && $logistics->delivery_status === OrderLogistics::STATUS_ASSIGNED;
        }
        return false;
    }

    /**
     * Determine if the user can update delivery status.
     * 
     * - Vendor can update any status (for flexibility/override)
     * - Agent can only update from PICKED_UP onwards (ON_THE_WAY, DELIVERED)
     */
    public function updateDeliveryStatus($user, OrderLogistics $logistics, string $newStatus): bool
    {
        // Vendor can update any status
        if ($user instanceof User && $user->role === 'restaurant') {
            $order = $logistics->order;
            return $user->id === $order->restaurant->owner_id;
        }

        // Agent can only update from PICKED_UP onwards
        if ($user instanceof Agent) {
            // Must be assigned to this agent
            if ($logistics->agent_id !== $user->id) {
                return false;
            }
            
            // Agent can transition: PICKED_UP → ON_THE_WAY → DELIVERED
            // Cannot transition ASSIGNED → PICKED_UP (vendor must do that)
            $allowedAgentTransitions = [
                OrderLogistics::STATUS_ON_THE_WAY,
                OrderLogistics::STATUS_DELIVERED,
            ];
            
            // Check if current status allows agent to transition to new status
            $currentStatus = $logistics->delivery_status;
            
            // Agent can only transition from PICKED_UP or ON_THE_WAY
            if ($currentStatus === OrderLogistics::STATUS_PICKED_UP) {
                return in_array($newStatus, $allowedAgentTransitions, true);
            }
            
            // Agent can transition ON_THE_WAY → DELIVERED
            if ($currentStatus === OrderLogistics::STATUS_ON_THE_WAY) {
                return $newStatus === OrderLogistics::STATUS_DELIVERED;
            }
            
            return false;
        }

        return false;
    }
}
