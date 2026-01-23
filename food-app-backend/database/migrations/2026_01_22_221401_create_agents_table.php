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
        Schema::create('agents', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('restaurant_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('nin')->comment('National ID Number');
            $table->string('name');
            $table->string('phone_number');
            $table->string('fleet_kind')->default('motorbike')->comment('vehicle, motorbike, bicycle, foot');
            $table->string('plate_number')->nullable();
            $table->string('photo')->nullable();
            $table->enum('status', ['active', 'suspended', 'inactive'])->default('inactive');
            $table->boolean('is_available')->default(false);
            $table->unsignedInteger('current_load')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index('restaurant_id');
            $table->index('status');
            $table->index('is_available');
            $table->index(['restaurant_id', 'status']);
            $table->index(['restaurant_id', 'is_available']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('agents');
    }
};
