<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\Utilisateur;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UtilisateurSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Administrateur
        $admin = Utilisateur::firstOrCreate(
            ['email' => 'admin@exchapay.com'],
            [
                'lastname' => 'Kakabi',
                'firstname' => 'Talla',
                'password' => Hash::make('password'),
                'telephone' => '+237699554433',
                'country' => 'Cameroun',
                'isactive' => true,
                'isverified' => true,
            ]
        );
        $adminRole = Role::where('name', 'admin')->first();
        if ($adminRole) {
            $admin->roles()->syncWithoutDetaching([$adminRole->role_id]);
        }

        // Modérateur
        $moderator = Utilisateur::firstOrCreate(
            ['email' => 'moderator@exchapay.com'],
            [
                'lastname' => 'Steve',
                'firstname' => 'Tetchoup',
                'password' => Hash::make('password'),
                'telephone' => '+237699554488',
                'country' => 'Cameroun',
                'isactive' => true,
                'isverified' => true,
            ]
        );
        $moderatorRole = Role::where('name', 'moderator')->first();
        if ($moderatorRole) {
            $moderator->roles()->syncWithoutDetaching([$moderatorRole->role_id]);
        }

        // Utilisateur standard
        $user = Utilisateur::firstOrCreate(
            ['email' => 'user@exchapay.com'],
            [
                'lastname' => 'Pitou',
                'firstname' => 'Tagne',
                'password' => Hash::make('password'),
                'telephone' => '+237699554411',
                'country' => 'Cameroun',
                'isactive' => true,
                'isverified' => true,
            ]
        );
        $userRole = Role::where('name', 'user')->first();
        if ($userRole) {
            $user->roles()->syncWithoutDetaching([$userRole->role_id]);
        }
    }
}
