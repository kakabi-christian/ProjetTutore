<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { width: 80%; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; }
        .header { text-align: center; margin-bottom: 20px; }
        .otp-code { 
            display: block; 
            width: fit-content; 
            margin: 20px auto; 
            padding: 15px 30px; 
            background-color: #f4f4f4; 
            border: 2px dashed #3498db; 
            font-size: 32px; 
            font-weight: bold; 
            color: #3498db; 
            letter-spacing: 5px;
        }
        .footer { font-size: 12px; color: #777; margin-top: 30px; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Bienvenue sur ExchaPay !</h2>
        </div>
        
        <p>Bonjour <strong>{{ $name }}</strong>,</p>
        
        <p>Merci de vous être inscrit sur notre plateforme. Pour finaliser la création de votre compte, veuillez utiliser le code de vérification suivant :</p>
        
        <span class="otp-code">{{ $otp }}</span>
        
        <p>Ce code est valable pendant <strong>10 minutes</strong>. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail.</p>
        
        <div class="footer">
            <p>&copy; {{ date('Y') }} ExchaPay - Votre solution d'échange de devises.</p>
        </div>
    </div>
</body>
</html>