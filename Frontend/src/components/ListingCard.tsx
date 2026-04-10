import React from 'react';
import type { Listing } from '../models/Listing';
import {
  MdAccountCircle,
  MdVerified,
  MdLocalFireDepartment,
  MdPayments,
} from 'react-icons/md';

interface ListingCardProps {
  listing: Listing;
  /** ref pour l'infinite-scroll (passé uniquement sur le dernier élément) */
  innerRef?: React.Ref<HTMLDivElement>;
  onExchange?: (listing: Listing) => void;
}

/**
 * Carte d'annonce individuelle.
 * Extraite de MarketHome pour alléger le fichier parent.
 */
export default function ListingCard({ listing, innerRef, onExchange }: ListingCardProps) {
  const isBestDeal = Number(listing.user_rate) < Number(listing.official_rate);

  return (
    <div
      ref={innerRef}
      className="col-12 col-sm-6 col-md-4 col-xl-3"
    >
      <div className="card listing-card-premium border-0 shadow-sm rounded-4 h-100 animate-card-floating">

        {/* Badge "Meilleur taux" */}
        {isBestDeal && (
          <div className="best-price-badge">
            <MdLocalFireDepartment size={14} className="me-1 animate-flicker" />
            MEILLEUR TAUX
          </div>
        )}

        <div className="card-body p-4 d-flex flex-column">

          {/* Vendeur */}
          <div className="d-flex align-items-center mb-3">
            <MdAccountCircle size={40} className="text-secondary me-2" />
            <div>
              <div className="fw-bold small">{listing.utilisateur?.firstname}</div>
              <div className="d-flex align-items-center">
                <MdVerified className="text-primary me-1" size={14} />
                <span style={{ fontSize: '10px' }} className="text-muted fw-bold">
                  VÉRIFIÉ
                </span>
              </div>
            </div>
          </div>

          {/* Méthode de paiement */}
          <div
            className="mb-3 px-3 py-1 rounded-pill bg-light border d-inline-flex align-items-center"
            style={{ fontSize: '11px' }}
          >
            <MdPayments className="text-muted me-2" />
            <span className="text-muted">Via : </span>
            <strong className="ms-1 text-dark text-uppercase">
              {listing.payment_method?.provider || 'Mobile Money'}
            </strong>
          </div>

          {/* Comparateur taux marché vs offre */}
          <div className="rate-comparison-box p-3 rounded-4 mb-4">
            <div className="row g-0 align-items-center text-center">
              <div className="col-5">
                <span className="d-block text-muted mb-1" style={{ fontSize: '10px' }}>
                  MARCHÉ
                </span>
                <span className="fw-bold text-dark">{listing.official_rate}</span>
              </div>
              <div className="col-2">
                <div className="vs-circle shadow-sm">VS</div>
              </div>
              <div className="col-5">
                <span className="d-block text-muted mb-1" style={{ fontSize: '10px' }}>
                  OFFRE
                </span>
                <span
                  className={`fw-bolder fs-5 ${
                    isBestDeal ? 'text-success' : 'text-excha-orange'
                  }`}
                >
                  {listing.user_rate}
                </span>
              </div>
            </div>
          </div>

          {/* Détails */}
          <div className="exchange-details flex-grow-1">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <small className="text-muted fw-bold">Disponible</small>
              <span className="fw-bolder text-dark">
                {listing.amount_available} {listing.currency_from}
              </span>
            </div>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <small className="text-muted fw-bold">Cible</small>
              <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-2">
                {listing.currency_to}
              </span>
            </div>
          </div>

          {/* CTA */}
          <button
            className="btn btn-dark w-100 rounded-pill py-2 fw-bold btn-exchange-hover shadow-sm"
            onClick={() => onExchange?.(listing)}
          >
            Échanger
          </button>
        </div>
      </div>
    </div>
  );
}
