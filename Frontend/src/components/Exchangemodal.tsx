import { useState } from "react";
import {
    MdClose,
    MdPhoneAndroid, MdCreditCard, MdArrowForward, MdLock,
} from "react-icons/md";
import type { Listing } from "../models/Listing";
import { transactionService } from "../services/Transactionservice";

interface ExchangeModalProps {
    listing: Listing;
    onClose: () => void;
}

type PaymentMethod = "MOBILE_MONEY" | "CARD";

/**
 * Modal de confirmation d'échange.
 *
 * Logique :
 *   - L'acheteur prend TOUT ce que le vendeur propose (amount_available)
 *   - Pas de saisie de montant — affichage seulement
 *   - L'acheteur choisit Mobile Money ou Carte
 *   - Clic "Confirmer" → appel API → redirection Flutterwave
 */
export default function ExchangeModal({ listing, onClose }: ExchangeModalProps) {
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("MOBILE_MONEY");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Calcul côté frontend (indicatif — le vrai calcul est fait par le backend)
    const rate        = Number(listing.user_rate);
    const amountFrom  = Number(listing.amount_available);
    const amountTo    = Math.round(amountFrom * rate * 100) / 100;
    const platformFee = Math.round(amountTo * 0.01 * 100) / 100;
    const totalToPay  = Math.round((amountTo + platformFee) * 100) / 100;

    const handleConfirm = async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await transactionService.initiate({
                listing_id:     listing.listing_id,
                amount_from:    amountFrom,
                payment_method: paymentMethod,
            });

            window.location.href = result.payment_link;

        } catch (err: any) {
            const msg =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                "Une erreur est survenue. Veuillez réessayer.";
            setError(msg);
            setLoading(false);
        }
    };

    return (
        /* Overlay */
        <div
            onClick={onClose}
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3 animate-fade-in"
            style={{ backgroundColor: "rgba(0,0,0,0.55)", zIndex: 1050, backdropFilter: "blur(3px)" }}
        >
            {/* Modal */}
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-4 w-100 overflow-hidden shadow-lg animate-slide-up"
                style={{ maxWidth: 460 }}
            >
                {/* Header */}
                <div className="d-flex align-items-center justify-content-between px-4 pt-4 pb-3 border-bottom">
                    <div>
                        <div className="fw-bold fs-6">Confirmer l'échange</div>
                        <div className="text-muted small mt-1">Vérifiez les détails avant de payer</div>
                    </div>
                    <button
                        onClick={onClose}
                        className="btn btn-light rounded-circle d-flex align-items-center justify-content-center p-2"
                        style={{ width: 34, height: 34 }}
                    >
                        <MdClose size={18} />
                    </button>
                </div>

                <div className="px-4 py-3">

                    {/* Vendeur */}
                    {/* <div className="d-flex align-items-center gap-2 p-3 bg-light rounded-3 border mb-3">
                        <MdAccountCircle size={36} className="text-secondary flex-shrink-0" />
                        <div>
                            <div className="fw-semibold small">
                                {listing.utilisateur?.firstname} {listing.utilisateur?.lastname}
                            </div>
                            <div className="d-flex align-items-center gap-1 mt-1">
                                <MdVerified size={13} className="text-primary" />
                                <span className="text-muted fw-bold" style={{ fontSize: "10px" }}>VÉRIFIÉ</span>
                            </div>
                        </div>
                        <div className="ms-auto text-end">
                            <div className="text-muted fw-bold" style={{ fontSize: "10px" }}>VIA</div>
                            <div className="small fw-bold text-dark text-uppercase">
                                {listing.payment_method?.provider || "Mobile Money"}
                            </div>
                        </div>
                    </div> */}

                    {/* Résumé de l'échange */}
                    <div className="rounded-3 p-3 mb-3 border" style={{ background: "linear-gradient(135deg, #fff8f3 0%, #fff3ea 100%)", borderColor: "#fd7e1430 !important" }}>

                        {/* Flux : reçoit → paie */}
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <div className="text-center">
                                <div className="text-muted fw-bold" style={{ fontSize: "10px", letterSpacing: 1 }}>
                                    VOUS RECEVEZ
                                </div>
                                <div className="fw-bolder lh-1 mt-1" style={{ fontSize: "1.5rem" }}>
                                    {amountFrom.toLocaleString()}
                                </div>
                                <div className="small fw-semibold text-excha-orange">
                                    {listing.currency_from}
                                </div>
                            </div>

                            <div
                                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 bg-excha-orange shadow"
                                style={{ width: 36, height: 36 }}
                            >
                                <MdArrowForward size={18} className="text-black " />
                            </div>

                            <div className="text-center">
                                <div className="text-muted fw-bold" style={{ fontSize: "10px", letterSpacing: 1 }}>
                                    VOUS PAYEZ
                                </div>
                                <div className="fw-bolder lh-1 mt-1" style={{ fontSize: "1.5rem" }}>
                                    {amountTo.toLocaleString()}
                                </div>
                                <div className="small fw-semibold text-excha-orange">
                                    {listing.currency_to}
                                </div>
                            </div>
                        </div>

                        {/* Séparateur */}
                        <hr className="border-dashed my-2 opacity-25" />

                        {/* Détail des frais */}
                        <div className="d-flex flex-column gap-1">
                            <div className="d-flex justify-content-between small">
                                <span className="text-muted">Taux appliqué</span>
                                <span className="fw-semibold text-dark">
                                    1 {listing.currency_from} = {rate.toLocaleString()} {listing.currency_to}
                                </span>
                            </div>
                            <div className="d-flex justify-content-between small">
                                <span className="text-muted">Frais plateforme (1%)</span>
                                <span className="fw-semibold text-dark">
                                    {platformFee.toLocaleString()} {listing.currency_to}
                                </span>
                            </div>
                            <div className="d-flex justify-content-between pt-2 mt-1 border-top">
                                <span className="fw-bold text-dark small">Total débité</span>
                                <span className="fw-bolder text-excha-orange small">
                                    {totalToPay.toLocaleString()} {listing.currency_to}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Choix méthode de paiement */}
                    <div className="mb-3">
                        <div className="text-muted fw-bold mb-2" style={{ fontSize: "11px", letterSpacing: 0.5 }}>
                            MÉTHODE DE PAIEMENT
                        </div>
                        <div className="row g-2">
                            {(["MOBILE_MONEY", "CARD"] as PaymentMethod[]).map((method) => {
                                const isSelected = paymentMethod === method;
                                const Icon = method === "MOBILE_MONEY" ? MdPhoneAndroid : MdCreditCard;
                                const label = method === "MOBILE_MONEY" ? "Mobile Money" : "Carte bancaire";
                                return (
                                    <div key={method} className="col-6">
                                        <button
                                            onClick={() => setPaymentMethod(method)}
                                            className={`w-100 d-flex flex-column align-items-center gap-1 py-3 rounded-3 border-2 fw-bold transition-all ${
                                                isSelected
                                                    ? "border border-excha-orange bg-excha-orange-subtle text-excha-orange"
                                                    : "border bg-light text-muted"
                                            }`}
                                            style={{ fontSize: "11px" }}
                                        >
                                            <Icon size={22} />
                                            {label}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Erreur */}
                    {error && (
                        <div className="alert alert-danger rounded-3 py-2 px-3 small mb-3">
                            {error}
                        </div>
                    )}

                    {/* Bouton confirmer */}
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="btn btn-excha-orange w-100 rounded-pill py-3 fw-bold text-white d-flex align-items-center justify-content-center gap-2 shadow"
                    >
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm" role="status" />
                            </>
                        ) : (
                            <>
                                <MdLock size={16} />
                                Confirmer et Payer — {totalToPay.toLocaleString()} {listing.currency_to}
                            </>
                        )}
                    </button>

                    {/* Note sécurité */}
                    <div className="d-flex align-items-center justify-content-center gap-1 text-muted mt-2" style={{ fontSize: "11px" }}>
                        <MdLock size={11} />
                        Paiement sécurisé par Flutterwave
                    </div>
                </div>
            </div>
        </div>
    );
}