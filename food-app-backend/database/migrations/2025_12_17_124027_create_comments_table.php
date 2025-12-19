<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

use function Laravel\Prompts\table;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('comments', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('user_id')->constrained('users')->cascadeOnDelete();
            $table->ulidMorphs('commentable');
            $table->text('body');
            $table->foreignUlid('parent_id')->nullable()->constrained('comments')->cascadeOnDelete();
            $table->integer('depth')->default(0);
            $table->timestamps();
            $table->softDeletes();
            $table->index(['commentable_type', 'commentable_id', 'parent_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('comments');
    }
};
