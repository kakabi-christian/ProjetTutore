<?php

namespace Database\Seeders;

use App\Models\TypeDocument;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
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
            ['name' => 'Passeport', 'description' => 'Passeport en cours de validité'],
            ['name' => 'Permis de conduire', 'description' => 'Permis de conduire valide'],
            ['name' => 'Justificatif de domicile', 'description' => 'Facture ou attestation de domicile de moins de 3 mois'],
            ['name' => 'Relevé bancaire', 'description' => 'Relevé de compte bancaire récent'],
        ];

        foreach ($types as $type) {
            TypeDocument::firstOrCreate(
                ['name' => $type['name']],
                ['description' => $type['description']]
            );
        }
    }
}
