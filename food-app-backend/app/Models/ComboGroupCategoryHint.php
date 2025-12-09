<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ComboGroupCategoryHint extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'combo_group_id',
        'category_id'
    ];

    public function group()
    {
        return $this->belongsTo(ComboGroup::class);
    }

    public function category()
    {
        return $this->belongsTo(MenuCategory::class);
    }
}
