<?php

use App\Models\Personnel;
use Illuminate\Support\Facades\Hash;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * Test : Connexion réussie
 */
test('login success returns token', function () {

    // Créer un utilisateur valide selon la migration
    Personnel::create([
        'code_pers' => 'P001',
        'nom_pers' => 'Admin Test',
        'sexe_pers' => 'Masculin',
        'phone_pers' => '699999999',
        'login_pers' => 'admin',
        'pwd_pers' => Hash::make('123456'),
        'type_pers' => 'RESPONSABLE ACADEMIQUE'
    ]);

    // Appel API login
    $response = $this->postJson('/api/login', [
        'login_pers' => 'admin',
        'pwd_pers' => '123456'
    ]);

    // Vérifications
    $response->assertStatus(200)
        ->assertJsonStructure([
            'personnel' => [
                'id',
                'code_pers',
                'nom_pers',
                'sexe_pers',
                'phone_pers',
                'login_pers',
                'type_pers',
                'created_at',
                'updated_at'
            ],
            'access_token',
            'token_type'
        ]);
});


/**
 * Test : Connexion échouée (mauvais mot de passe)
 */
test('login fails with wrong password', function () {

    Personnel::create([
        'code_pers' => 'P002',
        'nom_pers' => 'User Test',
        'sexe_pers' => 'Masculin',
        'phone_pers' => '688888888',
        'login_pers' => 'user',
        'pwd_pers' => Hash::make('123456'),
        'type_pers' => 'ENSEIGNANT'
    ]);

    $response = $this->postJson('/api/login', [
        'login_pers' => 'user',
        'pwd_pers' => 'wrongpassword'
    ]);

    $response->assertStatus(401)
        ->assertJson([
            'message' => 'Identifiants invalides'
        ]);
});


/**
 * Test : Champs obligatoires vides
 */
test('login fails with empty fields', function () {

    $response = $this->postJson('/api/login', []);

    $response->assertStatus(422);
});
