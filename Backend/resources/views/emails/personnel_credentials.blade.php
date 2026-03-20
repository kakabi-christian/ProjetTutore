<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 600px; margin: auto; }
        .header { background-color: #007bff; color: white; padding: 10px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .credentials { background: #fff; padding: 15px; border: 1px dashed #007bff; margin: 15px 0; }
        .footer { font-size: 0.8em; color: #777; text-align: center; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Bienvenue parmi nous !</h1>
        </div>
        <div class="content">
            <p>Bonjour <strong>{{ $personnel->nom_pers }}</strong>,</p>
            <p>Votre compte personnel a été créé avec succès dans le système de suivi académique.</p>
            <p>Voici vos accès confidentiels :</p>
            
            <div class="credentials">
                <p><strong>Identifiant (Email) :</strong> {{ $personnel->login_pers }}</p>
                <p><strong>Mot de passe :</strong> {{ $plainPassword }}</p>
            </div>

            <p>Par mesure de sécurité, nous vous conseillons de modifier ce mot de passe dès votre première connexion.</p>
        </div>
        <div class="footer">
            Ceci est un message automatique de la plateforme. Merci de ne pas y répondre.
        </div>
    </div>
</body>
</html>