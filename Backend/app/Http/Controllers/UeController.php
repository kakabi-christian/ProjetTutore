<?php

namespace App\Http\Controllers;

use App\Models\Ue;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log; // ✅ Import indispensable

class UeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        Log::channel('audit')->info("Consultation de la liste des UEs.");
        
        $ues = Ue::all();

        return response()->json(['data' => $ues], 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        Log::channel('audit')->info("Tentative de création d'une nouvelle UE.", $request->all());

        $validateData = $request->validate([
            'code_ue' => 'required|min:5|string|unique:ues,code_ue',
            'label_ue' => 'required|min:5|string',
            'desc_ue' => 'nullable|string',
            'code_niveau' => 'required|exists:niveaux,code_niveau'
        ]);

        $ue = Ue::create($validateData);

        Log::channel('audit')->notice("UE créée avec succès.", [
            'id' => $ue->id,
            'code_ue' => $ue->code_ue,
            'label' => $ue->label_ue
        ]);

        return response()->json([
            'message' => 'UE créée avec succès',
            'data' => $ue
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $ue = Ue::find($id);

        if (!$ue) {
            Log::channel('audit')->warning("Consultation UE : ID $id introuvable.");
            return response()->json(['message' => 'UE introuvable'], 404);
        }

        Log::channel('audit')->info("Consultation des détails de l'UE: {$ue->code_ue}");

        return response()->json(['data' => $ue], 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        Log::channel('audit')->info("Tentative de mise à jour de l'UE ID: $id");

        $ue = Ue::find($id);

        if (!$ue) {
            Log::channel('audit')->error("Mise à jour UE échouée : ID $id introuvable.");
            return response()->json(['message' => 'UE introuvable'], 404);
        }

        $validateData = $request->validate([
            'code_ue' => 'sometimes|string|min:5|unique:ues,code_ue,' . $id . ',id',
            'label_ue' => 'sometimes|string|min:5',
            'desc_ue' => 'nullable|string',
            'code_niveau' => 'sometimes|exists:niveaux,code_niveau'
        ]);

        $ue->update($validateData);

        Log::channel('audit')->info("UE ID $id mise à jour avec succès.", ['code_ue' => $ue->code_ue]);

        return response()->json([
            'message' => 'UE mise à jour avec succès',
            'data' => $ue
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Ue $ue)
    {
        $codeUe = $ue->code_ue;
        Log::channel('audit')->info("Demande de suppression de l'UE : $codeUe");

        $ue->delete();

        Log::channel('audit')->notice("UE supprimée définitivement : $codeUe");

        return response()->json([
            'message' => 'UE supprimée avec succès'
        ], 200);
    }
}