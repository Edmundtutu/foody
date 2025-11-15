<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryNodeEdge extends Model
{
    use HasFactory, HasUlid;

    protected $fillable = [
        'restaurant_id',
        'source_node_id',
        'target_node_id',
        'label',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    // Relationships
    public function restaurant()
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function sourceNode()
    {
        return $this->belongsTo(InventoryNode::class, 'source_node_id');
    }

    public function targetNode()
    {
        return $this->belongsTo(InventoryNode::class, 'target_node_id');
    }
}
