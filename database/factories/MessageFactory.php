<?php

namespace Database\Factories;

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Message>
 */
class MessageFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $senderRole = fake()->randomElement(['customer', 'restaurant']);
        
        return [
            'conversation_id' => Conversation::factory(),
            'sender_id' => User::factory(),
            'sender_role' => $senderRole,
            'content' => fake()->sentence(),
            'read_at' => fake()->optional(0.6)->dateTimeBetween('-5 days', 'now'),
            'created_at' => fake()->dateTimeBetween('-7 days', 'now'),
        ];
    }

    /**
     * Indicate that the message is from a customer.
     */
    public function fromCustomer(): static
    {
        return $this->state(fn (array $attributes) => [
            'sender_role' => 'customer',
        ]);
    }

    /**
     * Indicate that the message is from a restaurant.
     */
    public function fromRestaurant(): static
    {
        return $this->state(fn (array $attributes) => [
            'sender_role' => 'restaurant',
        ]);
    }

    /**
     * Indicate that the message has been read.
     */
    public function read(): static
    {
        return $this->state(fn (array $attributes) => [
            'read_at' => now(),
        ]);
    }
}
