<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    use HasFactory, HasUlid;

    protected $fillable = [
        'user_id',
        'reviewable_type',
        'reviewable_id',
        'rating',
        'comment',
    ];

    protected $casts = [
        'rating' => 'integer',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function reviewable()
    {
        return $this->morphTo('reviewable', 'reviewable_type', 'reviewable_id')->morphMap([
            'dish' => \App\Models\Dish::class,
            'restaurant' => \App\Models\Restaurant::class,
        ]);
    }
}
