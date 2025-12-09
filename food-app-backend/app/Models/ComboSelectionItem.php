<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ComboSelectionItem extends Model
{
    use HasFactory, HasUlids;

    protected $fillable = [
        'combo_selection_id',
        'dish_id',
        'options',
        'price'
    ];

    protected $casts = [
        'options' => 'array',
        'price' => 'integer',
    ];

    public function selection()
    {
        return $this->belongsTo(ComboSelection::class);
    }

    public function dish()
    {
        return $this->belongsTo(Dish::class);
    }
}
