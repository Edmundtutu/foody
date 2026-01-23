<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderLogistics extends Model
{
    use HasFactory, HasUlids;

    protected $table = 'order_logistics';

    public const STATUS_PENDING = 'PENDING';
    public const STATUS_ASSIGNED = 'ASSIGNED';
    public const STATUS_PICKED_UP = 'PICKED_UP';
    public const STATUS_ON_THE_WAY = 'ON_THE_WAY';
    public const STATUS_DELIVERED = 'DELIVERED';

    public const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_ASSIGNED,
        self::STATUS_PICKED_UP,
        self::STATUS_ON_THE_WAY,
        self::STATUS_DELIVERED,
    ];

    /**
     * Valid status transitions: current => [allowed next statuses]
     */
    public const STATUS_TRANSITIONS = [
        self::STATUS_PENDING => [self::STATUS_ASSIGNED],
        self::STATUS_ASSIGNED => [self::STATUS_PICKED_UP, self::STATUS_PENDING], // Can unassign back to pending
        self::STATUS_PICKED_UP => [self::STATUS_ON_THE_WAY],
        self::STATUS_ON_THE_WAY => [self::STATUS_DELIVERED],
        self::STATUS_DELIVERED => [], // Terminal state
    ];

    protected $fillable = [
        'order_id',
        'agent_id',
        'pickup_address',
        'delivery_address',
        'delivery_status',
        'assigned_at',
        'picked_up_at',
        'delivered_at',
    ];

    protected $casts = [
        'pickup_address' => 'array',
        'delivery_address' => 'array',
        'assigned_at' => 'datetime',
        'picked_up_at' => 'datetime',
        'delivered_at' => 'datetime',
    ];

    // Relationships

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }

    // Scopes

    public function scopePending($query)
    {
        return $query->where('delivery_status', self::STATUS_PENDING);
    }

    public function scopeAssigned($query)
    {
        return $query->where('delivery_status', self::STATUS_ASSIGNED);
    }

    public function scopeInProgress($query)
    {
        return $query->whereIn('delivery_status', [
            self::STATUS_ASSIGNED,
            self::STATUS_PICKED_UP,
            self::STATUS_ON_THE_WAY,
        ]);
    }

    public function scopeDelivered($query)
    {
        return $query->where('delivery_status', self::STATUS_DELIVERED);
    }

    public function scopeForAgent($query, string $agentId)
    {
        return $query->where('agent_id', $agentId);
    }

    // Helpers

    public function canTransitionTo(string $newStatus): bool
    {
        $allowedTransitions = self::STATUS_TRANSITIONS[$this->delivery_status] ?? [];
        return in_array($newStatus, $allowedTransitions, true);
    }

    public function isDelivered(): bool
    {
        return $this->delivery_status === self::STATUS_DELIVERED;
    }

    public function isAssigned(): bool
    {
        return $this->agent_id !== null && $this->delivery_status !== self::STATUS_PENDING;
    }

    public function isPending(): bool
    {
        return $this->delivery_status === self::STATUS_PENDING;
    }

    /**
     * Get Firebase path for live location tracking
     */
    public function getFirebaseLocationPath(): string
    {
        return "liveLocations/{$this->order_id}";
    }

    /**
     * Get Firebase path for status updates
     */
    public function getFirebaseStatusPath(): string
    {
        return "orderStatus/{$this->order_id}";
    }
}
