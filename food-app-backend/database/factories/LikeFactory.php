<?php

namespace Database\Factories;

use App\Models\Comment;
use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Like>
 */
class LikeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'likeable_type' => Post::class,
            'likeable_id' => null, // Will be set in seeder
        ];
    }

    /**
     * Indicate that this is a like for a post.
     */
    public function forPost($postId): static
    {
        return $this->state(fn (array $attributes) => [
            'likeable_type' => Post::class,
            'likeable_id' => $postId,
        ]);
    }

    /**
     * Indicate that this is a like for a comment.
     */
    public function forComment($commentId): static
    {
        return $this->state(fn (array $attributes) => [
            'likeable_type' => Comment::class,
            'likeable_id' => $commentId,
        ]);
    }
}
