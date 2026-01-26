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
        Schema::create('agent_otps', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->foreignUlid('agent_id')->constrained()->cascadeOnDelete();
            $table->string('code');
            $table->timestamp('expires_at');
            $table->enum('type', ['LOGIN', 'VERIFICATION'])->default('LOGIN');
            $table->timestamp('used_at')->nullable();
            $table->timestamps();

            $table->index(['agent_id', 'expires_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('agent_otps');
    }
};
