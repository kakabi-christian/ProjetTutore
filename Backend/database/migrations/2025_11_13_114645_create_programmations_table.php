<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Ramsey\Uuid\Uuid;



return new class extends Migration
{
    public function up(): void
    {
        Schema::create('programmations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code_ec',50);
            $table->string('num_salle',50);
            $table->string('code_pers',50);
            $table->date('date');
            $table->time('heure_debut');
            $table->time('heure_fin');
            $table->integer('nbre_heure');
            $table->enum('status',['Programmé','Annulé','Terminé','EN ATTENTE']);
            $table->timestamps();

            $table->foreign('code_ec')->references('code_ec')->on('ecs')->onDelete('cascade');
            $table->foreign('num_salle')->references('num_salle')->on('salles')->onDelete('cascade');
            $table->foreign('code_pers')->references('code_pers')->on('personnels')->onDelete('cascade');

            // 🔥 Nom court pour éviter l’erreur de MySQL
            $table->unique(
                ['code_ec','num_salle','code_pers','date','heure_debut'],
                'prog_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('programmations');
    }
};
