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
        // SQLite doesn't support ENUM or ALTER COLUMN MODIFY
        // This migration is skipped for SQLite (testing) but will run on MySQL/PostgreSQL in production
        if (Schema::connection(null)->getConnection()->getDriverName() !== 'sqlite') {
            \DB::statement("ALTER TABLE inventory_nodes MODIFY COLUMN entity_type ENUM('dish', 'modification', 'category')");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to original enum values
        if (Schema::connection(null)->getConnection()->getDriverName() !== 'sqlite') {
            \DB::statement("ALTER TABLE inventory_nodes MODIFY COLUMN entity_type ENUM('ingredient', 'dish', 'station')");
        }
    }
};
