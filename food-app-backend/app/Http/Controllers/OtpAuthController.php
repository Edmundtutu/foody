<?php

namespace App\Http\Controllers;
use App\Models\Agent;
use App\Services\OtpService;
use App\Services\SmsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Request;
use App\Http\Requests\Auth\VerifyOtpRequest;
use App\Http\Requests\Auth\RequestOtpRequest;

class OtpAuthController extends Controller
{
    public function __construct(
        protected OtpService $otpService,
        protected SmsService $smsService
    ) {}

    /**
     * Request an OTP code.
     */
    public function requestOtp(RequestOtpRequest $request): JsonResponse
    {
        $agent = Agent::where('phone_number', $request->phone_number)->first();

        if (!$agent) {
            return response()->json([
                'message' => 'Agent not found with this phone number',
            ], 404);
        }

        if ($agent->status === 'suspended') {
            return response()->json([
                'message' => 'Your account has been suspended',
            ], 403);
        }

        // Invalidate any existing active OTPs
        $this->otpService->invalidateActiveOtps($agent);

        // Generate and create new OTP
        $plainCode = $this->otpService->generateCode();
        $result = $this->otpService->createOtp($agent, $plainCode);

        // Send OTP via SMS
        $smsSent = $this->smsService->sendOtp($agent->phone_number, $plainCode);

        return response()->json([
            'message' => 'OTP sent successfully',
            'sms_sent' => $smsSent,
        ]);
    }

    /**
     * Verify an OTP code and issue a token.
     */
    public function verifyOtp(VerifyOtpRequest $request): JsonResponse
    {
        $agent = Agent::where('phone_number', $request->phone_number)->first();

        if (!$agent) {
            return response()->json([
                'message' => 'Invalid credentials',
            ], 401);
        }

        if ($agent->status === 'suspended') {
            return response()->json([
                'message' => 'Your account has been suspended',
            ], 403);
        }

        $otp = $this->otpService->verifyOtp($agent, $request->otp_code);

        if (!$otp) {
            return response()->json([
                'message' => 'Invalid or expired OTP',
            ], 401);
        }

        // Mark OTP as used
        $otp->markAsUsed();

        // Create Sanctum token
        $token = $agent->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'token' => $token,
            'agent' => $agent,
        ]);
    }

    /**
     * Logout and revoke the current token.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }
}
