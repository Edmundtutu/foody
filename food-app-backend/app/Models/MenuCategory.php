<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class MenuCategory extends Model
{
    use HasFactory, HasUlids, SoftDeletes;

    protected $fillable = [
        'restaurant_id',
        'name',
        'description',
        'display_order',
        'color_code',
    ];

    protected $casts = [
        'display_order' => 'integer',
    ];

    // Relationships
    public function restaurant()
    {
        return $this->belongsTo(Restaurant::class);
    }

    public function dishes()
    {
        return $this->hasMany(Dish::class, 'category_id');
    }

    public function comboGroupHints()
    {
        return $this->belongsToMany(ComboGroup::class, 'combo_group_category_hints');
    }
}
