<?php

namespace App\Exports;

use App\Models\Filiere;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings; // On ajoute cette interface
use Maatwebsite\Excel\Concerns\ShouldAutoSize; // Pour que les colonnes s'ajustent automatiquement

class FilieresExport implements FromCollection, WithHeadings, ShouldAutoSize
{
    /**
    * @return \Illuminate\Support\Collection
    */
    public function collection()
    {
        // On sélectionne uniquement les colonnes importantes
        return Filiere::select('code_filiere', 'label_filiere', 'desc_filiere')->get();
    }

    /**
     * Ajoute des en-têtes en haut du fichier Excel
     */
    public function headings(): array
    {
        return [
            'Code Filière',
            'Libellé / Nom',
            'Description'
        ];
    }
}