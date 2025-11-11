<?php

namespace App\Http\Controllers\Api\Reviews;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReviewRequest;
use App\Http\Resources\ReviewResource;
use App\Services\ReviewService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    use ApiResponseTrait;

    protected $reviewService;

    public function __construct(ReviewService $reviewService)
    {
        $this->reviewService = $reviewService;
    }

    public function index(Request $request)
    {
        $type = $request->query('reviewable_type');
        $id = $request->query('reviewable_id');

        if (! $type || ! $id) {
            return $this->error('reviewable_type and reviewable_id are required', 400);
        }

        if ($type === 'restaurant') {
            $reviews = $this->reviewService->getRestaurantReviews($id);
        } elseif ($type === 'dish') {
            $reviews = $this->reviewService->getDishReviews($id);
        } else {
            return $this->error('Invalid reviewable_type', 400);
        }

        return $this->success(ReviewResource::collection($reviews));
    }

    public function show($id)
    {
        $review = $this->reviewService->getReviewById($id);

        return $this->success(new ReviewResource($review));
    }

    public function store(ReviewRequest $request)
    {
        $data = $request->validated();
        $data['user_id'] = auth()->id();

        $review = $this->reviewService->createReview($data);

        return $this->success(new ReviewResource($review), 'Review created successfully', 201);
    }

    public function update(ReviewRequest $request, $id)
    {
        $review = $this->reviewService->updateReview($id, $request->validated());

        return $this->success(new ReviewResource($review), 'Review updated successfully');
    }

    public function destroy($id)
    {
        $this->reviewService->deleteReview($id);

        return $this->success(null, 'Review deleted');
    }
}
