<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\Pivot;

class ComboGroupCategoryHint extends Pivot
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'combo_group_id',
        'category_id'
    ];

    public $incrementing = false;

    public function group()
    {
        return $this->belongsTo(ComboGroup::class);
    }

    public function category()
    {
        return $this->belongsTo(MenuCategory::class);
    }
}
