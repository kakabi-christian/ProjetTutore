<?php

namespace App\Http\Controllers;

use App\Models\Ec;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log; 
use Barryvdh\DomPDF\Facade\Pdf;

class EcController extends Controller
{
    /**
     * Display a listing of the resource (PAGINATION).
     */
    public function index(Request $request)
    {
        Log::channel('audit')->info("Début de la récupération de la liste des ECs.", ['per_page' => $request->get('per_page')]);

        $perPage = $request->get('per_page', 10);
        $ecs = Ec::paginate($perPage);

        Log::channel('audit')->info("Liste des ECs récupérée avec succès.", ['total' => $ecs->total(), 'current_page' => $ecs->currentPage()]);

        return response()->json([
            'data' => $ecs->items(),
            'meta' => [
                'current_page' => $ecs->currentPage(),
                'per_page'     => $ecs->perPage(),
                'total'        => $ecs->total(),
                'last_page'    => $ecs->lastPage(),
            ],
        ], 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        Log::channel('audit')->info("Tentative de création d'un nouvel EC.", ['payload' => $request->except('image_ec')]);

        $validatedData = $request->validate([
            'code_ec' => 'required|min:5|string|unique:ecs,code_ec',
            'label_ec' => 'required|string',
            'desc_ec' => 'nullable|string',
            'nbh_ec' => 'required|integer|min:1',
            'nbc_ec' => 'required|integer|min:1',
            'code_ue' => 'required|exists:ues,code_ue',
            'image_ec' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        Log::channel('audit')->debug("Validation réussie pour la création de l'EC.");

        if ($request->hasFile('image_ec')) {
            $path = $request->file('image_ec')->store('ecs', 'public');
            $validatedData['image_ec'] = $path;
            Log::channel('audit')->info("Image téléchargée avec succès pour le nouvel EC.", ['path' => $path]);
        }

        $ec = Ec::create($validatedData);

        Log::channel('audit')->notice("EC créé avec succès dans la base de données.", ['id' => $ec->id, 'code_ec' => $ec->code_ec]);

        return response()->json([
            'message' => 'EC créé avec succès',
            'data' => $ec
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        Log::channel('audit')->info("Recherche de l'EC ID: $id");

        $ec = Ec::find($id);

        if (!$ec) {
            Log::channel('audit')->warning("Échec de la récupération : EC ID $id introuvable.");
            return response()->json([
                'message' => 'EC introuvable'
            ], 404);
        }

        Log::channel('audit')->info("EC ID $id récupéré avec succès.");

        return response()->json([
            'data' => $ec
        ], 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        Log::channel('audit')->info("Tentative de mise à jour de l'EC ID: $id");

        $ec = Ec::find($id);

        if (!$ec) {
            Log::channel('audit')->error("Mise à jour avortée : EC ID $id introuvable.");
            return response()->json([
                'message' => 'EC introuvable'
            ], 404);
        }

        $validatedData = $request->validate([
            'code_ec'  => 'sometimes|min:5|string|unique:ecs,code_ec,' . $id . ',code_ec',
            'label_ec' => 'sometimes|string',
            'desc_ec'  => 'nullable|string',
            'nbh_ec'   => 'sometimes|integer|min:1',
            'nbc_ec'   => 'sometimes|integer|min:1',
            'code_ue'  => 'sometimes|exists:ues,code_ue',
            'image_ec' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        if ($request->hasFile('image_ec')) {
            if ($ec->image_ec) {
                Log::channel('audit')->info("Suppression de l'ancienne image.", ['path' => $ec->image_ec]);
                Storage::disk('public')->delete($ec->image_ec);
            }

            $path = $request->file('image_ec')->store('ecs', 'public');
            $validatedData['image_ec'] = $path;
            Log::channel('audit')->info("Nouvelle image stockée.", ['path' => $path]);
        }

        $ec->update($validatedData);
        Log::channel('audit')->info("EC ID $id mis à jour avec succès.");

        return response()->json([
            'message' => 'EC mis à jour avec succès',
            'data' => $ec
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        Log::channel('audit')->info("Demande de suppression de l'EC ID: $id");

        $ec = Ec::find($id);

        if (!$ec) {
            Log::channel('audit')->warning("Suppression impossible : EC ID $id n'existe pas.");
            return response()->json([
                'message' => 'EC introuvable'
            ], 404);
        }

        if ($ec->image_ec) {
            Log::channel('audit')->info("Suppression du fichier image associé à l'EC.", ['path' => $ec->image_ec]);
            Storage::disk('public')->delete($ec->image_ec);
        }

        $ec->delete();
        Log::channel('audit')->notice("EC ID $id supprimé définitivement.");

        return response()->json([
            'message' => 'EC supprimé avec succès'
        ], 200);
    }

    /**
 * Télécharger l'image de l'EC sous format PDF.
 */
public function downloadImagePdf($id)
{
    $ec = Ec::find($id);

    if (!$ec || !$ec->image_ec) {
        Log::channel('audit')->warning("Tentative de téléchargement PDF échouée : Image ou EC ID $id introuvable.");
        return response()->json(['message' => 'Image introuvable pour cet EC'], 404);
    }

    Log::channel('audit')->info("Génération du PDF pour l'image de l'EC : {$ec->code_ec}");

    // Préparation des données pour la vue
    $data = [
        'ec' => $ec,
        'imagePath' => $ec->image_ec
    ];

    // Génération du PDF
    $pdf = Pdf::loadView('pdfs.ec_image', $data);

    // Retourne le fichier en téléchargement
    return $pdf->download('image_ec_' . $ec->code_ec . '.pdf');
}
}