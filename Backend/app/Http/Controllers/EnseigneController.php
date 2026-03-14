<?php

namespace App\Http\Controllers;

use App\Models\Enseigne;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log; // ✅ Import indispensable

class EnseigneController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        Log::channel('audit')->info("Consultation de la liste des affectations (Enseignes).");
        
        $enseignes = Enseigne::with(['personnel', 'ec'])->get();
        return response()->json(['data' => $enseignes], 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        Log::channel('audit')->info("Tentative de création d'une affectation.", $request->all());

        $validateData = $request->validate([
            'code_pers' => 'required|exists:personnels,code_pers',
            'code_ec'   => 'required|exists:ecs,code_ec',
            'date_ens'  => 'required|date',
        ]);

        // Vérifie si la combinaison existe déjà
        $exists = Enseigne::where('code_pers', $validateData['code_pers'])
                          ->where('code_ec', $validateData['code_ec'])
                          ->first();

        if ($exists) {
            Log::channel('audit')->warning("Échec création affectation : Doublon détecté.", $validateData);
            return response()->json(['message' => 'Cette affectation existe déjà'], 409);
        }

        // Crée l'enseigne avec UUID généré automatiquement
        $enseigne = Enseigne::create($validateData);

        Log::channel('audit')->notice("Nouvelle affectation créée avec succès.", [
            'id' => $enseigne->id,
            'code_pers' => $enseigne->code_pers,
            'code_ec' => $enseigne->code_ec
        ]);

        return response()->json([
            'message' => 'Enseigne créée avec succès',
            'data' => $enseigne
        ], 201);
    }

    /**
     * Display the specified resource by id.
     */
    public function show($id)
    {
        $enseigne = Enseigne::with(['personnel', 'ec'])->find($id);

        if (!$enseigne) {
            Log::channel('audit')->warning("Consultation affectation : ID $id introuvable.");
            return response()->json(['message' => 'Enseigne introuvable'], 404);
        }

        return response()->json(['data' => $enseigne], 200);
    }

    /**
     * Update the specified resource in storage by id.
     */
    public function update(Request $request, $id)
    {
        Log::channel('audit')->info("Tentative de mise à jour de l'affectation ID $id.");

        $enseigne = Enseigne::find($id);

        if (!$enseigne) {
            Log::channel('audit')->error("Mise à jour affectation : ID $id introuvable.");
            return response()->json(['message' => 'Enseigne introuvable'], 404);
        }

        $validateData = $request->validate([
            'date_ens' => 'sometimes|date',
        ]);

        $enseigne->update($validateData);

        Log::channel('audit')->info("Affectation ID $id mise à jour avec succès.");

        return response()->json([
            'message' => 'Enseigne mise à jour avec succès',
            'data' => $enseigne
        ], 200);
    }

    /**
     * Remove the specified resource from storage by id.
     */
    public function destroy($id)
    {
        Log::channel('audit')->info("Demande de suppression de l'affectation ID $id.");

        $enseigne = Enseigne::find($id);

        if (!$enseigne) {
            Log::channel('audit')->warning("Suppression affectation : ID $id introuvable.");
            return response()->json(['message' => 'Enseigne introuvable'], 404);
        }

        $enseigne->delete();

        Log::channel('audit')->notice("Affectation ID $id supprimée.");

        return response()->json(['message' => 'Enseigne supprimée avec succès'], 200);
    }
}