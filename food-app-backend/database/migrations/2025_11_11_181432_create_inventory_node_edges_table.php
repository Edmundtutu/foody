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
        Schema::create('inventory_node_edges', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('restaurant_id')->constrained()->onDelete('cascade');
            $table->foreignUlid('source_node_id')->constrained('inventory_nodes')->onDelete('cascade');
            $table->foreignUlid('target_node_id')->constrained('inventory_nodes')->onDelete('cascade');
            $table->string('label')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_node_edges');
    }
};
