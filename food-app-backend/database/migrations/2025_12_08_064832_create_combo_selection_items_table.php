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
        Schema::create('combo_selection_items', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('combo_selection_id')->constrained('combo_selections')->onDelete('cascade');
            $table->foreignUlid('dish_id')->constrained('dishes')->onDelete('cascade');
            $table->json('options')->nullable();
            $table->decimal('price', 10, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('combo_selection_items');
    }
};
