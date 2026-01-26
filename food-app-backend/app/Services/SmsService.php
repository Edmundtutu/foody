<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Log;

class SmsService
{
    protected Client $client;
    protected string $webhookUrl;

    public function __construct()
    {
        $this->client = new Client([
            'timeout' => 10,
        ]);
        $this->webhookUrl = config('services.sms.webhook_url', '');
    }

    /**
     * Send OTP via SMS webhook.
     */
    public function sendOtp(string $phoneNumber, string $code): bool
    {
        if (empty($this->webhookUrl)) {
            Log::warning('SMS webhook URL not configured');
            return false;
        }

        try {
            $response = $this->client->post($this->webhookUrl, [
                'json' => [
                    'phone' => $phoneNumber,
                    'message' => "Your login code is {$code}",
                ],
            ]);

            return $response->getStatusCode() >= 200 && $response->getStatusCode() < 300;
        } catch (GuzzleException $e) {
            Log::error('Failed to send SMS: ' . $e->getMessage());
            return false;
        }
    }
}
