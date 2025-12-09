<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Combo extends Model
{
    /** @use HasFactory<\Database\Factories\ComboFactory> */
    use HasFactory, HasUlids;

    protected $fillable = [
        'name',
        'description',
        'pricing_mode',
        'base_price'
    ];

    protected $casts = [
        'base_price' => 'integer',
    ];

    /**
     * Combo Groups 
     * @return HasMany<ComboGroup, Combo>
     */
    public function groups(): HasMany
    {
        return $this->hasMany(ComboGroup::class);
    }

    /**
     * Summary of selections
     * @return HasMany<ComboSelection, Combo>
     */
    public function selections(): HasMany
    {
        return $this->hasMany(ComboSelection::class);
    }

}
