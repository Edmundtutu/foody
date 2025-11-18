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
        // Update the enum to include 'modification' and 'category', remove 'ingredient' and 'station'
        // For simplicity, we'll use DB::statement for MySQL/PostgreSQL compatibility
        \DB::statement("ALTER TABLE inventory_nodes MODIFY COLUMN entity_type ENUM('dish', 'modification', 'category')");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to original enum values
        \DB::statement("ALTER TABLE inventory_nodes MODIFY COLUMN entity_type ENUM('ingredient', 'dish', 'station')");
    }
};
