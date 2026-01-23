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
        Schema::create('order_logistics', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('order_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignUlid('agent_id')->nullable()->constrained()->nullOnDelete();
            $table->json('pickup_address')->comment('Restaurant or custom pickup point');
            $table->json('delivery_address')->comment('Customer delivery location');
            $table->enum('delivery_status', ['PENDING', 'ASSIGNED', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED'])
                ->default('PENDING');
            $table->timestamp('assigned_at')->nullable();
            $table->timestamp('picked_up_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamps();

            $table->index('agent_id');
            $table->index('delivery_status');
            $table->index(['agent_id', 'delivery_status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_logistics');
    }
};
