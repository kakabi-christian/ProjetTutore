<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { width: 80%; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; }
        .otp-box { 
            font-size: 28px; 
            font-weight: bold; 
            color: #e74c3c; 
            padding: 15px; 
            background: #f9f9f9; 
            text-align: center;
            border-radius: 5px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Récupération de compte ExchaPay</h2>
        <p>Bonjour {{ $name }},</p>
        <p>Vous avez demandé la réinitialisation de votre mot de passe. Veuillez utiliser le code suivant :</p>
        
        <div class="otp-box">{{ $otp }}</div>
        
        <p>Ce code est temporaire. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>
        <p>L'équipe ExchaPay.</p>
    </div>
</body>
</html>