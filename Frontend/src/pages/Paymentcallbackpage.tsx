import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { MdCheckCircle, MdCancel, MdHourglassTop } from "react-icons/md";
import api from "../services/api";

type CallbackStatus = "loading" | "success" | "failed" | "cancelled";

/**
 * Page de retour après paiement Flutterwave.
 *
 * Flutterwave redirige ici avec ces paramètres dans l'URL :
 *   ?tx_ref=EXCHA-X-XXXXX&status=successful&transaction_id=XXXXX
 *
 * Stratégie :
 *   1. Si ?status=cancelled dans l'URL → afficher annulé immédiatement, pas de polling
 *   2. Si ?status=successful → vérifier en DB (webhook peut avoir déjà mis à jour)
 *      - Si COMPLETED en DB → succès
 *      - Si encore PENDING → polling toutes les 3s, max MAX_RETRIES fois
 *      - Après MAX_RETRIES sans réponse → afficher succès optimiste
 *        (le webhook arrivera en arrière-plan)
 *   3. Si ?status=failed → afficher échec immédiatement
 *
 * Ref Flutterwave redirect params:
 * https://developer.flutterwave.com/docs/collecting-payments/standard#redirect-parameters
 */

const MAX_RETRIES = 8;    // ~24s max de polling (8 × 3s)
const RETRY_DELAY = 3000; // 3s entre chaque tentative

export default function PaymentCallbackPage() {
    const [searchParams] = useSearchParams();
    const navigate       = useNavigate();

    const [status, setStatus]         = useState<CallbackStatus>("loading");
    const [message, setMessage]       = useState("Vérification de votre paiement...");
    const [retryCount, setRetryCount] = useState(0);

    const retryRef = useRef(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Paramètres Flutterwave dans l'URL
    const txRef     = searchParams.get("tx_ref");
    const flwStatus = searchParams.get("status"); // "successful" | "cancelled" | "failed"

    // Nettoyage au démontage
    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    useEffect(() => {
        if (!txRef) {
            setStatus("failed");
            setMessage("Référence de transaction introuvable.");
            return;
        }

        // --- Cas 1 : Annulation directe depuis Flutterwave ---
        if (flwStatus === "cancelled") {
            setStatus("cancelled");
            setMessage("Vous avez annulé le paiement. Aucun montant n'a été débité.");
            return;
        }

        // --- Cas 2 : Échec déclaré par Flutterwave dans l'URL ---
        if (flwStatus === "failed") {
            setStatus("failed");
            setMessage("Le paiement a échoué. Veuillez réessayer.");
            return;
        }

        // --- Cas 3 : Flutterwave dit "successful" → vérifier en DB ---
        const checkDb = async () => {
            try {
                const response = await api.get(`/transactions/status?tx_ref=${txRef}`);
                const txStatus = response.data?.status;

                if (txStatus === "COMPLETED") {
                    setStatus("success");
                    setMessage("Votre paiement a été confirmé. L'échange est en cours de traitement.");
                    return;
                }

                if (txStatus === "CANCELLED") {
                    setStatus("cancelled");
                    setMessage("Cette transaction a été annulée.");
                    return;
                }

                // Toujours PENDING — le webhook n'est pas encore arrivé
                retryRef.current += 1;
                setRetryCount(retryRef.current);

                if (retryRef.current >= MAX_RETRIES) {
                    if (flwStatus === "successful") {
                        setStatus("success");
                        setMessage("Paiement reçu par Flutterwave. La confirmation finale sera traitée sous peu.");
                    } else {
                        setStatus("failed");
                        setMessage("Impossible de confirmer votre paiement. Contactez le support avec votre référence.");
                    }
                    return;
                }

                timerRef.current = setTimeout(checkDb, RETRY_DELAY);

            } catch {
                retryRef.current += 1;
                setRetryCount(retryRef.current);

                if (retryRef.current >= MAX_RETRIES) {
                    setStatus(flwStatus === "successful" ? "success" : "failed");
                    setMessage(
                        flwStatus === "successful"
                            ? "Paiement accepté par Flutterwave. Confirmation en attente."
                            : "Impossible de vérifier le paiement. Contactez le support."
                    );
                    return;
                }

                timerRef.current = setTimeout(checkDb, RETRY_DELAY);
            }
        };

        checkDb();
    }, [txRef, flwStatus]);

    // ----------------------------------------------------------------
    // Config UI par statut
    // ----------------------------------------------------------------
    const config = {
        loading: {
            icon:      <MdHourglassTop size={64} className="text-excha-orange" />,
            title:     "Vérification en cours",
            iconClass: "bg-excha-orange-subtle animate-pulse-icon",
            cardClass: "",
        },
        success: {
            icon:      <MdCheckCircle size={64} className="text-success" />,
            title:     "Paiement réussi !",
            iconClass: "bg-success-subtle animate-pop-in",
            cardClass: "",
        },
        failed: {
            icon:      <MdCancel size={64} className="text-danger" />,
            title:     "Paiement échoué",
            iconClass: "bg-danger-subtle animate-pop-in",
            cardClass: "",
        },
        cancelled: {
            icon:      <MdCancel size={64} className="text-secondary" />,
            title:     "Paiement annulé",
            iconClass: "bg-secondary-subtle animate-pop-in",
            cardClass: "",
        },
    }[status];

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-3">
            <div
                className="bg-white rounded-4 p-4 p-md-5 w-100 text-center shadow-sm"
                style={{ maxWidth: 420 }}
            >
                {/* Icône animée */}
                <div
                    className={`rounded-circle d-flex align-items-center justify-content-center mx-auto mb-4 ${config.iconClass}`}
                    style={{ width: 96, height: 96 }}
                >
                    {config.icon}
                </div>

                <h2 className="fw-bolder fs-4 text-dark mb-2">
                    {config.title}
                </h2>

                <p className="text-muted small lh-base mb-3">
                    {message}
                </p>

                {/* Barre de progression du polling */}
                {status === "loading" && (
                    <div className="mb-4">
                        <div className="progress mb-1" style={{ height: 4 }}>
                            <div
                                className="progress-bar bg-excha-orange"
                                style={{
                                    width: `${(retryCount / MAX_RETRIES) * 100}%`,
                                    transition: "width 0.4s ease",
                                }}
                            />
                        </div>
                        <div className="text-muted" style={{ fontSize: "11px" }}>
                            Tentative {retryCount + 1} / {MAX_RETRIES}
                        </div>
                    </div>
                )}

                {/* Référence transaction */}
                {txRef && (
                    <div className="bg-light rounded-3 px-3 py-2 mb-4 text-muted font-monospace small text-break">
                        Réf : {txRef}
                    </div>
                )}

                {/* Action : succès */}
                {status === "success" && (
                    <button
                        onClick={() => navigate("/user/market")}
                        className="btn btn-success w-100 rounded-pill py-3 fw-bold"
                    >
                        Voir mes transactions
                    </button>
                )}

                {/* Actions : échec ou annulation */}
                {(status === "failed" || status === "cancelled") && (
                    <div className="d-flex flex-column gap-2">
                        <button
                            onClick={() => navigate("/")}
                            className="btn btn-excha-orange w-100 rounded-pill py-3 fw-bold text-white"
                        >
                            Retour au marché
                        </button>
                        <button
                            onClick={() => navigate(-1)}
                            className="btn btn-outline-secondary w-100 rounded-pill py-3 fw-semibold"
                        >
                            Réessayer
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}