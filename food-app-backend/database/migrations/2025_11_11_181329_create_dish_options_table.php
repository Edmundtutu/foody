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
        Schema::create('dish_options', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('dish_id')->constrained();
            $table->string('name');
            $table->unsignedInteger('extra_cost')->default(0);
            $table->boolean('required')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dish_options');
    }
};
