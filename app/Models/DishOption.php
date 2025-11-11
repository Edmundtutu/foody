<?php

namespace App\Models;

use App\Traits\HasUlid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class DishOption extends Model
{
    use HasUlid, SoftDeletes;

    protected $fillable = [
        'dish_id',
        'name',
        'extra_cost',
        'required',
    ];

    protected $casts = [
        'extra_cost' => 'integer',
        'required' => 'boolean',
    ];

    // Relationships
    public function dish()
    {
        return $this->belongsTo(Dish::class);
    }
}

