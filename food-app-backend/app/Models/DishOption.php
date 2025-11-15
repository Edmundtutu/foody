<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class DishOption extends Model
{
    use HasFactory, HasUlids, SoftDeletes;

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
