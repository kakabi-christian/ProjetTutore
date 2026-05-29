import { useState, useEffect } from "react";
import {
  MdClose,
  MdPhoneAndroid,
  MdCreditCard,
  MdArrowForward,
  MdLock,
  MdAccountBalance,
  MdSmartphone,
  MdAddCircleOutline,
  MdWarning,
} from "react-icons/md";
import type { Listing } from "../models/Listing";
import { paymentMethodService } from "../services/PaymentMethodService";
import type { MethodPayment } from "../models/MehodPayment";
import { transactionService } from "../services/Transactionservice";

interface ExchangeModalProps {
  listing: Listing;
  onClose: () => void;
}

type PaymentMethod = "MOBILE_MONEY" | "CARD";

export default function ExchangeModal({
  listing,
  onClose,
}: ExchangeModalProps) {
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("MOBILE_MONEY");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Comptes de réception de l'acheteur
  const [myMethods, setMyMethods] = useState<MethodPayment[]>([]);
  const [methodsLoading, setMethodsLoading] = useState(true);
  const [selectedMethodId, setSelectedMethodId] = useState<number | null>(null);

  // Calculs indicatifs (le vrai calcul est côté backend)
  const rate = Number(listing.user_rate);
  const amountFrom = Number(listing.amount_available);
  const amountTo = Math.round(amountFrom * rate * 100) / 100;
  const platformFee = Math.round(amountTo * 0.01 * 100) / 100;
  const totalToPay = Math.round((amountTo + platformFee) * 100) / 100;

  useEffect(() => {
    const fetchMethods = async () => {
      setMethodsLoading(true);
      try {
        const res = await paymentMethodService.getUserMethods();
        const methods: MethodPayment[] = res.data || [];
        setMyMethods(methods);
        // Pré-sélectionner le compte par défaut
        const defaultMethod =
          methods.find((m) => m.is_default) ?? methods[0] ?? null;
        if (defaultMethod) setSelectedMethodId(defaultMethod.method_payment_id);
      } catch {
        setError("Impossible de charger vos comptes de réception.");
      } finally {
        setMethodsLoading(false);
      }
    };
    fetchMethods();
  }, []);

  const handleConfirm = async () => {
    if (!selectedMethodId) {
      setError("Veuillez sélectionner un compte de réception.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await transactionService.initiate({
        listing_id: listing.listing_id,
        amount_from: amountFrom,
        payment_method: paymentMethod,
        buyer_method_payment_id: selectedMethodId,
      });
      window.location.href = result.payment_link;
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Une erreur est survenue.",
      );
      setLoading(false);
    }
  };

  const selectedMethod = myMethods.find(
    (m) => m.method_payment_id === selectedMethodId,
  );

  return (
    <div
      onClick={onClose}
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3 animate-fade-in"
      style={{
        backgroundColor: "rgba(0,0,0,0.55)",
        zIndex: 1050,
        backdropFilter: "blur(3px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-4 w-100 shadow-lg animate-slide-up"
        style={{ maxWidth: 480, maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between px-4 pt-4 pb-3 border-bottom sticky-top bg-white">
          <div>
            <div className="fw-bold fs-6">Confirmer l'échange</div>
            <div className="text-muted small mt-1">
              Vérifiez les détails avant de payer
            </div>
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
          {/* Résumé */}
          <div
            className="rounded-3 p-3 mb-3 border"
            style={{ background: "linear-gradient(135deg,#fff8f3,#fff3ea)" }}
          >
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div className="text-center">
                <div
                  className="text-muted fw-bold"
                  style={{ fontSize: "10px", letterSpacing: 1 }}
                >
                  VOUS RECEVEZ
                </div>
                <div
                  className="fw-bolder lh-1 mt-1"
                  style={{ fontSize: "1.4rem" }}
                >
                  {amountFrom.toLocaleString()}
                </div>
                <div className="small fw-semibold text-excha-orange">
                  {listing.currency_from}
                </div>
              </div>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center bg-excha-orange shadow"
                style={{ width: 36, height: 36 }}
              >
                <MdArrowForward size={18} className="text-white" />
              </div>
              <div className="text-center">
                <div
                  className="text-muted fw-bold"
                  style={{ fontSize: "10px", letterSpacing: 1 }}
                >
                  VOUS PAYEZ
                </div>
                <div
                  className="fw-bolder lh-1 mt-1"
                  style={{ fontSize: "1.4rem" }}
                >
                  {amountTo.toLocaleString()}
                </div>
                <div className="small fw-semibold text-excha-orange">
                  {listing.currency_to}
                </div>
              </div>
            </div>
            <hr className="opacity-25 my-2" />
            <div className="d-flex flex-column gap-1">
              <div className="d-flex justify-content-between small">
                <span className="text-muted">Taux</span>
                <span className="fw-semibold">
                  1 {listing.currency_from} = {rate.toLocaleString()}{" "}
                  {listing.currency_to}
                </span>
              </div>
              <div className="d-flex justify-content-between small">
                <span className="text-muted">Frais (1%)</span>
                <span className="fw-semibold">
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

          {/* ─── Compte de réception ─────────────────────────────── */}
          <div className="mb-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <div
                className="text-muted fw-bold"
                style={{ fontSize: "11px", letterSpacing: 0.5 }}
              >
                OÙ RECEVOIR VOS {listing.currency_from}
              </div>
              <a
                href="/user/method-payment"
                className="text-excha-orange fw-bold d-flex align-items-center gap-1"
                style={{ fontSize: "11px", textDecoration: "none" }}
              >
                <MdAddCircleOutline size={14} /> Ajouter
              </a>
            </div>

            {methodsLoading ? (
              <div className="text-center py-3">
                <div className="spinner-border spinner-border-sm text-excha-orange" />
              </div>
            ) : myMethods.length === 0 ? (
              <div
                className="d-flex align-items-start gap-2 p-3 rounded-3 border border-warning"
                style={{ background: "#fffbeb" }}
              >
                <MdWarning
                  size={20}
                  className="text-warning flex-shrink-0 mt-1"
                />
                <div style={{ fontSize: "13px" }}>
                  <div className="fw-bold text-dark mb-1">
                    Aucun compte enregistré
                  </div>
                  <div className="text-muted mb-2">
                    Ajoutez un compte pour recevoir vos{" "}
                    <strong>{listing.currency_from}</strong> après l'échange.
                  </div>
                  <a
                    href="/user/method-payment"
                    className="btn btn-sm btn-warning fw-bold rounded-pill"
                  >
                    Ajouter un compte
                  </a>
                </div>
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {myMethods.map((method) => {
                  const isSelected =
                    selectedMethodId === method.method_payment_id;
                  const Icon =
                    method.type === "MOBILE_MONEY"
                      ? MdSmartphone
                      : MdAccountBalance;
                  return (
                    <button
                      key={method.method_payment_id}
                      onClick={() =>
                        setSelectedMethodId(method.method_payment_id)
                      }
                      className={`d-flex align-items-center gap-3 p-3 rounded-3 border-2 w-100 text-start ${
                        isSelected
                          ? "border border-excha-orange"
                          : "border bg-light"
                      }`}
                      style={{
                        cursor: "pointer",
                        background: isSelected ? "#fff8f3" : undefined,
                      }}
                    >
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          border: isSelected
                            ? "2px solid #fd7e14"
                            : "2px solid #ccc",
                          background: isSelected ? "#fd7e14" : "transparent",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {isSelected && (
                          <div
                            style={{
                              width: 6,
                              height: 6,
                              background: "#fff",
                              borderRadius: "50%",
                            }}
                          />
                        )}
                      </div>
                      <Icon
                        size={20}
                        className={
                          isSelected ? "text-excha-orange" : "text-muted"
                        }
                      />
                      <div className="flex-grow-1">
                        <div className="fw-bold small text-uppercase text-dark">
                          {method.provider}
                        </div>
                        <div
                          className="text-muted"
                          style={{ fontSize: "12px" }}
                        >
                          {method.account_number}
                        </div>
                      </div>
                      <div className="text-end">
                        <span
                          className={`badge rounded-pill px-2 ${isSelected ? "bg-excha-orange text-white" : "bg-secondary-subtle text-secondary"}`}
                          style={{ fontSize: "10px" }}
                        >
                          {method.currency}
                        </span>
                        {method.is_default && (
                          <div
                            style={{
                              fontSize: "9px",
                              color: "#aaa",
                              marginTop: 2,
                            }}
                          >
                            Défaut
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ─── Méthode de paiement ─────────────────────────────── */}
          <div className="mb-3">
            <div
              className="text-muted fw-bold mb-2"
              style={{ fontSize: "11px", letterSpacing: 0.5 }}
            >
              COMMENT PAYER ({listing.currency_to})
            </div>
            <div className="row g-2">
              {(["MOBILE_MONEY", "CARD"] as PaymentMethod[]).map((method) => {
                const isSelected = paymentMethod === method;
                const Icon =
                  method === "MOBILE_MONEY" ? MdPhoneAndroid : MdCreditCard;
                return (
                  <div key={method} className="col-6">
                    <button
                      onClick={() => setPaymentMethod(method)}
                      className={`w-100 d-flex flex-column align-items-center gap-1 py-3 rounded-3 border-2 fw-bold ${
                        isSelected
                          ? "border border-excha-orange bg-excha-orange-subtle text-excha-orange"
                          : "border bg-light text-muted"
                      }`}
                      style={{ fontSize: "11px" }}
                    >
                      <Icon size={22} />
                      {method === "MOBILE_MONEY"
                        ? "Mobile Money"
                        : "Carte bancaire"}
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
            disabled={loading || myMethods.length === 0 || !selectedMethodId}
            className="btn btn-excha-orange w-100 rounded-pill py-3 fw-bold text-white d-flex align-items-center justify-content-center gap-2 shadow"
            style={{
              opacity:
                loading || myMethods.length === 0 || !selectedMethodId
                  ? 0.5
                  : 1,
              backgroundColor: "#fd7e14",
              borderColor: "#fd7e14",
            }}
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm" />
            ) : (
              <>
                <MdLock size={16} />
                Confirmer et Payer — {totalToPay.toLocaleString()}{" "}
                {listing.currency_to}
              </>
            )}
          </button>

          {/* Rappel compte sélectionné */}
          {selectedMethod && !loading && (
            <div
              className="text-center mt-2 text-muted"
              style={{ fontSize: "11px" }}
            >
              <MdLock size={11} className="me-1" />
              Réception sur{" "}
              <strong>
                {selectedMethod.provider} — {selectedMethod.account_number}
              </strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
