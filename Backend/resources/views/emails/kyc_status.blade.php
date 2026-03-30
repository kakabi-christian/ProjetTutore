<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { width: 100%; max-width: 600px; margin: 20px auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { background-color: #0A2540; color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; letter-spacing: 1px; }
        .header p { margin: 5px 0 0; opacity: 0.8; font-size: 14px; }
        .content { padding: 40px; background-color: #ffffff; }
        .status-badge { display: inline-block; padding: 12px 24px; border-radius: 8px; font-weight: bold; color: white; margin-bottom: 25px; font-size: 16px; }
        .approved { background-color: #28a745; }
        .rejected { background-color: #ff6b2b; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #777; border-top: 1px solid #eee; }
        .btn { background-color: #ff6b2b; color: white !important; padding: 14px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; }
        blockquote { background: #fff5f2; border-left: 5px solid #ff6b2b; padding: 15px; font-style: italic; margin: 20px 0; color: #555; border-radius: 0 8px 8px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>ExchaPay</h1>
            <p>Plateforme de Vérification</p>
        </div>
        
        <div class="content">
            <h3>Bonjour {{ $userName }},</h3>
            
            @if($status === 'APPROVED')
                <div class="status-badge approved">Dossier Validé ✅</div>
                <p>Nous avons le plaisir de vous informer que votre dossier de vérification d'identité (KYC) a été <strong>approuvé</strong> avec succès.</p>
                <p>Toutes les limites de votre compte ont été levées. Vous pouvez désormais profiter pleinement de l'expérience ExchaPay.</p>
            @else
                <div class="status-badge rejected">Dossier Rejeté ❌</div>
                <p>Après examen de vos documents, notre équipe de conformité n'a pas pu valider votre KYC pour la raison suivante :</p>
                
                <blockquote>
                    "{{ $reason }}"
                </blockquote>
                
                <p>Ne vous inquiétez pas, vous pouvez soumettre de nouveaux documents directement depuis votre tableau de bord en suivant nos recommandations.</p>
            @endif

            <div style="text-align: center; margin-top: 35px;">
                <a href="{{ config('app.url') }}" class="btn">Accéder à mon compte</a>
            </div>
        </div>

        <div class="footer">
            <strong>ExchaPay Cameroon</strong> <br>
            Village-Elf, Douala, Cameroun <br><br>
            © 2026 ExchaPay. Tous droits réservés. <br>
            <span style="font-style: italic;">Ceci est un message automatique, merci de ne pas y répondre directement.</span>
        </div>
    </div>
</body>
</html>