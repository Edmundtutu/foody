<?php

namespace Database\Seeders;

use App\Models\Comment;
use App\Models\Dish;
use App\Models\Follow;
use App\Models\Like;
use App\Models\Post;
use App\Models\Restaurant;
use App\Models\User;
use Illuminate\Database\Seeder;

class SocialSeeder extends Seeder
{
    /**
     * Run the social media feature seeders.
     * 
     * Seeds posts, comments, likes, and follows for a realistic social feed.
     */
    public function run(): void
    {
        $this->command->info('🌱 Seeding social data...');

        // Get existing users
        $users = User::where('role', '!=', 'restaurant')->get();
        $restaurantUsers = User::where('role', 'restaurant')->get();
        
        if ($users->isEmpty()) {
            $this->command->warn('⚠️  No users found. Creating sample users...');
            $users = User::factory(10)->create(['role' => 'customer']);
        }

        // Get existing restaurants and dishes
        $restaurants = Restaurant::all();
        $dishes = Dish::all();

        $this->command->info("👥 Found {$users->count()} users");
        $this->command->info("🏪 Found {$restaurants->count()} restaurants");
        $this->command->info("🍽️  Found {$dishes->count()} dishes");

        // Step 1: Create Posts
        $this->command->info('📝 Creating posts...');
        $posts = collect();

        // Create posts from regular users
        foreach ($users as $user) {
            // Each user creates 2-4 posts
            $postCount = rand(2, 4);
            
            for ($i = 0; $i < $postCount; $i++) {
                $post = Post::factory()->create([
                    'user_id' => $user->id,
                ]);

                // 40% chance to attach a dish
                if ($dishes->isNotEmpty() && rand(1, 100) <= 40) {
                    $dish = $dishes->random();
                    $post->update([
                        'dish_id' => $dish->id,
                        'restaurant_id' => $dish->restaurant_id,
                    ]);
                }
                // 30% chance to just tag a restaurant (without dish)
                elseif ($restaurants->isNotEmpty() && rand(1, 100) <= 30) {
                    $post->update([
                        'restaurant_id' => $restaurants->random()->id,
                    ]);
                }

                $posts->push($post);
            }
        }

        $this->command->info("✅ Created {$posts->count()} posts");

        // Step 2: Create Follows
        $this->command->info('🤝 Creating follows...');
        $followsCount = 0;

        foreach ($users as $user) {
            // Each user follows 3-8 other users
            $usersToFollow = $users->where('id', '!=', $user->id)
                ->random(min(rand(3, 8), $users->count() - 1));

            foreach ($usersToFollow as $userToFollow) {
                $follow = Follow::firstOrCreate([
                    'follower_id' => $user->id,
                    'followable_type' => User::class,
                    'followable_id' => $userToFollow->id,
                ]);
                
                if ($follow->wasRecentlyCreated) {
                    $followsCount++;
                }
            }

            // Each user follows 2-5 restaurants
            if ($restaurants->isNotEmpty()) {
                $restaurantsToFollow = $restaurants->random(min(rand(2, 5), $restaurants->count()));

                foreach ($restaurantsToFollow as $restaurant) {
                    $follow = Follow::firstOrCreate([
                        'follower_id' => $user->id,
                        'followable_type' => Restaurant::class,
                        'followable_id' => $restaurant->id,
                    ]);
                    
                    if ($follow->wasRecentlyCreated) {
                        $followsCount++;
                    }
                }
            }
        }

        $this->command->info("✅ Created {$followsCount} follows");

        // Step 3: Create Likes on Posts
        $this->command->info('❤️  Creating likes on posts...');
        $postLikesCount = 0;

        foreach ($posts as $post) {
            // Each post gets likes from 30-70% of users
            $likersCount = rand((int)($users->count() * 0.3), (int)($users->count() * 0.7));
            $likers = $users->random(min($likersCount, $users->count()));

            foreach ($likers as $liker) {
                $like = Like::firstOrCreate([
                    'user_id' => $liker->id,
                    'likeable_type' => Post::class,
                    'likeable_id' => $post->id,
                ]);
                
                if ($like->wasRecentlyCreated) {
                    $postLikesCount++;
                }
            }
        }

        $this->command->info("✅ Created {$postLikesCount} post likes");

        // Step 4: Create Comments on Posts
        $this->command->info('💬 Creating comments...');
        $commentsCount = 0;

        foreach ($posts as $post) {
            // Each post gets 2-6 top-level comments
            $commentCount = rand(2, 6);
            $commenters = $users->random(min($commentCount, $users->count()));

            foreach ($commenters as $commenter) {
                $comment = Comment::create([
                    'user_id' => $commenter->id,
                    'body' => $this->generateComment(),
                    'commentable_type' => Post::class,
                    'commentable_id' => $post->id,
                    'parent_id' => null,
                    'depth' => 0,
                ]);
                $commentsCount++;

                // 50% chance of having 1-2 replies
                if (rand(1, 100) <= 50) {
                    $replyCount = rand(1, 2);
                    $repliers = $users->where('id', '!=', $commenter->id)
                        ->random(min($replyCount, $users->count() - 1));

                    foreach ($repliers as $replier) {
                        Comment::create([
                            'user_id' => $replier->id,
                            'body' => $this->generateReply(),
                            'commentable_type' => Post::class,
                            'commentable_id' => $post->id,
                            'parent_id' => $comment->id,
                            'depth' => 1,
                        ]);
                        $commentsCount++;
                    }
                }
            }
        }

        $this->command->info("✅ Created {$commentsCount} comments");

        // Step 5: Create Likes on Comments
        $this->command->info('❤️  Creating likes on comments...');
        $commentLikesCount = 0;
        $allComments = Comment::all();

        foreach ($allComments as $comment) {
            // Each comment gets likes from 10-40% of users
            $likersCount = rand((int)($users->count() * 0.1), (int)($users->count() * 0.4));
            $likers = $users->random(min($likersCount, $users->count()));

            foreach ($likers as $liker) {
                $like = Like::firstOrCreate([
                    'user_id' => $liker->id,
                    'likeable_type' => Comment::class,
                    'likeable_id' => $comment->id,
                ]);
                
                if ($like->wasRecentlyCreated) {
                    $commentLikesCount++;
                }
            }
        }

        $this->command->info("✅ Created {$commentLikesCount} comment likes");

        // Summary
        $this->command->newLine();
        $this->command->info('📊 Social Data Seeding Summary:');
        $this->command->table(
            ['Type', 'Count'],
            [
                ['Posts', $posts->count()],
                ['Comments', $commentsCount],
                ['Post Likes', $postLikesCount],
                ['Comment Likes', $commentLikesCount],
                ['Follows', $followsCount],
                ['Total', $posts->count() + $commentsCount + $postLikesCount + $commentLikesCount + $followsCount],
            ]
        );

        $this->command->info('✅ Social data seeding completed successfully!');
    }

    /**
     * Generate a realistic comment
     */
    private function generateComment(): string
    {
        $comments = [
            'This looks absolutely delicious! 😍',
            'I need to try this ASAP!',
            'Wow, this is making me hungry! 🤤',
            'Best food in town! 🔥',
            'Can\'t wait to visit this place!',
            'This is exactly what I needed today',
            'Yum! Adding this to my must-try list 📝',
            'You\'re making me drool 🤤',
            'I had this last week and it was amazing!',
            'Looks so good! How was it?',
            'The presentation is beautiful 👌',
            'This place never disappoints!',
            'I\'m definitely going there this weekend',
            'That looks incredible! What did you order?',
            'Food goals! 🎯',
            'This should be illegal, it looks too good! 😋',
            'I\'m on my way right now! 🏃',
            'The colors alone are making me hungry',
            'Is this heaven? Because it looks heavenly! ☁️',
            'Drop the recipe! 👀',
        ];

        return $comments[array_rand($comments)];
    }

    /**
     * Generate a realistic reply
     */
    private function generateReply(): string
    {
        $replies = [
            'Right?! So good! 😊',
            'You should totally try it!',
            'Thanks! It was amazing',
            'Agreed! One of my favorites',
            'Let\'s go together sometime!',
            'I know right! 😄',
            'You won\'t regret it!',
            'It\'s even better than it looks!',
            'The secret is in the sauce 😉',
            'They have the best chef!',
            'I go there every week lol',
            'Worth every penny!',
            'My thoughts exactly!',
            'Haha yes! 😂',
            'Same here! 🙌',
        ];

        return $replies[array_rand($replies)];
    }
}
