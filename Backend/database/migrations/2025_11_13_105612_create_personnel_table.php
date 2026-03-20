<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Ramsey\Uuid\Uuid;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('personnels', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table-> string('code_pers',50)->unique();
            $table-> string('nom_pers',50);
            $table-> enum('sexe_pers',['Masculin','Feminin']);
            $table-> string('phone_pers',50)->unique();
            $table-> string('login_pers',50) ->unique();
            $table-> string('pwd_pers');
            $table-> enum('type_pers',['RESPONSABLE DISCIPLINE','ENSEIGNANT','RESPONSABLE ACADEMIQUE']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('personnels');
    }
};
