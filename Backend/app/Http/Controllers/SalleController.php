<?php

namespace App\Http\Controllers;

use App\Models\Salle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log; // ✅ Import pour le canal audit

class SalleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        Log::channel('audit')->info("Consultation de la liste des salles.");
        
        $salles = Salle::all();
        return response()->json(['data' => $salles], 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        Log::channel('audit')->info("Tentative de création d'une nouvelle salle.", $request->all());

        $validateData = $request->validate([
            'num_salle' => 'required|min:5|string|unique:salles,num_salle',
            'contenance' => 'required|integer|min:20',
            'status' => 'required|string|in:Disponible,Indisponible',
        ]);

        $salle = Salle::create($validateData);

        Log::channel('audit')->notice("Salle créée avec succès.", [
            'id' => $salle->id,
            'num_salle' => $salle->num_salle
        ]);

        return response()->json([
            'message' => 'Salle créée avec succès',
            'data' => $salle
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $salle = Salle::find($id);

        if (!$salle) {
            Log::channel('audit')->warning("Consultation salle : ID $id introuvable.");
            return response()->json(['message' => 'Salle introuvable'], 404);
        }

        return response()->json(['data' => $salle], 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        Log::channel('audit')->info("Tentative de mise à jour de la salle ID: $id");

        $salle = Salle::find($id);

        if (!$salle) {
            Log::channel('audit')->error("Mise à jour salle : ID $id introuvable.");
            return response()->json(['message' => 'Salle introuvable'], 404);
        }

        $validateData = $request->validate([
            'num_salle' => 'sometimes|string|min:5|unique:salles,num_salle,' . $id . ',id',
            'contenance' => 'sometimes|integer|min:20',
            'status' => 'sometimes|string|in:Disponible,Indisponible',
        ]);

        $oldStatus = $salle->status;
        $salle->update($validateData);

        // Log spécifique si le statut de la salle change (ex: de Disponible à Indisponible)
        if (isset($validateData['status']) && $oldStatus !== $salle->status) {
            Log::channel('audit')->notice("Changement de statut pour la salle {$salle->num_salle}", [
                'ancien' => $oldStatus,
                'nouveau' => $salle->status
            ]);
        }

        Log::channel('audit')->info("Salle ID $id mise à jour avec succès.");

        return response()->json([
            'message' => 'Salle mise à jour avec succès',
            'data' => $salle
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Salle $salle)
    {
        $numSalle = $salle->num_salle;
        Log::channel('audit')->info("Demande de suppression de la salle : $numSalle");

        $salle->delete();

        Log::channel('audit')->notice("Salle supprimée définitivement : $numSalle");

        return response()->json([
            'message' => 'Salle supprimée avec succès'
        ], 200);
    }
}