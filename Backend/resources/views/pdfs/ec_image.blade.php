<!DOCTYPE html>
<html>
<head>
    <title>Image de l'EC</title>
    <style>
        body { font-family: sans-serif; text-align: center; }
        .header { margin-bottom: 20px; }
        img { max-width: 100%; height: auto; border: 1px solid #ddd; }
        .footer { margin-top: 20px; font-size: 12px; color: #555; }
    </style>
</head>
<body>
    <div class="header">
        <h2>Élément Constitutif : {{ $ec->label_ec }}</h2>
        <p>Code : {{ $ec->code_ec }}</p>
    </div>

    @if($imagePath)
        {{-- On utilise le chemin absolu pour DomPDF --}}
        <img src="{{ public_path('storage/' . $ec->image_ec) }}" alt="Image EC">
    @else
        <p>Aucune image disponible pour cet EC.</p>
    @endif

    <div class="footer">
        Généré le {{ now()->format('d/m/Y H:i') }}
    </div>
</body>
</html>