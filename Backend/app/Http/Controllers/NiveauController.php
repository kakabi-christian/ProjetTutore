<?php

namespace App\Http\Controllers;

use App\Models\Niveau;
use Illuminate\Http\Request;

class NiveauController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $niveaux = Niveau::all();
        return response()->json(['data' => $niveaux], 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validateData = $request->validate([
            'label_niveau' => 'required|min:5|string',
            'desc_niveau' => 'nullable|string',
            'code_filiere' => 'required|min:5|string|exists:filieres,code_filiere'
        ]);

        $niveau = Niveau::create($validateData);

        return response()->json([
            'message' => 'Niveau créé avec succès',
            'data' => $niveau
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $niveau = Niveau::find($id);

        if (!$niveau) {
            return response()->json(['message' => 'Niveau introuvable'], 404);
        }

        return response()->json(['data' => $niveau], 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $niveau = Niveau::find($id);

        if (!$niveau) {
            return response()->json(['message' => 'Niveau introuvable'], 404);
        }

        $validateData = $request->validate([
            'label_niveau' => 'sometimes|string|min:5',
            'desc_niveau' => 'nullable|string',
            'code_filiere' => 'sometimes|string|exists:filieres,code_filiere'
        ]);

        $niveau->update($validateData);

        return response()->json([
            'message' => 'Niveau mis à jour avec succès',
            'data' => $niveau
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $niveau = Niveau::find($id);

        if (!$niveau) {
            return response()->json(['message' => 'Niveau introuvable'], 404);
        }

        $niveau->delete();

        return response()->json(['message' => 'Niveau supprimé avec succès'], 200);
    }
}
