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
        Schema::create('combo_selections', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('combo_id')->constrained('combos')->onDelete('cascade');
            $table->foreignUlid('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('total_price', 10, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('combo_selections');
    }
};
