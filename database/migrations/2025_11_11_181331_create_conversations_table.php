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
        Schema::create('conversations', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('order_id', 26);
            $table->char('customer_id', 26);
            $table->char('restaurant_id', 26);
            $table->enum('status', ['active', 'closed', 'archived'])->default('active');
            $table->timestamp('last_message_at')->nullable();
            $table->timestamps();
            
            $table->foreign('order_id')->references('id')->on('orders');
            $table->foreign('customer_id')->references('id')->on('users');
            $table->foreign('restaurant_id')->references('id')->on('restaurants');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('conversations');
    }
};
