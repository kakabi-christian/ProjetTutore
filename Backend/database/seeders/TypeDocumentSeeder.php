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
            ['name' => 'Carte d\'identit ou passeport', 'description' => 'Carte nationale d\'identité ou le passeport doit etre valide et lisible'],
            ['name' => 'Photo de profil', 'description' => 'Photo de profil claire et récente'],

        ];

        foreach ($types as $type) {
            TypeDocument::firstOrCreate(
                ['name' => $type['name']],
                ['description' => $type['description']]
            );
        }
    }
}
