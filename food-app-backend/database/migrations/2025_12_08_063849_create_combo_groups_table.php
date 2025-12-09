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
        Schema::create('combo_groups', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('combo_id')->constrained('combos')->onDelete('cascade');
            $table->string('name');
            $table->unsignedInteger('allowed_min')->default(1);
            $table->unsignedInteger('allowed_max')->default(1);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('combo_groups');
    }
};
