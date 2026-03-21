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
        Schema::create('user_permissions', function (Blueprint $table) {
            $table->id('user_permission_id');
            
            // Définition des colonnes pour les clés étrangères
            $table->unsignedBigInteger('role_id');
            $table->unsignedBigInteger('permission_id');

            // Définition des contraintes de clés étrangères
            $table->foreign('role_id')->references('role_id')->on('roles')->onDelete('cascade');
            $table->foreign('permission_id')->references('permission_id')->on('permissions')->onDelete('cascade');

            // Empêcher qu'une permission soit attribuée plusieurs fois au même rôle
            $table->unique(['role_id', 'permission_id']);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_permissions');
    }
};