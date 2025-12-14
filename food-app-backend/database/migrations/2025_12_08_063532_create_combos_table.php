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
        Schema::create('combos', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('restaurant_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->json('tags')->nullable();
            $table->json('images')->nullable();
            $table->unsignedInteger('order_count')->default(0);
            $table->enum('pricing_mode', ['FIXED', 'DYNAMIC', 'HYBRID'])->default('FIXED');
            $table->decimal('base_price', 10, 2)->default(0);
            $table->boolean('available')->default(true);
            $table->timestamps();
            
            $table->index('available');
            $table->index('order_count');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('combos');
    }
};
