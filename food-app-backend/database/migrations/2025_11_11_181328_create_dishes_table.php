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
        Schema::create('dishes', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('restaurant_id')->constrained();
            $table->foreignUlid('category_id')->constrained('menu_categories');
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedInteger('price')->default(0);
            $table->string('unit', 50)->default('plate');
            $table->boolean('available')->default(true);
            $table->json('images')->nullable();
            $table->json('tags')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dishes');
    }
};
