<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ComboGroup extends Model
{
    /** @use HasFactory<\Database\Factories\ComboGroupFactory> */
    use HasFactory, HasUlids;

    protected $fillable = [
        'combo_id',
        'name',
        'allowed_min',
        'allowed_max'
    ];

    /**
     * The combo that this combo group belongs to
     * @return BelongsTo<Combo, ComboGroup>
     */
    public function combo(): BelongsTo
    {
        return $this->belongsTo(Combo::class);
    }

    /**
     * All of items this Combo group Has
     * @return HasMany<ComboGroupItem, ComboGroup>
     */
    public function items(): HasMany
    {
        return $this->hasMany(ComboGroupItem::class);
    }

    public function categoryHints(): BelongsToMany
    {
        return $this->belongsToMany(
            MenuCategory::class,
            'combo_group_category_hints',
            'combo_group_id',
            'category_id'
        );
    }

}
