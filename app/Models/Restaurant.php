<?php

namespace App\Models;

use App\Traits\HasUlid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Restaurant extends Model
{
    use HasFactory, HasUlid, SoftDeletes;

    protected $fillable = [
        'owner_id',
        'name',
        'description',
        'phone',
        'email',
        'address',
        'latitude',
        'longitude',
        'verification_status',
        'config',
    ];

    protected $casts = [
        'config' => 'array',
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
    ];

    // Relationships
    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function categories()
    {
        return $this->hasMany(MenuCategory::class);
    }

    public function dishes()
    {
        return $this->hasMany(Dish::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function inventoryNodes()
    {
        return $this->hasMany(InventoryNode::class);
    }

    public function inventoryNodeEdges()
    {
        return $this->hasMany(InventoryNodeEdge::class);
    }

    public function reviews()
    {
        return $this->morphMany(Review::class, 'reviewable');
    }

    // Scopes
    public function scopeVerified($query)
    {
        return $query->where('verification_status', 'verified');
    }
}
