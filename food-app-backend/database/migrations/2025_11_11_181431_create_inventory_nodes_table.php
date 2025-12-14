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
        Schema::create('inventory_nodes', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('restaurant_id')->constrained()->onDelete('cascade');
            $table->foreignUlid('category_id')->nullable()->constrained('menu_categories');
            $table->enum('entity_type', ['dish', 'modification', 'category']);
            $table->char('entity_id', 26)->nullable();
            $table->string('display_name')->nullable();
            $table->integer('x')->default(0);
            $table->integer('y')->default(0);
            $table->boolean('available')->default(true);
            $table->string('color_code', 10)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

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
        Schema::dropIfExists('inventory_nodes');
    }
};
