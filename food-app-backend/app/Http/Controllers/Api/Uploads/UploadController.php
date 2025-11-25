<?php

namespace App\Http\Controllers\Api\Uploads;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    use ApiResponseTrait;

    /**
     * Upload dish images
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function uploadDishImages(Request $request)
    {
        $request->validate([
            'images' => 'required|array|min:1|max:8',
            'images.*' => 'required|image|mimes:jpeg,png,webp|max:5120', // 5MB max
        ]);

        $uploadedFiles = [];

        foreach ($request->file('images') as $file) {
            // Generate unique filename
            $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
            
            // Store in public disk under dishes directory
            $path = $file->storeAs('dishes', $filename, 'public');
            
            // Get the public URL - ensure it's absolute using APP_URL
            // This ensures URLs are like: http://localhost:8000/storage/dishes/... or https://domain.com/storage/dishes/...
            $baseUrl = rtrim(config('app.url'), '/');
            $url = $baseUrl . '/storage/' . $path;

            $uploadedFiles[] = [
                'url' => $url,
                'path' => $path,
                'name' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
            ];
        }

        return $this->success($uploadedFiles, 'Images uploaded successfully', 201);
    }
}

