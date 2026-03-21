<?php

namespace Tests\Traits;

use App\Models\Utilisateur;
use Laravel\Sanctum\Sanctum;
use Illuminate\Support\Facades\Hash;

trait ApiTokenTrait
{
    /**
     * Authentifie un utilisateur pour les tests API
     */
    protected function authenticateUser(): Utilisateur
    {
        // 1. Nettoyage pour éviter les doublons durant les tests
        Utilisateur::where('email', 'test@exchapay.com')->delete();

        // 2. Création d'un utilisateur de test conforme à ton modèle Utilisateur
        $user = Utilisateur::create([
            'lastname'   => 'Test',
            'firstname'  => 'Admin',
            'email'      => 'test@exchapay.com',
            'password'   => Hash::make('password123'),
            'telephone'  => '+237600000000',
            'country'    => 'Cameroun',
            'type'       => 'admin', // Selon ta méthode isAdmin()
            'isactive'   => true,
            'isverified' => true,
        ]);

        // 3. Simuler l'authentification via Sanctum pour le test en cours
        // Le deuxième argument [] peut contenir les permissions (abilities) si nécessaire
        Sanctum::actingAs($user, ['*'], 'sanctum');

        return $user;
    }
}