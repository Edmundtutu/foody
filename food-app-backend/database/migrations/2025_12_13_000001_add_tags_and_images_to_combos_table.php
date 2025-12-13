<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('combos', function (Blueprint $table) {
            // Add tags column for filtering (similar to dishes table)
            $table->json('tags')->nullable()->after('description');
            
            // Add images array for visual display in discovery
            $table->json('images')->nullable()->after('tags');
            
            // Add order_count for popularity tracking
            $table->unsignedInteger('order_count')->default(0)->after('images');
            
            // Add indexes for performance
            $table->index('available');
            $table->index('order_count');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('combos', function (Blueprint $table) {
            $table->dropIndex(['available']);
            $table->dropIndex(['order_count']);
            $table->dropColumn(['tags', 'images', 'order_count']);
        });
    }
};
