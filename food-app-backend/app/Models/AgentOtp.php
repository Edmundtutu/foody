<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AgentOtp extends Model
{
    use HasUlids;
    
    protected $table = 'agent_otps';

    protected $fillable = [
        'agent_id',
        'code',
        'expires_at',
        'type',
        'used_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'used_at' => 'datetime',
    ];

    // Relationships
    /**
     *  Get the agent that owns the OTP.
     */
    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class);
    }

    /**
     * Check if the otp is valid (not expired and not used)
     */
    public function isValid():bool
    {
        return $this->expires_at->isFuture() && is_null($this->used_at);
    }

    /**
     * Mark the OTP as used
     *  */
    public function markAsUsed(): void
    {
        $this->used_at = now();
        $this->save();
    }

}
