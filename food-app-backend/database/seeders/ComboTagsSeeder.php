<?php

namespace Database\Seeders;

use App\Models\Combo;
use Illuminate\Database\Seeder;

class ComboTagsSeeder extends Seeder
{
    /**
     * Add tags and images to existing combos for discovery testing
     */
    public function run(): void
    {
        $combos = Combo::all();

        // Sample tags for combos
        $tagPools = [
            ['meal deal', 'lunch special', 'family pack'],
            ['value combo', 'dinner special', 'weekend deal'],
            ['breakfast combo', 'brunch special', 'morning deal'],
            ['party pack', 'group meal', 'sharing platter'],
            ['kids combo', 'family friendly', 'budget meal'],
            ['premium combo', 'deluxe meal', 'gourmet selection'],
            ['vegetarian combo', 'healthy choice', 'light meal'],
            ['spicy combo', 'hot & spicy', 'for spice lovers'],
        ];

        // Sample image URLs (these would be real images in production)
        $imageUrls = [
            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
            'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
            'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
            'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800',
            'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800',
        ];

        foreach ($combos as $index => $combo) {
            // Assign 2-3 random tags from one of the pools
            $tagPool = $tagPools[$index % count($tagPools)];
            $numTags = rand(2, 3);
            $selectedTags = array_slice($tagPool, 0, $numTags);

            // Assign 1-3 random images
            $numImages = rand(1, 3);
            $selectedImages = [];
            for ($i = 0; $i < $numImages; $i++) {
                $selectedImages[] = $imageUrls[($index + $i) % count($imageUrls)];
            }

            // Random order count for popularity (0-100)
            $orderCount = rand(0, 100);

            $combo->update([
                'tags' => $selectedTags,
                'images' => $selectedImages,
                'order_count' => $orderCount,
            ]);

            $this->command->info("Updated combo: {$combo->name} with " . count($selectedTags) . " tags and " . count($selectedImages) . " images");
        }

        $this->command->info('Combo discovery data seeded successfully!');
    }
}
