import React, { useState, useEffect, useMemo } from "react";
import Select from "react-select";
import { MdClose, MdPayments, MdErrorOutline, MdTrendingUp } from "react-icons/md";
import ListingService from "../services/ListingService";
import type { Listing } from "../models/Listing";
import AOS from "aos";
import "aos/dist/aos.css";

interface UserAddListingProps {
  show: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currencies: any[];
  userMethods: any[];
  selectStyles: any;
  CustomOption: any;
  CustomSingleValue: any;
}

export default function UserAddListing({
  show,
  onClose,
  onSuccess,
  currencies,
  userMethods,
  selectStyles,
  CustomOption,
  CustomSingleValue,
}: UserAddListingProps) {
  const [formData, setFormData] = useState({
    currency_from: "XAF",
    currency_to: "USD",
    amount_available: "",
    user_rate: "",
    description: "",
    method_payment_id: "" as string | number,
  });

  const [marketRate, setMarketRate] = useState<number | null>(null);
  const [rateLoading, setRateLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Initialisation AOS pour l'animation d'entrée
  useEffect(() => {
    if (show) {
      AOS.init({ duration: 400 });
    }
  }, [show]);

  useEffect(() => {
    const getMarketRate = async () => {
      if (!show) return;
      if (formData.currency_from === formData.currency_to) {
        setMarketRate(1);
        return;
      }
      try {
        setRateLoading(true);
        const rate = await ListingService.getLiveMarketRate(
          formData.currency_from,
          formData.currency_to
        );
        setMarketRate(rate);
      } catch (err) {
        console.error(err);
      } finally {
        setRateLoading(false);
      }
    };
    getMarketRate();
  }, [formData.currency_from, formData.currency_to, show]);

  const estimatedTotal = useMemo(() => {
    const amount = parseFloat(formData.amount_available);
    const rate = formData.user_rate ? parseFloat(formData.user_rate) : marketRate;
    if (!isNaN(amount) && amount > 0 && rate) {
      return (amount * rate).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return "0.00";
  }, [formData.amount_available, formData.user_rate, marketRate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const amount = parseFloat(formData.amount_available);
    if (isNaN(amount) || amount <= 0) {
      setFormError("Le montant doit être supérieur à 0.");
      return;
    }
    if (!formData.method_payment_id) {
      setFormError("Veuillez sélectionner un compte de réception.");
      return;
    }
    const finalRate = formData.user_rate ? parseFloat(formData.user_rate) : marketRate || 0;

    try {
      const payload: Partial<Listing> = {
        method_payment_id: Number(formData.method_payment_id),
        currency_from: formData.currency_from,
        currency_to: formData.currency_to,
        amount_available: amount,
        user_rate: finalRate,
        description: formData.description || `Échange ${formData.currency_from} → ${formData.currency_to}`,
      };
      await ListingService.createListing(payload);
      onSuccess();
      setFormData({ ...formData, amount_available: "", user_rate: "", description: "", method_payment_id: "" });
    } catch (err) {
      setFormError("Erreur lors de la publication. Vérifiez votre KYC ou votre solde.");
    }
  };

  if (!show) return null;

  return (
    <div 
      className="custom-modal-overlay d-flex align-items-center justify-content-center p-3"
      style={{ 
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0, 
        backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 1050 
      }}
    >
      <div 
        className="custom-modal-content bg-white rounded-5 shadow-2xl overflow-hidden"
        data-aos="zoom-in"
        style={{ 
          maxWidth: "500px", 
          width: "100%", 
          maxHeight: "90vh", // Hauteur diminuée pour un meilleur rendu visuel
          display: "flex",
          flexDirection: "column",
          marginTop:'3%'
        }}
      >
        {/* Header - Fixé en haut du modal */}
        <div className="p-3 d-flex justify-content-between align-items-center border-bottom bg-white">
          <div className="ps-2">
            <h5 className="fw-bolder mb-0">Publier une annonce</h5>
            <span className="badge bg-light text-excha-orange small fw-bold" style={{ fontSize: '10px' }}>MARCHÉ P2P</span>
          </div>
          <button className="btn btn-light rounded-circle p-2 hover-rotate" onClick={onClose}>
            <MdClose size={20} />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="p-4 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          {formError && (
            <div className="alert alert-danger rounded-4 py-2 px-3 d-flex align-items-center small mb-3 border-0 shadow-sm">
              <MdErrorOutline size={15} className="me-2" /> {formError}
            </div>
          )}

          <div className="row g-3">
            <div className="col-12">
              <label className="form-label small fw-bold text-muted text-uppercase" style={{ fontSize: '11px' }}>
                <MdPayments size={16} className="text-excha-orange me-1" /> Compte de réception
              </label>
              <Select
                options={userMethods}
                styles={selectStyles}
                placeholder="Choisir mon compte..."
                onChange={(opt: any) => setFormData({ ...formData, method_payment_id: opt.value })}
              />
            </div>

            <div className="col-6">
              <label className="form-label small fw-bold text-muted text-uppercase" style={{ fontSize: '11px' }}>Vendre</label>
              <Select
                options={currencies}
                styles={selectStyles}
                components={{ Option: CustomOption, SingleValue: CustomSingleValue }}
                value={currencies.find((c) => c.value === formData.currency_from)}
                onChange={(opt: any) => setFormData({ ...formData, currency_from: opt.value })}
              />
            </div>

            <div className="col-6">
              <label className="form-label small fw-bold text-muted text-uppercase" style={{ fontSize: '11px' }}>Recevoir</label>
              <Select
                options={currencies}
                styles={selectStyles}
                components={{ Option: CustomOption, SingleValue: CustomSingleValue }}
                value={currencies.find((c) => c.value === formData.currency_to)}
                onChange={(opt: any) => setFormData({ ...formData, currency_to: opt.value })}
              />
            </div>

            <div className="col-12">
              <div className="p-2 rounded-4 small fw-bold bg-light border-0 text-center text-primary" style={{ backgroundColor: '#f0f7ff !important' }}>
                {rateLoading ? (
                  <div className="spinner-border spinner-border-sm"></div>
                ) : (
                  <span>Taux : 1 {formData.currency_from} = {marketRate || "..."} {formData.currency_to}</span>
                )}
              </div>
            </div>

            <div className="col-12">
              <label className="form-label small fw-bold text-dark">Montant à vendre</label>
              <div className="input-group">
                <input
                  type="number"
                  value={formData.amount_available}
                  onChange={(e) => setFormData({ ...formData, amount_available: e.target.value })}
                  className="form-control border-0 bg-light py-2 rounded-start-4 fw-bold"
                  placeholder="0.00"
                />
                <span className="input-group-text border-0 bg-light rounded-end-4 fw-bold text-muted small">{formData.currency_from}</span>
              </div>
            </div>

            <div className="col-12">
              <div className="preview-card p-2 rounded-4 shadow-sm fs-6" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: 'white',height:'75px' }}>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <small className="text-uppercase opacity-75 fw-bold" style={{ fontSize: '7px', letterSpacing: '0.5px' }}>Estimation Réception</small>
                    <h3 className="mb-0 fw-bolder text-excha-orange">{estimatedTotal}</h3>
                  </div>
                  <MdTrendingUp size={30} className="opacity-25" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Bouton d'action */}
        <div className="p-4 pt-0 bg-white">
          <button type="submit" onClick={handleSubmit} className="btn btn-excha-orange w-100 rounded-pill py-3 fw-bold text-white shadow-lg transition-hover">
            Confirmer la publication
          </button>
        </div>
      </div>
    </div>
  );
}