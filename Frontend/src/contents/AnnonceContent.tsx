import React, { useEffect, useState } from 'react';
import '../styles/AnnonceContent.css';
import ListingService from '../services/ListingService';
import type { Listing } from '../models/Listing';
import { LuArrowRightLeft, LuClock, LuTrendingDown, LuShieldCheck, LuSearchX } from "react-icons/lu";
import AOS from 'aos';
import 'aos/dist/aos.css';

export default function AnnonceContent() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    AOS.init({ duration: 800, once: true });

    const fetchRecentListings = async () => {
      try {
        const response: any = await ListingService.getAllListings(1, { 
          sort_by: 'created_at', 
          sort_order: 'desc' 
        });
        
        let fetchedData: Listing[] = [];

        // ✅ CORRECTION LIGNE 27 : Utilisation de l'optional chaining (?.)
        const dataRoot = response?.data;
        if (dataRoot) {
          if (Array.isArray(dataRoot.data)) {
            fetchedData = dataRoot.data;
          } else if (Array.isArray(dataRoot)) {
            fetchedData = dataRoot;
          }
        }
        
        setListings(fetchedData.slice(0, 6));

      } catch (error) {
        console.error("Erreur chargement annonces:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentListings();
  }, []);

  return (
    <div className="annonce-container p-2">
      <div className="text-center mb-5" data-aos="fade-down" style={{ marginTop:'5%' }}>
        <h2 className="fw-bold text-excha-blue mb-2">Marché de Change en Temps Réel</h2>
        <p className="text-muted mx-auto" style={{ maxWidth: '600px', fontSize: '0.95rem' }}>
          Découvrez comment notre communauté transforme le change de devises. 
          Simple, rapide et sécurisé.
        </p>
        
        <div className="d-flex justify-content-center gap-2 mt-4">
            <span className="badge bg-light text-excha-blue border px-3 py-2 rounded-pill small">
                <LuShieldCheck className="me-1 text-excha-green" /> Sécurité Escrow
            </span>
            <span className="badge bg-excha-green text-white px-3 py-2 rounded-pill small">
                {/* ✅ CORRECTION LIGNE 66 : Suppression de la négation inattendue (!loading) */}
                {loading ? '...' : listings.length} Offres en direct
            </span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          {/* ✅ CORRECTION LIGNE 74 : Utilisation de <output> pour l'accessibilité */}
          <output className="spinner-border text-excha-green"></output>
          <p className="mt-2 text-muted small">Analyse du marché en cours...</p>
        </div>
      ) : (
        <>
          {listings.length > 0 && (
            <div className="mb-4 px-2" data-aos="fade-right">
                <h4 className="fw-bold text-excha-blue mb-1">Nos meilleures offres</h4>
                <p className="text-muted small">Les 6 opportunités les plus récentes</p>
            </div>
          )}

          <div className="row g-3">
            {listings.length > 0 ? (
              listings.map((listing) => (
                // ✅ CORRECTION : Utilisation de listing_id unique au lieu de l'index
                <div className="col-12 col-md-6 col-lg-4" 
                     key={listing.listing_id} 
                     data-aos="zoom-in">
                  <div className="card listing-card border-0 shadow-sm h-100 transition-all hover-shadow">
                    <div className="card-header bg-white border-0 pt-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="currency-pair d-flex align-items-center gap-2">
                          <span className="badge-currency">{listing.currency_from}</span>
                          <LuArrowRightLeft className="text-muted" size={14} />
                          <span className="badge-currency secondary">{listing.currency_to}</span>
                        </div>
                        {listing.discount_percentage && Number(listing.discount_percentage) > 0 && (
                          <div className="discount-tag">
                            <LuTrendingDown className="me-1" />
                            -{listing.discount_percentage}%
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="card-body">
                      <div className="mb-3">
                        <h3 className="fw-bold mb-0 text-excha-blue">
                          {Number(listing.amount_available).toLocaleString()} <small className="fs-6 fw-normal">{listing.currency_from}</small>
                        </h3>
                        <p className="text-excha-green small mb-0 fw-medium">
                          Taux : 1 {listing.currency_from} = {listing.user_rate} {listing.currency_to}
                        </p>
                      </div>

                      <div className="d-flex align-items-center gap-2 pt-3 border-top">
                        <div className="user-avatar-sm bg-light text-excha-blue fw-bold">
                          {listing.utilisateur?.firstname?.charAt(0) || "U"}
                        </div>
                        <div className="user-info">
                          <span className="d-block fw-bold text-dark extra-small">
                              {listing.utilisateur?.firstname || "Utilisateur"} {listing.utilisateur?.lastname?.charAt(0) || ""}.
                          </span>
                          <span className="text-muted extra-small d-flex align-items-center">
                            <LuClock className="me-1" size={10} />
                            {listing.created_at ? new Date(listing.created_at).toLocaleDateString() : 'Récemment'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="card-footer bg-white border-0 pb-3 text-center">
                        <span className="text-muted extra-small italic">Connectez-vous pour échanger</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-12" data-aos="fade-up">
                <div className="text-center py-5 bg-white shadow-sm rounded-4 border mx-2">
                  <LuSearchX size={50} className="text-muted mb-3" />
                  <h5 className="fw-bold text-excha-blue">Aucune offre disponible</h5>
                  <p className="text-muted px-4 small">
                    Il n'y a pas d'annonces actives pour le moment. <br />
                    Soyez le premier à poster une offre en vous connectant !
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
// 