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
        Schema::create('disputes', function (Blueprint $table) {
            $table->id('dispute_id');

            $table->unsignedBigInteger('user_id');
            $table->foreign('user_id')->references('user_id')->on('utilisateurs')->onDelete('cascade');

            $table->unsignedBigInteger('moderator_id')->nullable();
            $table->foreign('moderator_id')->references('user_id')->on('utilisateurs')->onDelete('set null');

            $table->string('reason');
            $table->text('description')->nullable();
            $table->enum('status', ['OPEN', 'CLOSED'])->default('OPEN');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('disputes');
    }
};
