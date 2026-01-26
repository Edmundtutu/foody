<?php

namespace App\Services;

use App\Models\Agent;
use App\Models\AgentOtp;
use Illuminate\Support\Facades\Hash;

class OtpService
{
    /**
     * Generate a 6-digit OTP code.
     */
    public function generateCode(): string
    {
        return str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    }

    /**
     * Create an OTP for the agent with a hashed code.
     * 
     * @return array ['otp' => AgentOtp, 'plainCode' => string]
     */
    public function createOtp(Agent $agent, string $plainCode): array
    {
        $otp = AgentOtp::create([
            'agent_id' => $agent->id,
            'code' => Hash::make($plainCode),
            'expires_at' => now()->addMinutes(5),
            'type' => 'login',
        ]);

        return [
            'otp' => $otp,
            'plainCode' => $plainCode,
        ];
    }

    /**
     * Verify an OTP code for an agent.
     */
    public function verifyOtp(Agent $agent, string $code): ?AgentOtp
    {
        $otp = $agent->otps()
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->latest()
            ->first();

        if (!$otp || !Hash::check($code, $otp->code)) {
            return null;
        }

        return $otp;
    }

    /**
     * Invalidate all active OTPs for an agent.
     */
    public function invalidateActiveOtps(Agent $agent): void
    {
        $agent->otps()
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->update(['used_at' => now()]);
    }
}
