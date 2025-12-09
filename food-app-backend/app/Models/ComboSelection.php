<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ComboSelection extends Model
{
    /**
     * Ux Model for featuring User selections to enhance recommendations later on
     */
    use HasFactory, HasUlids;

    protected $fillable = [
        'combo_id',
        'user_id',
        'total_price'
    ];

    protected $casts = [
        'total_price' => 'integer',
    ];

    /**
     * Combo to which the selection was made of 
     * @return BelongsTo<Combo, ComboSelection>
     */
    public function combo():BelongsTo
    {
        return $this->belongsTo(Combo::class);
    }

    /**
     * User who selected the combo
     * @return BelongsTo<User, ComboSelection>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Summary of items in this Combo selection.
     * @return HasMany<ComboSelectionItem, ComboSelection>
     */
    public function items():HasMany
    {
        return $this->hasMany(ComboSelectionItem::class);
    }
}
