<?php

namespace App\Http\Controllers;

use App\Models\Personnel;
use App\Mail\PersonnelCredentialsMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class PersonnelController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $personnels = Personnel::all();
        return response()->json(['data' => $personnels], 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validateData = $request->validate([
            'code_pers'  => 'required|unique:personnels,code_pers|string',
            'nom_pers'   => 'required|string',
            'sexe_pers'  => 'required|string|in:Masculin,Feminin',
            'phone_pers' => 'required|string|unique:personnels,phone_pers',
            'login_pers' => 'required|string|unique:personnels,login_pers', // Doit être un email valide pour Gmail
            'pwd_pers'   => 'required|string',
            'type_pers'  => 'required|string', 
        ]);

        // 1. Sauvegarder le mot de passe en clair pour l'email
        $plainPassword = $validateData['pwd_pers'];

        // 2. Hacher le mot de passe pour la sécurité de la base de données
        $validateData['pwd_pers'] = Hash::make($plainPassword);

        // 3. Créer le personnel dans la DB
        $personnel = Personnel::create($validateData);

        // 4. Envoyer l'email avec les identifiants
        try {
            Mail::to($personnel->login_pers)->send(new PersonnelCredentialsMail($personnel, $plainPassword));
        } catch (\Exception $e) {
            // On enregistre l'erreur dans les logs mais on ne bloque pas la réponse
            Log::error("Erreur d'envoi d'email au personnel : " . $e->getMessage());
        }

        return response()->json([
            'message' => 'Personnel créé avec succès et email envoyé',
            'data' => $personnel
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $personnel = Personnel::find($id);

        if (!$personnel) {
            return response()->json(['message' => 'Personnel introuvable'], 404);
        }

        return response()->json(['data' => $personnel], 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $personnel = Personnel::find($id);

        if (!$personnel) {
            return response()->json(['message' => 'Personnel introuvable'], 404);
        }

        $validateData = $request->validate([
            'code_pers'  => 'sometimes|string|unique:personnels,code_pers,' . $id . ',id',
            'nom_pers'   => 'sometimes|string',
            'sexe_pers'  => 'sometimes|string|in:Masculin,Feminin',
            'phone_pers' => 'sometimes|string|unique:personnels,phone_pers,' . $id . ',id',
            'login_pers' => 'sometimes|string|unique:personnels,login_pers,' . $id . ',id',
            'pwd_pers'   => 'sometimes|string',
            'type_pers'  => 'sometimes|string', 
        ]);

        if (isset($validateData['pwd_pers'])) {
            $validateData['pwd_pers'] = Hash::make($validateData['pwd_pers']);
        }

        $personnel->update($validateData);

        return response()->json([
            'message' => 'Personnel mis à jour avec succès',
            'data' => $personnel
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $personnel = Personnel::find($id);

        if (!$personnel) {
            return response()->json(['message' => 'Personnel introuvable'], 404);
        }

        $personnel->delete();

        return response()->json(['message' => 'Personnel supprimé avec succès'], 200);
    }
}