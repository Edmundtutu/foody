<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use HasFactory, HasUlids, SoftDeletes;

    // Order statuses
    public const STATUS_PENDING = 'pending';
    public const STATUS_CONFIRMED = 'confirmed';
    public const STATUS_PREPARING = 'preparing';
    public const STATUS_READY = 'ready';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';

    public const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_CONFIRMED,
        self::STATUS_PREPARING,
        self::STATUS_READY,
        self::STATUS_COMPLETED,
        self::STATUS_CANCELLED,
    ];

    /**
     * Valid status transitions: current => [allowed next statuses]
     */
    public const STATUS_TRANSITIONS = [
        self::STATUS_PENDING => [self::STATUS_CONFIRMED, self::STATUS_CANCELLED],
        self::STATUS_CONFIRMED => [self::STATUS_PREPARING, self::STATUS_CANCELLED],
        self::STATUS_PREPARING => [self::STATUS_READY, self::STATUS_CANCELLED],
        self::STATUS_READY => [self::STATUS_COMPLETED, self::STATUS_CANCELLED], // For non-delivery orders
        self::STATUS_COMPLETED => [], // Terminal state
        self::STATUS_CANCELLED => [], // Terminal state
    ];

    // Order types (fulfillment modes)
    public const TYPE_DINE_IN = 'DINE_IN';
    public const TYPE_TAKEAWAY = 'TAKEAWAY';
    public const TYPE_DELIVERY = 'DELIVERY';

    protected $fillable = [
        'user_id',
        'restaurant_id',
        'total',
        'status',
        'order_type',
        'delivery_address',
        'delivery_contact',
        'notes',
    ];

    protected $casts = [
        'total' => 'integer',
        'delivery_address' => 'array',
    ];

    // Relationships

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function conversation(): HasOne
    {
        return $this->hasOne(Conversation::class);
    }

    public function logistics(): HasOne
    {
        return $this->hasOne(OrderLogistics::class);
    }

    // Scopes

    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    public function scopeDelivery($query)
    {
        return $query->where('order_type', self::TYPE_DELIVERY);
    }

    public function scopeDineIn($query)
    {
        return $query->where('order_type', self::TYPE_DINE_IN);
    }

    public function scopeTakeaway($query)
    {
        return $query->where('order_type', self::TYPE_TAKEAWAY);
    }

    // Helpers

    public function isDelivery(): bool
    {
        return $this->order_type === self::TYPE_DELIVERY;
    }

    public function requiresLogistics(): bool
    {
        return $this->isDelivery();
    }

    public function hasLogistics(): bool
    {
        return $this->logistics !== null;
    }

    public function getDeliveryStatus(): ?string
    {
        return $this->logistics?->delivery_status;
    }

    /**
     * Check if order can transition to a new status.
     */
    public function canTransitionTo(string $newStatus): bool
    {
        if (!in_array($newStatus, self::STATUSES, true)) {
            return false;
        }

        // Terminal states cannot be changed
        if ($this->status === self::STATUS_COMPLETED || $this->status === self::STATUS_CANCELLED) {
            return false;
        }

        $allowedTransitions = self::STATUS_TRANSITIONS[$this->status] ?? [];
        return in_array($newStatus, $allowedTransitions, true);
    }

    /**
     * Check if order is in a terminal state (cannot be changed).
     */
    public function isTerminal(): bool
    {
        return $this->status === self::STATUS_COMPLETED || $this->status === self::STATUS_CANCELLED;
    }

    /**
     * Check if order can be cancelled.
     */
    public function canBeCancelled(): bool
    {
        return !$this->isTerminal() && $this->canTransitionTo(self::STATUS_CANCELLED);
    }

    /**
     * Check if order can be manually completed (non-delivery orders only).
     * Delivery orders are auto-completed when delivery status is DELIVERED.
     */
    public function canBeManuallyCompleted(): bool
    {
        // Only non-delivery orders at READY status can be manually completed
        // Delivery orders are completed automatically via DispatchService::completeDelivery()
        return !$this->isTerminal()
            && $this->status === self::STATUS_READY
            && $this->order_type !== self::TYPE_DELIVERY
            && $this->canTransitionTo(self::STATUS_COMPLETED);
    }
}
