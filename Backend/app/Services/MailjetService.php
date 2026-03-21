<?php

namespace App\Services;

use Mailjet\Client;
use Mailjet\Resources;
use Illuminate\Support\Facades\Log;

class MailjetService
{
    protected $client;

    public function __construct()
    {
        $key = config('services.mailjet.key');
        $secret = config('services.mailjet.secret');

        // Initialisation avec le timeout de l'exemple pour éviter les coupures
        $this->client = new Client($key, $secret, false, ['version' => 'v3.1']);
    }

    /**
     * Cette méthode est celle que tu appelles dans ton RegisterController
     */
    public function sendOTP($to, $name, $code)
    {
        Log::info("🚀 [OTP] Préparation de l'envoi pour : $to");

        $subject = "🔐 Code de vérification - ExchaPay";
        $htmlContent = "
            <div style='font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;'>
                <h2 style='color: #2c3e50;'>Bienvenue Christian !</h2>
                <p>Voici votre code de validation pour finaliser votre inscription :</p>
                <div style='font-size: 24px; font-weight: bold; color: #3498db; padding: 10px; background: #f9f9f9; display: inline-block; border-radius: 4px;'>
                    {$code}
                </div>
                <p>Ce code est valable pendant 10 minutes.</p>
                <hr style='border: none; border-top: 1px solid #eee;' />
                <small style='color: #7f8c8d;'>ExchaPay - Sécurité des transactions</small>
            </div>";

        return $this->sendEmail($to, $name, $subject, $htmlContent);
    }

    private function sendEmail($toEmail, $toName, $subject, $htmlContent)
    {
        $body = [
            'Messages' => [
                [
                    'From' => [
                        'Email' => config('mail.from.address'),
                        'Name' => config('mail.from.name')
                    ],
                    'To' => [
                        [
                            'Email' => $toEmail,
                            'Name' => $toName
                        ]
                    ],
                    'Subject' => $subject,
                    'HTMLPart' => $htmlContent,
                ]
            ]
        ];

        try {
            $response = $this->client->post(Resources::$Email, ['body' => $body]);

            if ($response->success()) {
                Log::info("✅ [SUCCÈS] Email envoyé à $toEmail");
                return true;
            }

            // Log détaillé comme dans l'exemple qui marche
            Log::error("❌ [API ERROR] Mailjet a rejeté la requête", [
                'status' => $response->getStatus(),
                'cause' => $response->getData()
            ]);
            return false;

        } catch (\Exception $e) {
            Log::error("❌ [EXCEPTION] Échec critique : " . $e->getMessage());
            return false;
        }
    }
}