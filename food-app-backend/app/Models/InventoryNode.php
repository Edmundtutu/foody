<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class InventoryNode extends Model
{
    use HasFactory, HasUlids, SoftDeletes;

    protected $fillable = [
        'restaurant_id',
        'category_id',
        'entity_type',
        'entity_id',
        'display_name',
        'x',
        'y',
        'color_code',
        'available',
        'metadata',
    ];

    protected $casts = [
        'x' => 'integer',
        'y' => 'integer',
        'available' => 'boolean',
        'metadata' => 'array',
    ];

    // Relationships
    public function restaurant()
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function category()
    {
        return $this->belongsTo(MenuCategory::class, 'category_id');
    }

    public function outgoingEdges()
    {
        return $this->hasMany(InventoryNodeEdge::class, 'source_node_id');
    }

    public function incomingEdges()
    {
        return $this->hasMany(InventoryNodeEdge::class, 'target_node_id');
    }
}
