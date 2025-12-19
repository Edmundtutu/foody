<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Dish;
use App\Models\Restaurant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Post>
 */
class PostFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $images = [];

        // 60% chance of having images
        if ($this->faker->boolean(60)) {
            $imageCount = $this->faker->numberBetween(1, 3);

            for ($i = 0; $i < $imageCount; $i++) {
                // Use random food images from Lorem Picsum
                $images[] = 'https://picsum.photos/seed/food-' . $this->faker->uuid . '/800/600';
            }
        }

        // Generate engaging food-related content
        $foodPhrases = [
            '🍕 Just had the most amazing pizza at {}! Absolutely delicious!',
            '🍔 Can\'t stop thinking about this burger... Pure perfection!',
            '🍜 This ramen hit different today. Comfort food at its finest!',
            '🍰 Dessert goals achieved! {} never disappoints',
            '☕ Morning coffee vibes at {} ✨',
            '🌮 Taco Tuesday done right! Who else loves {}?',
            '🍣 Fresh sushi is always a good idea 🐟',
            '🥗 Healthy eating made delicious! Loving this salad bowl',
            '🍝 Pasta night = best night. Who agrees?',
            '🍕 Food coma incoming... but totally worth it!',
            'Just discovered this hidden gem! {} has the best food in town!',
            'Weekend brunch goals 🥞☕ #foodie #delicious',
            'When the food looks too good to eat... but you eat it anyway 😋',
            'This is why I have trust issues with diet plans 😅',
            'Food brings people together ❤️ Great meal with great company!',
        ];

        $content = $this->faker->randomElement($foodPhrases);
        $content = str_replace('{}', '@restaurant', $content);

        return [
            'user_id' => User::factory(),
            'content' => $content,
            'images' => $images,
            'dish_id' => null, // Will be set in seeder if needed
            'restaurant_id' => null, // Will be set in seeder if needed
        ];
    }

    /**
     * Indicate that the post has a dish attached.
     */
    public function withDish(): static
    {
        return $this->state(fn (array $attributes) => [
            'dish_id' => Dish::inRandomOrder()->first()?->id,
        ]);
    }

    /**
     * Indicate that the post has a restaurant attached.
     */
    public function withRestaurant(): static
    {
        return $this->state(fn (array $attributes) => [
            'restaurant_id' => Restaurant::inRandomOrder()->first()?->id,
        ]);
    }

    /**
     * Indicate that the post has no images.
     */
    public function withoutImages(): static
    {
        return $this->state(fn (array $attributes) => [
            'images' => [],
        ]);
    }
}
