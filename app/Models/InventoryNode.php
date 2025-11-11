<?php

namespace App\Models;

use App\Traits\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class InventoryNode extends Model
{
    use HasUlid, SoftDeletes;

    protected $fillable = [
        'restaurant_id',
        'entity_type',
        'entity_id',
        'display_name',
        'x',
        'y',
        'color_code',
        'metadata',
    ];

    protected $casts = [
        'x' => 'integer',
        'y' => 'integer',
        'metadata' => 'array',
    ];

    // Relationships
    public function restaurant()
    {
        return $this->belongsTo(Restaurant::class);
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
