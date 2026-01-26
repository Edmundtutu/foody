<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Agent extends Model
{
    use HasFactory, HasUlids, SoftDeletes, Notifiable, HasApiTokens;

    public const STATUS_PENDING = 'PENDING';
    public const STATUS_ACTIVE = 'ACTIVE';
    public const STATUS_SUSPENDED = 'SUSPENDED';

    public const FLEET_BICYCLE = 'BICYCLE';
    public const FLEET_MOTORCYCLE = 'MOTORCYCLE';
    public const FLEET_CAR = 'CAR';
    public const FLEET_VAN = 'VAN';
    public const FLEET_ON_FOOT = 'ON_FOOT';

    protected $fillable = [
        'restaurant_id',
        'user_id',
        'nin',
        'name',
        'phone_number',
        'fleet_kind',
        'plate_number',
        'photo',
        'status',
        'is_available',
        'current_load',
    ];

    protected $casts = [
        'is_available' => 'boolean',
        'current_load' => 'integer',
    ];

    // Relationships

    public function otps(): HasMany
    {
        return $this->hasMany(AgentOtp::class);
    }
    public function restaurant(): BelongsTo
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function logistics(): HasMany
    {
        return $this->hasMany(OrderLogistics::class);
    }

    public function activeLogistics(): HasMany
    {
        return $this->logistics()->whereNotIn('delivery_status', ['DELIVERED']);
    }

    // Scopes

    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    public function scopeAvailable($query)
    {
        return $query->where('is_available', true)
            ->where('status', self::STATUS_ACTIVE);
    }

    public function scopeForRestaurant($query, string $restaurantId)
    {
        return $query->where('restaurant_id', $restaurantId);
    }

    // Helpers

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function isAvailable(): bool
    {
        return $this->is_available && $this->isActive();
    }

    public function canAcceptDelivery(int $maxLoad = 3): bool
    {
        return $this->isAvailable() && $this->current_load < $maxLoad;
    }

    public function incrementLoad(): void
    {
        $this->increment('current_load');
    }

    public function decrementLoad(): void
    {
        if ($this->current_load > 0) {
            $this->decrement('current_load');
        }
    }
}
