<?php

namespace App\Http\Controllers;

use App\Models\Programmation;
use Illuminate\Http\Request;

class ProgrammationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $programmations = Programmation::all();
        return response()->json(['data' => $programmations], 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validateData = $request->validate([
            'code_ec'      => 'required|exists:ecs,code_ec',
            'num_salle'    => 'required|exists:salles,num_salle',
            'code_pers'    => 'required|exists:personnels,code_pers',
            'date'         => 'required|date',
            'heure_debut'  => 'required|date_format:H:i',
            'heure_fin'    => 'required|date_format:H:i|after:heure_debut',
            'nbre_heure'   => 'required|integer|min:1',
            'status'       => 'required|string|in:Programmé,Annulé,Terminé',
        ]);

        $programmation = Programmation::create($validateData);

        return response()->json([
            'message' => 'Programmation créée avec succès',
            'data' => $programmation
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $programmation = Programmation::find($id);

        if (!$programmation) {
            return response()->json(['message' => 'Programmation introuvable'], 404);
        }

        return response()->json(['data' => $programmation], 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $programmation = Programmation::find($id);

        if (!$programmation) {
            return response()->json(['message' => 'Programmation introuvable'], 404);
        }

        $validateData = $request->validate([
            'code_ec'      => 'sometimes|exists:ecs,code_ec',
            'num_salle'    => 'sometimes|exists:salles,num_salle',
            'code_pers'    => 'sometimes|exists:personnels,code_pers',
            'date'         => 'sometimes|date',
            'heure_debut'  => 'sometimes|date_format:H:i',
            'heure_fin'    => 'sometimes|date_format:H:i|after:heure_debut',
            'nbre_heure'   => 'sometimes|integer|min:1',
            'status'       => 'sometimes|string|in:Programmé,Annulé,Terminé',
        ]);

        $programmation->update($validateData);

        return response()->json([
            'message' => 'Programmation mise à jour avec succès',
            'data' => $programmation
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $programmation = Programmation::find($id);

        if (!$programmation) {
            return response()->json(['message' => 'Programmation introuvable'], 404);
        }

        $programmation->delete();

        return response()->json(['message' => 'Programmation supprimée avec succès'], 200);
    }
}
