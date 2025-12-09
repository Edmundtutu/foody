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
        Schema::create('combo_group_category_hints', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('combo_group_id')->constrained('combo_groups')->onDelete('cascade');
            $table->foreignUlid('category_id')->constrained('menu_categories')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('combo_group_category_hints');
    }
};
