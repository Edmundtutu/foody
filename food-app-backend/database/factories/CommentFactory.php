<?php

namespace Database\Factories;

use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Comment>
 */
class CommentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // Generate realistic comment text
        $commentPhrases = [
            'This looks absolutely delicious! 😍',
            'I need to try this ASAP!',
            'Wow, this is making me hungry!',
            'Best food in town! 🔥',
            'Can\'t wait to visit this place!',
            'This is exactly what I needed today',
            'Yum! Adding this to my must-try list',
            'You\'re making me drool 🤤',
            'I had this last week and it was amazing!',
            'Looks so good! How was it?',
            'The presentation is beautiful 👌',
            'This place never disappoints!',
            'I\'m definitely going there this weekend',
            'That looks incredible! What did you order?',
            'Food goals! 🎯',
        ];

        return [
            'user_id' => User::factory(),
            'body' => $this->faker->randomElement($commentPhrases),
            'commentable_type' => Post::class,
            'commentable_id' => null, // Will be set in seeder
            'parent_id' => null,
            'depth' => 0,
        ];
    }

    /**
     * Indicate that this is a reply to another comment.
     */
    public function reply(): static
    {
        return $this->state(function (array $attributes) {
            $parentComment = \App\Models\Comment::inRandomOrder()->first();
            
            if ($parentComment) {
                return [
                    'parent_id' => $parentComment->id,
                    'depth' => $parentComment->depth + 1,
                    'commentable_type' => $parentComment->commentable_type,
                    'commentable_id' => $parentComment->commentable_id,
                ];
            }
            
            return [];
        });
    }

    /**
     * Indicate that this comment is for a specific post.
     */
    public function forPost($postId): static
    {
        return $this->state(fn (array $attributes) => [
            'commentable_type' => Post::class,
            'commentable_id' => $postId,
        ]);
    }
}
