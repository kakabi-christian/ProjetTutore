{{-- Admin Created Mail --}}
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
        .info-box { background-color: #f8f9fa; border: 1px solid #e9ecef; padding: 20px; border-radius: 8px; margin: 25px 0; }
        .info-line { margin-bottom: 10px; font-size: 16px; }
        .info-label { font-weight: bold; color: #555; width: 100px; display: inline-block; }
        .password-text { color: #ff6b2b; font-weight: bold; font-family: monospace; font-size: 18px; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #777; border-top: 1px solid #eee; }
        .btn { background-color: #ff6b2b; color: white !important; padding: 14px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; margin-top: 10px; }
        .warning { font-size: 13px; color: #856404; background-color: #fff3cd; padding: 10px; border-radius: 4px; border-left: 4px solid #ffeeba; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>ExchaPay</h1>
            <p>Accès Collaborateur</p>
        </div>
        
        <div class="content">
            <h3>Bienvenue, {{ $user->firstname }} !</h3>
            
            <p>Un compte administrateur vient de vous être créé sur la plateforme <strong>ExchaPay</strong>. Vous pouvez désormais accéder au tableau de bord de gestion.</p>
            
            <div class="info-box">
                <div class="info-line">
                    <span class="info-label">Email :</span> 
                    <strong>{{ $user->email }}</strong>
                </div>
                <div class="info-line">
                    <span class="info-label">Pass :</span> 
                    <span class="password-text">{{ $password }}</span>
                </div>
            </div>

            <div class="warning">
                ⚠️ Par mesure de sécurité, nous vous recommandons de modifier ce mot de passe dès votre première connexion dans les paramètres de votre profil.
            </div>

            <div style="text-align: center; margin-top: 35px;">
                <a href="{{ config('app.url') }}/login" class="btn">Se connecter à l'administration</a>
            </div>
        </div>

        <div class="footer">
            <strong>ExchaPay Cameroon</strong> <br>
            Village-Elf, Douala, Cameroun <br><br>
            © 2026 ExchaPay. Tous droits réservés. <br>
            <span style="font-style: italic;">Ceci est un message de sécurité confidentiel.</span>
        </div>
    </div>
</body>
</html>