<?php

use App\Models\Dish;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->string('orderable_type')->nullable()->after('order_id');
            $table->ulid('orderable_id')->nullable()->after('orderable_type');
            $table->index(['orderable_type', 'orderable_id'], 'order_items_orderable_index');
        });

        DB::table('order_items')->update([
            'orderable_type' => Dish::class,
            'orderable_id' => DB::raw('dish_id'),
        ]);

        Schema::table('order_items', function (Blueprint $table) {
            if (Schema::hasColumn('order_items', 'dish_id')) {
                $table->dropForeign(['dish_id']);
                $table->dropIndex('order_items_dish_id_index');
                $table->dropColumn('dish_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->foreignUlid('dish_id')->nullable()->after('order_id')->constrained()->nullOnDelete();
        });

        DB::table('order_items')
            ->where('orderable_type', Dish::class)
            ->update([
                'dish_id' => DB::raw('orderable_id'),
            ]);

        Schema::table('order_items', function (Blueprint $table) {
            $table->dropIndex('order_items_orderable_index');
            $table->dropColumn(['orderable_type', 'orderable_id']);
        });
    }
};
