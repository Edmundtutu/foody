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
}
