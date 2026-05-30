<?php

namespace Database\Seeders;

use App\Models\TypeDocument;
use Illuminate\Database\Seeder;

class TypeDocumentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $types = [
            ['name' => 'Carte d\'identité', 'description' => 'Carte nationale d\'identité'],
            ['name' => 'Photo de profil', 'description' => 'Photo de profil en cours de validité'],
            
        ];

        foreach ($types as $type) {
            TypeDocument::firstOrCreate(
                ['name' => $type['name']],
                ['description' => $type['description']]
            );
        }
    }
}
