<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            ['name' => 'admin', 'description' => 'Administrateur avec accès total à la plateforme'],
            ['name' => 'moderator', 'description' => 'Modérateur chargé de la gestion des disputes et de la modération'],
            ['name' => 'user', 'description' => 'Utilisateur standard pouvant échanger sur la plateforme'],
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(
                ['name' => $role['name']],
                ['description' => $role['description']]
            );
        }
    }
}
