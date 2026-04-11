<?php

namespace Database\Seeders;

use App\Models\Kyc;
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
            ['email' => 'kakabichristian@gmail.com'],
            [
                'lastname' => 'Kakabi',
                'firstname' => 'Talla',
                'type' => 'admin',
                'password' => Hash::make('password'),
                'country_code' => 'CM',
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
                'country_code' => 'CM',
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
        $user_1 = Utilisateur::firstOrCreate(
            ['email' => 'user@exchapay.com'],
            [
                'lastname' => 'Pitou',
                'firstname' => 'Tagne',
                'type' => 'user',
                'password' => Hash::make('password'),
                'country_code' => 'CM',
                'telephone' => '+237699554411',
                'country' => 'Cameroun',
                'isactive' => true,
                'isverified' => true,
            ]
        );
        $userRole = Role::where('name', 'user')->first();
        if ($userRole) {
            $user_1->roles()->syncWithoutDetaching([$userRole->role_id]);
        }

        Kyc::updateOrCreate(
            ['user_id' => $user_1->user_id],
            [
                'current_level' => 1,
                'status' => 'APPROVED',
                'completed_at' => now(),
            ]
        );

        // Utilisateur standard
        $user_2 = Utilisateur::firstOrCreate(
            ['email' => 'user2@exchapay.com'],
            [
                'lastname' => 'Donald',
                'firstname' => 'Kamga',
                'type' => 'user',
                'password' => Hash::make('password'),
                'country_code' => 'NG',
                'telephone' => '+237699554499',
                'country' => 'Nigeria',
                'isactive' => true,
                'isverified' => true,
            ]
        );
        $userRole = Role::where('name', 'user')->first();
        if ($userRole) {
            $user_2->roles()->syncWithoutDetaching([$userRole->role_id]);
        }

        Kyc::updateOrCreate(
            ['user_id' => $user_2->user_id],
            [
                'current_level' => 1,
                'status' => 'APPROVED',
                'completed_at' => now(),
            ]
        );
    }
}
