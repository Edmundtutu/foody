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
        // Add indexes to orders table
        Schema::table('orders', function (Blueprint $table) {
            $table->index('restaurant_id');
            $table->index('user_id');
            $table->index('status');
            $table->index('created_at');
            $table->index(['restaurant_id', 'status']);
            $table->index(['restaurant_id', 'created_at']);
        });

        // Add indexes to dishes table
        Schema::table('dishes', function (Blueprint $table) {
            $table->index('restaurant_id');
            $table->index('category_id');
            $table->index('available');
            $table->index(['restaurant_id', 'category_id']);
        });

        // Add indexes to menu_categories table
        Schema::table('menu_categories', function (Blueprint $table) {
            $table->index('restaurant_id');
            $table->index('display_order');
        });

        // Add indexes to order_items table
        Schema::table('order_items', function (Blueprint $table) {
            $table->index('order_id');
            $table->index('dish_id');
        });

        // Add indexes to conversations table
        Schema::table('conversations', function (Blueprint $table) {
            $table->index('restaurant_id');
            $table->index('customer_id');
            $table->index('order_id');
            $table->index('last_message_at');
            $table->index(['restaurant_id', 'last_message_at']);
        });

        // Add indexes to messages table
        Schema::table('messages', function (Blueprint $table) {
            $table->index('conversation_id');
            $table->index('sender_id');
            $table->index('created_at');
            $table->index(['conversation_id', 'created_at']);
        });

        // Add indexes to inventory_nodes table
        Schema::table('inventory_nodes', function (Blueprint $table) {
            $table->index('restaurant_id');
            $table->index('category_id');
            $table->index('entity_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove indexes from orders table
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['restaurant_id']);
            $table->dropIndex(['user_id']);
            $table->dropIndex(['status']);
            $table->dropIndex(['created_at']);
            $table->dropIndex(['restaurant_id', 'status']);
            $table->dropIndex(['restaurant_id', 'created_at']);
        });

        // Remove indexes from dishes table
        Schema::table('dishes', function (Blueprint $table) {
            $table->dropIndex(['restaurant_id']);
            $table->dropIndex(['category_id']);
            $table->dropIndex(['available']);
            $table->dropIndex(['restaurant_id', 'category_id']);
        });

        // Remove indexes from menu_categories table
        Schema::table('menu_categories', function (Blueprint $table) {
            $table->dropIndex(['restaurant_id']);
            $table->dropIndex(['display_order']);
        });

        // Remove indexes from order_items table
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropIndex(['order_id']);
            $table->dropIndex(['dish_id']);
        });

        // Remove indexes from conversations table
        Schema::table('conversations', function (Blueprint $table) {
            $table->dropIndex(['restaurant_id']);
            $table->dropIndex(['customer_id']);
            $table->dropIndex(['order_id']);
            $table->dropIndex(['last_message_at']);
            $table->dropIndex(['restaurant_id', 'last_message_at']);
        });

        // Remove indexes from messages table
        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex(['conversation_id']);
            $table->dropIndex(['sender_id']);
            $table->dropIndex(['created_at']);
            $table->dropIndex(['conversation_id', 'created_at']);
        });

        // Remove indexes from inventory_nodes table
        Schema::table('inventory_nodes', function (Blueprint $table) {
            $table->dropIndex(['restaurant_id']);
            $table->dropIndex(['category_id']);
            $table->dropIndex(['entity_type']);
        });
    }
};

