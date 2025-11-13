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
        // Add color_code to menu_categories
        Schema::table('menu_categories', function (Blueprint $table) {
            $table->string('color_code', 10)->nullable()->after('display_order');
        });

        // Add category_id and available to inventory_nodes
        Schema::table('inventory_nodes', function (Blueprint $table) {
            $table->char('category_id', 26)->nullable()->after('restaurant_id');
            $table->boolean('available')->default(true)->after('y');
            
            $table->foreign('category_id')->references('id')->on('menu_categories');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inventory_nodes', function (Blueprint $table) {
            $table->dropForeign(['category_id']);
            $table->dropColumn(['category_id', 'available']);
        });

        Schema::table('menu_categories', function (Blueprint $table) {
            $table->dropColumn('color_code');
        });
    }
};
