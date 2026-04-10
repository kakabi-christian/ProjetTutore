<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Service Flutterwave
 * Ref complète : https://developer.flutterwave.com/reference
 */
class FlutterwaveService
{
    protected string $baseUrl;
    protected string $secretKey;
    protected string $publicKey;
    protected bool $isLocal;

    protected int $cacheDuration = 86400;

    public function __construct()
    {
        $this->baseUrl   = config('flutterwave.baseUrl');
        $this->secretKey = config('flutterwave.secretKey');
        $this->publicKey = config('flutterwave.publicKey');

        // En local on désactive la vérification SSL (cURL échoue sinon)
        $this->isLocal = app()->environment(['local', 'development']);
    }

    /**
     * Retourne un client Http pré-configuré.
     * En local : SSL désactivé. En prod : SSL activé.
     */
    private function http(): \Illuminate\Http\Client\PendingRequest
    {
        $client = Http::withToken($this->secretKey)->timeout(30);

        if ($this->isLocal) {
            $client = $client->withoutVerifying();
        }

        return $client;
    }

    // ===========================================================
    // 1. DONNÉES STATIQUES (avec cache)
    // ===========================================================

    /**
     * Réseaux Mobile Money par pays.
     * Ref: https://developer.flutterwave.com/reference/endpoints/misc#get-all-mobile-money-networks
     */
    public function getMobileNetworks(string $countryCode): array
    {
        $cacheKey = 'flw_networks_'.strtolower($countryCode);

        return Cache::remember($cacheKey, $this->cacheDuration, function () use ($countryCode) {
            try {
                $response = $this->http()->get("{$this->baseUrl}/mobile-networks", [
                    'country' => $countryCode,
                ]);

                $data = $response->json();

                if ($response->failed() || ($data['status'] ?? '') !== 'success') {
                    Log::error("FlutterwaveService@getMobileNetworks: Échec", [
                        'status' => $response->status(),
                        'body'   => $data,
                    ]);
                    return null;
                }

                return $data;

            } catch (Exception $e) {
                Log::emergency("FlutterwaveService@getMobileNetworks: Exception", [
                    'msg' => $e->getMessage(),
                ]);
                return null;
            }
        }) ?? ['status' => 'error', 'data' => [], 'message' => 'Réseaux mobiles indisponibles'];
    }

    /**
     * Banques par pays.
     * Ref: https://developer.flutterwave.com/reference/endpoints/misc#get-all-banks
     */
    public function getBanks(string $countryCode): array
    {
        $cacheKey = 'flw_banks_'.strtolower($countryCode);

        return Cache::remember($cacheKey, $this->cacheDuration, function () use ($countryCode) {
            try {
                $response = $this->http()->get("{$this->baseUrl}/banks/{$countryCode}");

                $data = $response->json();

                if ($response->failed() || ($data['status'] ?? '') !== 'success') {
                    Log::error("FlutterwaveService@getBanks: Échec", [
                        'status' => $response->status(),
                        'body'   => $data,
                    ]);
                    return null;
                }

                return $data;

            } catch (Exception $e) {
                Log::critical("FlutterwaveService@getBanks: Exception", [
                    'msg' => $e->getMessage(),
                ]);
                return null;
            }
        }) ?? ['status' => 'error', 'data' => [], 'message' => 'Banques indisponibles'];
    }

    // ===========================================================
    // 2. INITIALISATION DU PAIEMENT
    // Ref: https://developer.flutterwave.com/reference/endpoints/payments#initiate-payment
    // ===========================================================

    /**
     * Initialise un paiement et retourne le lien Flutterwave.
     *
     * @param  array $data
     * @return array ['success' => bool, 'payment_link' => string|null, 'message' => string]
     */
    public function initializePayment(array $data): array
    {
        Log::info("FlutterwaveService@initializePayment: Début", [
            'tx_ref'   => $data['tx_ref'],
            'amount'   => $data['amount'],
            'currency' => $data['currency'],
        ]);

        try {
            $payload = [
                'tx_ref'          => $data['tx_ref'],
                'amount'          => $data['amount'],
                'currency'        => $data['currency'],
                'redirect_url'    => $data['redirect_url'],
                'payment_options' => $data['payment_options'] ?? 'mobilemoney,card',
                'customer'        => [
                    'email' => $data['customer_email'],
                    'name'  => $data['customer_name'],
                ],
                'customizations' => [
                    'title'       => 'ExchaPay',
                    'description' => $data['description'] ?? 'Échange de devises sécurisé',
                ],
                'meta' => $data['meta'] ?? [],
            ];

            Log::debug("FlutterwaveService@initializePayment: Payload envoyé", $payload);

            // POST /v3/payments
            // Ref: https://developer.flutterwave.com/reference/endpoints/payments#initiate-payment
            $response = $this->http()->post("{$this->baseUrl}/payments", $payload);

            $responseData = $response->json();

            Log::debug("FlutterwaveService@initializePayment: Réponse Flutterwave", [
                'http_status' => $response->status(),
                'flw_status'  => $responseData['status'] ?? null,
                'flw_message' => $responseData['message'] ?? null,
                'has_link'    => isset($responseData['data']['link']),
            ]);

            if ($response->failed() || ($responseData['status'] ?? '') !== 'success') {
                Log::error("FlutterwaveService@initializePayment: Réponse KO", [
                    'http_status' => $response->status(),
                    'body'        => $responseData,
                ]);

                return [
                    'success'      => false,
                    'payment_link' => null,
                    'message'      => $responseData['message'] ?? 'Erreur Flutterwave inconnue',
                ];
            }

            return [
                'success'      => true,
                'payment_link' => $responseData['data']['link'],
                'message'      => 'Lien généré avec succès',
            ];

        } catch (Exception $e) {
            // C'est ici que tombe l'erreur SSL ou timeout
            Log::emergency("FlutterwaveService@initializePayment: EXCEPTION", [
                'message' => $e->getMessage(),
                'class'   => get_class($e),
                'file'    => $e->getFile(),
                'line'    => $e->getLine(),
            ]);

            return [
                'success'      => false,
                'payment_link' => null,
                // On expose le vrai message pour t'aider à déboguer
                'message'      => 'Exception: ' . $e->getMessage(),
            ];
        }
    }

    // ===========================================================
    // 3. VÉRIFICATION DE TRANSACTION
    // Ref: https://developer.flutterwave.com/reference/endpoints/transactions#verify-a-transaction
    // ===========================================================

    /**
     * Vérifie une transaction par son ID Flutterwave.
     * TOUJOURS appeler cette méthode côté backend avant de finaliser.
     *
     * @param  string $flwTransactionId
     * @return array ['success' => bool, 'data' => array|null, 'message' => string]
     */
    public function verifyTransaction(string $flwTransactionId): array
    {
        Log::info("FlutterwaveService@verifyTransaction: Vérification", [
            'flw_transaction_id' => $flwTransactionId,
        ]);

        try {
            // GET /v3/transactions/{id}/verify
            $response = $this->http()->get("{$this->baseUrl}/transactions/{$flwTransactionId}/verify");

            $responseData = $response->json();

            if ($response->failed() || ($responseData['status'] ?? '') !== 'success') {
                Log::error("FlutterwaveService@verifyTransaction: Échec", [
                    'flw_id'  => $flwTransactionId,
                    'message' => $responseData['message'] ?? 'Inconnu',
                ]);

                return [
                    'success' => false,
                    'data'    => null,
                    'message' => $responseData['message'] ?? 'Vérification échouée',
                ];
            }

            $txData = $responseData['data'];

            Log::info("FlutterwaveService@verifyTransaction: OK", [
                'flw_id' => $flwTransactionId,
                'status' => $txData['status'],
                'amount' => $txData['amount'],
                'tx_ref' => $txData['tx_ref'],
            ]);

            return [
                'success' => true,
                'data'    => $txData,
                'message' => 'Vérification réussie',
            ];

        } catch (Exception $e) {
            Log::emergency("FlutterwaveService@verifyTransaction: EXCEPTION", [
                'message' => $e->getMessage(),
                'class'   => get_class($e),
            ]);

            return [
                'success' => false,
                'data'    => null,
                'message' => 'Exception: ' . $e->getMessage(),
            ];
        }
    }
}
