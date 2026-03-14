<?php

namespace App\Http\Controllers;

use App\Models\Filiere;
use Illuminate\Http\Request;
use OpenApi\Annotations as OA;
use Illuminate\Support\Facades\Log;
// ✅ Nouveaux imports pour l'exportation
use App\Exports\FilieresExport;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;

class FiliereController extends Controller
{
    public function index(Request $request)
    {
        Log::channel('audit')->info("Consultation de la liste des filières.", ['per_page' => $request->query('per_page')]);

        $perPage = $request->query('per_page', 5);
        $filieres = Filiere::paginate($perPage);

        return response()->json([
            'filieres' => $filieres->items(),
            'pagination' => [
                'current_page' => $filieres->currentPage(),
                'last_page' => $filieres->lastPage(),
                'per_page' => $filieres->perPage(),
                'total' => $filieres->total(),
            ]
        ], 200);
    }

    public function store(Request $request)
    {
        Log::channel('audit')->info("Tentative de création d'une filière.", $request->all());

        $validateData = $request->validate([
            'code_filiere' => 'required|min:5|string|unique:filieres,code_filiere',
            'label_filiere' => 'required|min:5|string',
            'desc_filiere' => 'nullable|string'
        ]);

        $res = Filiere::create($validateData);

        Log::channel('audit')->notice("Filière créée avec succès.", ['code' => $res->code_filiere]);

        return response()->json([
            'message' => 'Filiere créée avec succès',
            'data' => $res
        ], 201);
    }

    public function show(Filiere $filiere)
    {
        Log::channel('audit')->info("Consultation de la filière : " . $filiere->code_filiere);
        return response()->json($filiere, 200);
    }

    public function update(Request $request, Filiere $filiere)
    {
        Log::channel('audit')->info("Tentative de mise à jour de la filière : " . $filiere->code_filiere);

        $data = $request->validate([
            'label_filiere' => 'sometimes|required|min:5|string',
            'desc_filiere' => 'sometimes|nullable|string'
        ]);

        $filiere->update($data);

        Log::channel('audit')->info("Filière mise à jour avec succès.", ['code' => $filiere->code_filiere]);

        return response()->json(['message' => 'Filiere mise à jour', 'data' => $filiere], 200);
    }

    public function destroy(string $code_filiere)
    {
        try {
            Log::channel('audit')->info("Demande de suppression de la filière : $code_filiere");
            
            $filiere = Filiere::findOrFail($code_filiere);
            $filiere->delete();
            
            Log::channel('audit')->notice("Filière supprimée : $code_filiere");
            
            return response()->json(["message" => "Suppression réussie"], 200);
        } catch (\Throwable $th) {
            Log::channel('audit')->warning("Échec suppression : Filière $code_filiere non trouvée.");
            return response()->json(['message' => "Filiere non trouvée"], 404);
        }
    }
    
    public function search(Request $request)
    {
        $query = $request->input('q');

        Log::channel('audit')->info("Recherche de filières avec le terme : '$query'");

        if (!$query) {
            return response()->json(['message' => 'Aucun terme de recherche fourni'], 422);
        }

        $filieres = Filiere::where('label_filiere', 'like', "%$query%")
            ->orWhere('desc_filiere', 'like', "%$query%")
            ->get();

        if ($filieres->isEmpty()) {
            Log::channel('audit')->info("Recherche : Aucun résultat pour '$query'");
            return response()->json(['message' => 'Aucune filiere trouvée'], 404);
        }

        return response()->json($filieres, 200);
    }

    /**
     * ✅ EXPORT PDF : Génère le PDF à partir de la vue Blade
     */
    public function exportPdf()
    {
        Log::channel('audit')->info("Exportation de la liste des filières en PDF.");
        
        $filieres = Filiere::all();
        $pdf = Pdf::loadView('exports.filieres_pdf', compact('filieres'));
        
        return $pdf->download('liste_filieres.pdf');
    }

    /**
     * ✅ EXPORT EXCEL : Utilise la classe FilieresExport
     */
    public function exportExcel()
    {
        Log::channel('audit')->info("Exportation de la liste des filières en Excel.");
        
        return Excel::download(new FilieresExport, 'liste_filieres.xlsx');
    }
}