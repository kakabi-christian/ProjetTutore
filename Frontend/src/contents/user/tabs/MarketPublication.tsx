import React, { useEffect, useState, useCallback } from 'react';
import { components } from 'react-select'; // Nécessaire pour les types et composants de base
import { paymentMethodService } from '../../../services/PaymentMethodService';
import ListingService from '../../../services/ListingService';
import CurrencyService from '../../../services/CurrencyService';
import type { Listing, ListingPaginationResponse } from '../../../models/Listing';
import UserAddListing from '../../../components/UserAddListing';

import { 
  MdAdd, MdEdit, MdDeleteSweep,
  MdSwapHoriz, MdInfoOutline
} from "react-icons/md";

export default function MarketPublication() {
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [userMethods, setUserMethods] = useState<any[]>([]);
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [showModal, setShowModal] = useState(false);

  // --- Chargement des données (Devises + Méthodes de paiement) ---
  useEffect(() => {
    const initData = async () => {
      try {
        const [currData, methodsResponse] = await Promise.all([
          CurrencyService.getAllCurrencies(),
          paymentMethodService.getUserMethods(),
        ]);

        setCurrencies(currData.map(c => ({
          value: c.code, label: c.code, flag: c.flag, fullName: c.name
        })));

        setUserMethods((methodsResponse.data || []).map((m: any) => ({
          value: m.method_payment_id,
          label: `${m.provider} - ${m.account_number} (${m.account_name})`,
        })));
      } catch (err) {
        console.error("Erreur initialisation", err);
      }
    };
    initData();
  }, []);

  const fetchMyListings = useCallback(async (shouldReset = false) => {
    try {
      setLoading(true);
      const currentPage = shouldReset ? 1 : page;
      const response: ListingPaginationResponse = await ListingService.getUserListings(currentPage);
      
      setMyListings(prev => {
        if (shouldReset) return response.data;
        
        // CORRECTION : On filtre les nouveaux items pour éviter les doublons de clés (Keys)
        const newItems = response.data.filter(
          newItem => !prev.some(oldItem => oldItem.listing_id === newItem.listing_id)
        );
        return [...prev, ...newItems];
      });
      
      setHasMore(response.current_page < response.last_page);
    } catch (err) {
      console.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [page]);

  // CORRECTION : On ne surveille que page ici pour éviter les boucles infinies
  useEffect(() => { 
    fetchMyListings(); 
  }, [page]);

  const handleListingSuccess = () => {
    setShowModal(false);
    setPage(1);
    fetchMyListings(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Voulez-vous vraiment supprimer cette annonce ?")) {
      try {
        await ListingService.deleteListing(id);
        setMyListings(prev => prev.filter(l => l.listing_id !== id));
      } catch (err) { alert("Erreur lors de la suppression."); }
    }
  };

  // --- Styles et Composants pour Select (Passés à UserAddListing) ---
  const selectStyles = {
    control: (base: any) => ({
      ...base, border: 'none', backgroundColor: '#f1f3f5', borderRadius: '12px', padding: '4px', boxShadow: 'none'
    }),
    menu: (base: any) => ({ ...base, zIndex: 9999, borderRadius: '12px', overflow: 'hidden' })
  };

  const CustomOption = (props: any) => (
    <components.Option {...props}>
      <div className="d-flex align-items-center p-2 cursor-pointer hover-bg-light">
        <img src={props.data.flag} alt="" style={{ width: 22, height: 16, marginRight: 10, borderRadius: 2 }} />
        <div>
          <span className="fw-bold d-block text-dark" style={{ fontSize: '0.9rem' }}>{props.data.label}</span>
          <small className="text-muted">{props.data.fullName}</small>
        </div>
      </div>
    </components.Option>
  );

  const CustomSingleValue = (props: any) => (
    <components.SingleValue {...props}>
      <div className="d-flex align-items-center">
        <img src={props.data.flag} alt="" style={{ width: 20, height: 14, marginRight: 8, borderRadius: 2 }} />
        <span className="fw-bold text-dark">{props.data.label}</span>
      </div>
    </components.SingleValue>
  );

  return (
    <div className="market-container w-100 py-4 px-3">
      <div className="mx-auto" style={{ maxWidth: '1200px' }}>
        
        {/* Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 px-2">
          <div>
            <h3 className="fw-bold mb-0 text-dark">Mes Publications</h3>
            <p className="text-muted small mb-0">Gérez vos offres de change actives</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="btn btn-excha-orange rounded-pill px-4 py-2 fw-bold text-white shadow-lg d-flex align-items-center mt-3 mt-md-0"
          >
            <MdAdd size={24} className="me-2" /> <span>Nouvelle Offre</span>
          </button>
        </div>

        {/* Listings Grid */}
        <div className="row g-4">
          {myListings.length === 0 && !loading ? (
            <div className="col-12 text-center py-5">
              <MdInfoOutline size={60} className="text-muted opacity-25 mb-3" />
              <p className="text-muted fw-bold">Aucune annonce en ligne.</p>
            </div>
          ) : (
            myListings.map((listing, index) => (
              <div key={listing.listing_id} className="col-12 col-md-6 col-lg-4">
                <div className={`card border-0 shadow-sm rounded-4 h-100 animate-card-floating card-delay-${(index % 4) + 1}`}>
                  <div className="card-body p-4 d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="bg-light rounded-pill px-3 py-1 d-flex align-items-center">
                        <span className="fw-bold text-dark">{listing.currency_from}</span>
                        <MdSwapHoriz className="mx-2 text-muted" size={18} />
                        <span className="fw-bold text-dark">{listing.currency_to}</span>
                      </div>
                      <span className="badge bg-success-subtle text-success rounded-pill px-3">Actif</span>
                    </div>

                    <div className="bg-light p-3 rounded-4 mb-4 text-center border">
                      <div className="row g-0 align-items-center">
                        <div className="col-6 text-start">
                          <span className="d-block text-muted small">MONTANT</span>
                          <span className="fw-bold text-dark">{listing.amount_available} {listing.currency_from}</span>
                        </div>
                        <div className="col-6 text-end">
                          <span className="d-block text-muted small">VOTRE TAUX</span>
                          <span className="fw-bolder fs-5 text-excha-orange">{listing.user_rate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex gap-2 mt-auto">
                      <button className="btn btn-dark flex-grow-1 rounded-pill py-2 fw-bold shadow-sm d-flex align-items-center justify-content-center">
                        <MdEdit className="me-2" /> Modifier
                      </button>
                      <button 
                        onClick={() => handleDelete(listing.listing_id)}
                        className="btn btn-outline-danger flex-shrink-0 rounded-circle p-2 d-flex align-items-center justify-content-center" 
                      >
                        <MdDeleteSweep size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {loading && <div className="text-center p-5"><div className="spinner-border text-excha-orange" role="status" /></div>}
        
        {hasMore && !loading && myListings.length > 0 && (
          <div className="text-center mt-5">
             <button onClick={() => setPage(p => p + 1)} className="btn btn-link text-dark fw-bold text-decoration-none">
                Charger plus d'annonces
             </button>
          </div>
        )}
      </div>

      {/* Modal - Toutes les props sont maintenant présentes pour TS */}
      {showModal && (
        <UserAddListing 
          show={showModal}
          onClose={() => setShowModal(false)}
          onSuccess={handleListingSuccess}
          currencies={currencies}
          userMethods={userMethods}
          selectStyles={selectStyles}
          CustomOption={CustomOption}
          CustomSingleValue={CustomSingleValue}
        />
      )}

      {/* Styles CSS */}
      <style>{`
        .market-container { background: #f8f9fa; min-height: 100vh; }
        .btn-excha-orange { background: linear-gradient(135deg, #FF7A00 0%, #FF9500 100%); border: none; transition: 0.3s; }
        .btn-excha-orange:hover { opacity: 0.9; transform: scale(1.02); }
        .text-excha-orange { color: #FF7A00; }
        @keyframes floating { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .animate-card-floating { animation: floating 4s ease-in-out infinite; }
        .card-delay-1 { animation-delay: 0s; } 
        .card-delay-2 { animation-delay: 0.8s; }
        .card-delay-3 { animation-delay: 1.6s; }
        .card-delay-4 { animation-delay: 2.4s; }
      `}</style>
    </div>
  );
}