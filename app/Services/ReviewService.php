<?php

namespace App\Services;

use App\Models\Review;

class ReviewService
{
    public function createReview(array $data)
    {
        return Review::create($data);
    }

    public function getReviewById(string $id)
    {
        return Review::with(['user', 'reviewable'])->findOrFail($id);
    }

    public function updateReview(string $id, array $data)
    {
        $review = Review::findOrFail($id);
        $review->update($data);
        return $review->fresh();
    }

    public function deleteReview(string $id)
    {
        $review = Review::findOrFail($id);
        return $review->delete();
    }

    public function getRestaurantReviews(string $restaurantId)
    {
        return Review::where('reviewable_type', 'restaurant')
            ->where('reviewable_id', $restaurantId)
            ->with('user')
            ->latest()
            ->get();
    }

    public function getDishReviews(string $dishId)
    {
        return Review::where('reviewable_type', 'dish')
            ->where('reviewable_id', $dishId)
            ->with('user')
            ->latest()
            ->get();
    }
}
