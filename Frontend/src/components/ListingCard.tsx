import React, { useEffect } from 'react';
import type { Listing } from '../models/Listing';
import {
  MdAccountCircle,
  MdVerified,
  MdLocalFireDepartment,
} from 'react-icons/md';

import AOS from 'aos';
import 'aos/dist/aos.css';

interface ListingCardProps {
  listing: Listing;
  innerRef?: React.Ref<HTMLDivElement>;
  onExchange?: (listing: Listing) => void;
  index?: number;
}

export default function ListingCard({ listing, innerRef, onExchange, index = 0 }: ListingCardProps) {
  const isBestDeal = Number(listing.user_rate) < Number(listing.official_rate);

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: false,
      mirror: true,
    });
    AOS.refresh();
  }, []);

  return (
    <div
      ref={innerRef}
      className="col-12 col-sm-6 col-md-4 col-xl-3 mb-4"
      data-aos="zoom-in-up"
      data-aos-delay={(index % 4) * 150}
    >
      <div 
        className={`card listing-card-premium shadow-sm rounded-4 h-100 overflow-hidden transition-all bg-white ${isBestDeal ? 'best-deal-float' : 'standard-float'}`}
        style={{
          animationDelay: `${index * 0.2}s`,
          border: '2px solid #FF7A00',
          zIndex: 2,
          position: 'relative'
        }}
      >
        {/* Overlay de brillance au survol */}
        <div className="shimmer-wrapper"></div>

        {/* Badge "Meilleur taux" avec gradient */}
        {isBestDeal && (
          <div className="best-price-badge animate-flicker">
            <MdLocalFireDepartment size={14} className="me-1" />
            MEILLEUR TAUX
          </div>
        )}

        <div className="card-body p-4 d-flex flex-column" style={{ zIndex: 3 }}>
          {/* Header Vendeur */}
          <div className="d-flex align-items-center mb-4">
            <div className="position-relative">
              <div className="avatar-border">
                <MdAccountCircle size={42} className="text-secondary opacity-75" />
              </div>
              <div className="status-indicator-online"></div>
            </div>
            <div className="ms-2">
              <div className="fw-bold small text-capitalize text-dark mb-0" style={{ letterSpacing: '0.5px' }}>
                {listing.utilisateur?.firstname || 'Utilisateur'}
              </div>
              <div className="d-flex align-items-center">
                <MdVerified className="text-primary me-1" size={14} />
                <span style={{ fontSize: '10px' }} className="text-muted fw-bolder text-uppercase">VÉRIFIÉ</span>
              </div>
            </div>
          </div>

          {/* Box de comparaison style "Glass" */}
          <div className="rate-comparison-box p-3 rounded-4 mb-4 shadow-sm border border-white">
            <div className="row g-0 align-items-center text-center">
              <div className="col-5">
                <span className="d-block text-muted mb-1" style={{ fontSize: '9px', fontWeight: '700' }}>MARCHÉ</span>
                <span className="fw-bold text-dark small">{listing.official_rate}</span>
              </div>
              <div className="col-2">
                <div className="vs-circle-premium">VS</div>
              </div>
              <div className="col-5">
                <span className="d-block text-muted mb-1" style={{ fontSize: '9px', fontWeight: '700' }}>OFFRE</span>
                <span className={`fw-bolder fs-5 ${isBestDeal ? 'text-success' : 'text-excha-orange'}`}>
                  {listing.user_rate}
                </span>
              </div>
            </div>
          </div>

          {/* Détails de la transaction */}
          <div className="exchange-details flex-grow-1">
            <div className="d-flex justify-content-between align-items-center mb-2 px-1">
              <small className="text-muted fw-bold" style={{ fontSize: '11px' }}>Disponible</small>
              <span className="fw-bolder text-dark" style={{ fontSize: '14px' }}>
                {listing.amount_available} <span className="text-muted small">{listing.currency_from}</span>
              </span>
            </div>
            <div className="d-flex justify-content-between align-items-center mb-4 px-1">
              <small className="text-muted fw-bold" style={{ fontSize: '11px' }}>Cible</small>
              <span className="badge-target">
                {listing.currency_to}
              </span>
            </div>
          </div>

          {/* Bouton avec Pulse subtil */}
          <button
            className="btn btn-dark w-100 rounded-pill py-2 fw-bold shadow-sm btn-exchange-premium border-0"
            onClick={() => onExchange?.(listing)}
          >
            Échanger
          </button>
        </div>
      </div>

      <style>{`
        .text-excha-orange { color: #FF7A00; }
        
        .listing-card-premium {
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .listing-card-premium:hover {
          transform: translateY(-10px) scale(1.02) !important;
          box-shadow: 0 20px 40px rgba(255, 122, 0, 0.18) !important;
          border-color: #FF9F43 !important;
        }

        /* Effet de brillance qui passe au survol */
        .shimmer-wrapper {
          position: absolute;
          top: 0; left: -100%;
          width: 50%; height: 100%;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.4), transparent);
          transform: skewX(-25deg);
          transition: 0.5s;
          z-index: 1;
        }
        .listing-card-premium:hover .shimmer-wrapper {
          left: 150%;
        }

        .rate-comparison-box {
          background: rgba(249, 250, 251, 0.7);
          backdrop-filter: blur(5px);
          border: 1px solid rgba(255, 122, 0, 0.05) !important;
        }

        .vs-circle-premium {
          width: 28px; height: 28px;
          background: linear-gradient(135deg, #FF7A00, #FF9F43);
          color: white;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 9px; font-weight: 900;
          margin: 0 auto;
          box-shadow: 0 4px 10px rgba(255, 122, 0, 0.3);
        }

        .best-price-badge {
          position: absolute;
          top: 0; right: 0;
          background: linear-gradient(90deg, #FF7A00, #FF4D00);
          color: white;
          padding: 6px 16px;
          font-size: 10px;
          font-weight: 800;
          border-bottom-left-radius: 20px;
          box-shadow: -2px 2px 10px rgba(0,0,0,0.1);
          z-index: 10;
        }

        .badge-target {
          background: #FFF5EC;
          color: #FF7A00;
          padding: 6px 14px;
          border-radius: 12px;
          font-weight: 800;
          font-size: 12px;
          border: 1px solid rgba(255, 122, 0, 0.1);
        }

        .btn-exchange-premium {
          background: #1A1A1B !important;
          transition: all 0.3s;
          letter-spacing: 1px;
          text-transform: uppercase;
          font-size: 13px;
        }
        .btn-exchange-premium:hover {
          background: #FF7A00 !important;
          transform: scale(1.02);
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .best-deal-float { animation: float 4s ease-in-out infinite; }
        .standard-float { animation: float 6s ease-in-out infinite; }

        .status-indicator-online {
          width: 12px; height: 12px;
          background: #2ecc71;
          border: 2px solid white;
          border-radius: 50%;
          position: absolute;
          bottom: 2px; right: 8px;
        }
      `}</style>
    </div>
  );
}