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
        Schema::create('dishes', function (Blueprint $table) {
            $table->char('id', 26)->primary();
            $table->char('restaurant_id', 26);
            $table->char('category_id', 26);
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedInteger('price')->default(0);
            $table->string('unit', 50)->default('plate');
            $table->boolean('available')->default(true);
            $table->json('images')->nullable();
            $table->json('tags')->nullable();
            $table->timestamps();
            $table->softDeletes();
            
            $table->foreign('restaurant_id')->references('id')->on('restaurants');
            $table->foreign('category_id')->references('id')->on('menu_categories');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dishes');
    }
};
