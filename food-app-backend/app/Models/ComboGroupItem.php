<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ComboGroupItem extends Model
{
    /** @use HasFactory<\Database\Factories\ComboGroupItemFactory> */
    use HasFactory, HasUlids;

    protected $fillable = [
        'combo_group_id',
        'dish_id',
        'extra_price'
    ];

    protected $casts = [
        'extra_price' => 'integer',
    ];

    /**
     * Summary of group
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<ComboGroup, ComboGroupItem>
     */
    public function group(): BelongsTo
    {
        return $this->belongsTo(ComboGroup::class, 'combo_group_id');
    }

    /**
     * Alias for group relationship (for direct access)
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<ComboGroup, ComboGroupItem>
     */
    public function comboGroup(): BelongsTo
    {
        return $this->group();
    }

    /**
     * Summary of dish
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<Dish, ComboGroupItem>
     */
    public function dish(): BelongsTo
    {
        return $this->belongsTo(Dish::class);
    }
}
