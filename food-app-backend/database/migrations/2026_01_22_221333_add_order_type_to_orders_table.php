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
        Schema::table('orders', function (Blueprint $table) {
            $table->enum('order_type', ['DINE_IN', 'TAKEAWAY', 'DELIVERY'])
                ->default('DINE_IN')
                ->after('status');
            $table->json('delivery_address')->nullable()->after('order_type');
            $table->string('delivery_contact')->nullable()->after('delivery_address');
            
            $table->index('order_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['order_type']);
            $table->dropColumn(['order_type', 'delivery_address', 'delivery_contact']);
        });
    }
};
