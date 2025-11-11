<?php

namespace App\Traits;

trait ApiResponseTrait
{
    protected function success($data = null, $message = 'Success', $status = 200)
    {
        return response()->json([
            'status' => 'success',
            'message' => $message,
            'data' => $data
        ], $status);
    }

    protected function error($message = 'Error', $status = 400)
    {
        return response()->json([
            'status' => 'error',
            'message' => $message
        ], $status);
    }
}
