<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            // Gestion des utilisateurs
            ['name' => 'users.view', 'description' => 'Voir la liste des utilisateurs'],
            ['name' => 'users.create', 'description' => 'Créer un utilisateur'],
            ['name' => 'users.edit', 'description' => 'Modifier un utilisateur'],
            ['name' => 'users.delete', 'description' => 'Supprimer un utilisateur'],

            // Gestion des rôles
            ['name' => 'roles.view', 'description' => 'Voir la liste des rôles'],
            ['name' => 'roles.create', 'description' => 'Créer un rôle'],
            ['name' => 'roles.edit', 'description' => 'Modifier un rôle'],
            ['name' => 'roles.delete', 'description' => 'Supprimer un rôle'],

            // Gestion des permissions
            ['name' => 'permissions.view', 'description' => 'Voir la liste des permissions'],
            ['name' => 'permissions.assign', 'description' => 'Attribuer des permissions à un rôle'],

            // KYC
            ['name' => 'kyc.submit', 'description' => 'Soumettre un KYC'],
            ['name' => 'kyc.view', 'description' => 'Voir les KYC'],
            ['name' => 'kyc.approve', 'description' => 'Approuver un KYC'],
            ['name' => 'kyc.reject', 'description' => 'Rejeter un KYC'],

            // Listings
            ['name' => 'listings.view', 'description' => 'Voir les listings'],
            ['name' => 'listings.create', 'description' => 'Créer un listing'],
            ['name' => 'listings.edit', 'description' => 'Modifier un listing'],
            ['name' => 'listings.delete', 'description' => 'Supprimer un listing'],

            // Transactions
            ['name' => 'transactions.view', 'description' => 'Voir les transactions'],
            ['name' => 'transactions.create', 'description' => 'Initier une transaction'],
            ['name' => 'transactions.cancel', 'description' => 'Annuler une transaction'],
            ['name' => 'transactions.complete', 'description' => 'Compléter une transaction'],

            // Paiements
            ['name' => 'payments.view', 'description' => 'Voir les paiements'],
            ['name' => 'payments.create', 'description' => 'Effectuer un paiement'],

            // Méthodes de paiement
            ['name' => 'method_payments.view', 'description' => 'Voir ses méthodes de paiement'],
            ['name' => 'method_payments.create', 'description' => 'Ajouter une méthode de paiement'],
            ['name' => 'method_payments.edit', 'description' => 'Modifier une méthode de paiement'],
            ['name' => 'method_payments.delete', 'description' => 'Supprimer une méthode de paiement'],

            // Escrow
            ['name' => 'escrows.view', 'description' => 'Voir les escrows'],
            ['name' => 'escrows.lock', 'description' => 'Verrouiller les fonds en escrow'],
            ['name' => 'escrows.release', 'description' => 'Libérer les fonds en escrow'],

            // Reviews
            ['name' => 'reviews.view', 'description' => 'Voir les avis'],
            ['name' => 'reviews.create', 'description' => 'Laisser un avis'],
            ['name' => 'reviews.edit', 'description' => 'Modifier un avis'],
            ['name' => 'reviews.delete', 'description' => 'Supprimer un avis'],

            // Disputes
            ['name' => 'disputes.view', 'description' => 'Voir les disputes'],
            ['name' => 'disputes.open', 'description' => 'Ouvrir une dispute'],
            ['name' => 'disputes.resolve', 'description' => 'Résoudre une dispute'],

            // Notifications
            ['name' => 'notifications.view', 'description' => 'Voir ses notifications'],
            ['name' => 'notifications.send', 'description' => 'Envoyer des notifications'],

            // Type Document
            ['name' => 'type_documents.view', 'description' => 'Voir les types de documents'],
            ['name' => 'type_documents.create', 'description' => 'Créer un type de document'],
            ['name' => 'type_documents.edit', 'description' => 'Modifier un type de document'],
            ['name' => 'type_documents.delete', 'description' => 'Supprimer un type de document'],

            // Documents
            ['name' => 'documents.view', 'description' => 'Voir les documents'],
            ['name' => 'documents.upload', 'description' => 'Téléverser un document'],
            ['name' => 'documents.verify', 'description' => 'Vérifier un document'],

            // Feedbacks
            ['name' => 'feedbacks.view', 'description' => 'Voir les feedbacks'],
            ['name' => 'feedbacks.create', 'description' => 'Créer un feedback'],
            ['name' => 'feedbacks.delete', 'description' => 'Supprimer un feedback'],
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission['name']],
                ['description' => $permission['description']]
            );
        }
    }
}
