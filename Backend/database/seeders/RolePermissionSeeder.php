<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\Permission;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // ─── Admin : toutes les permissions ───
        $admin = Role::where('name', 'admin')->first();
        if ($admin) {
            $allPermissions = Permission::pluck('permission_id')->toArray();
            $admin->permissions()->sync($allPermissions);
        }

        // ─── Moderator : modération + consultation ───
        $moderator = Role::where('name', 'moderator')->first();
        if ($moderator) {
            $moderatorPermissions = Permission::whereIn('name', [
                // Utilisateurs
                'users.view',

                // KYC
                'kyc.view',
                'kyc.approve',
                'kyc.reject',

                // Listings
                'listings.view',
                'listings.delete',

                // Transactions
                'transactions.view',

                // Paiements
                'payments.view',

                // Escrow
                'escrows.view',
                'escrows.release',

                // Reviews
                'reviews.view',
                'reviews.delete',

                // Disputes
                'disputes.view',
                'disputes.resolve',

                // Notifications
                'notifications.view',
                'notifications.send',

                // Documents
                'documents.view',
                'documents.verify',

                // Feedbacks
                'feedbacks.view',
                'feedbacks.delete',
            ])->pluck('permission_id')->toArray();

            $moderator->permissions()->sync($moderatorPermissions);
        }

        // ─── User : actions de base ───
        $user = Role::where('name', 'user')->first();
        if ($user) {
            $userPermissions = Permission::whereIn('name', [
                // KYC
                'kyc.submit',
                'kyc.view',

                // Listings
                'listings.view',
                'listings.create',
                'listings.edit',
                'listings.delete',

                // Transactions
                'transactions.view',
                'transactions.create',
                'transactions.cancel',
                'transactions.complete',

                // Paiements
                'payments.view',
                'payments.create',

                // Méthodes de paiement
                'method_payments.view',
                'method_payments.create',
                'method_payments.edit',
                'method_payments.delete',

                // Escrow
                'escrows.view',

                // Reviews
                'reviews.view',
                'reviews.create',
                'reviews.edit',

                // Disputes
                'disputes.view',
                'disputes.open',

                // Notifications
                'notifications.view',

                // Interaction AI
                'interaction_ai.use',

                // Documents
                'documents.view',
                'documents.upload',

                // Feedbacks
                'feedbacks.view',
                'feedbacks.create',
            ])->pluck('permission_id')->toArray();

            $user->permissions()->sync($userPermissions);
        }
    }
}
