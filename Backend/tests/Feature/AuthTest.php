<?php

namespace Tests\Feature;

use App\Models\Utilisateur;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function test_login_success()
    {
        // 1. Créer un utilisateur de test
        $user = Utilisateur::create([
            'lastname' => 'Kakabi',
            'firstname' => 'Christian',
            'email' => 'test@exchapay.com',
            'password' => Hash::make('secret123'),
            'telephone' => '658788445',
            'country' => 'Cameroun',
            'type' => 'user',
            'isactive' => true,
            'isverified' => true,
        ]);

        // 2. Tenter la connexion via l'API (utilisation de l'email)
        $response = $this->postJson('/api/login', [
            'email' => 'test@exchapay.com',
            'password' => 'secret123',
        ]);

        // 3. Vérifications
        // Note: On vérifie 'user' au lieu de 'personnel' car c'est la clé renvoyée par ton AuthController
        $response->assertStatus(200)
            ->assertJsonStructure([
                'user',
                'access_token',
                'token_type',
            ]);
    }

    #[Test]
    public function test_login_fails_with_wrong_password()
    {
        // 1. Créer l'utilisateur
        Utilisateur::create([
            'lastname' => 'Test',
            'firstname' => 'User',
            'email' => 'wrong@exchapay.com',
            'password' => Hash::make('correct_password'),
            'telephone' => '000000000',
            'country' => 'Cameroun',
            'isactive' => true,
        ]);

        // 2. Tenter avec le mauvais mot de passe
        $response = $this->postJson('/api/login', [
            'email' => 'wrong@exchapay.com',
            'password' => 'wrong_password',
        ]);

        // 3. Vérification (Le message doit correspondre à celui de ton AuthController)
        $response->assertStatus(401)
            ->assertJson(['message' => 'Identifiants incorrects']);
    }
}
