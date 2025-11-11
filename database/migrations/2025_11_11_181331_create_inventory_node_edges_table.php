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
            $table->char('id', 26)->primary();
            $table->char('restaurant_id', 26);
            $table->char('source_node_id', 26);
            $table->char('target_node_id', 26);
            $table->string('label')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('restaurant_id')->references('id')->on('restaurants');
            $table->foreign('source_node_id')->references('id')->on('inventory_nodes');
            $table->foreign('target_node_id')->references('id')->on('inventory_nodes');
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
