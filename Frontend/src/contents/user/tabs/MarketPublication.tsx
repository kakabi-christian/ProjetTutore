import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import Select, { components } from 'react-select';
import type { ActionMeta } from 'react-select';
import type { SingleValue as ReactSelectSingleValue } from 'react-select';

import ListingService from '../../../services/ListingService';
import CurrencyService from '../../../services/CurrencyService';
import type { Listing, ListingPaginationResponse } from '../../../models/Listing';

import { 
  MdAdd, MdAccountCircle, MdVerified, MdEdit, MdDeleteSweep,
  MdSwapHoriz, MdTrendingUp, MdClose, MdInfoOutline, MdLocalFireDepartment
} from "react-icons/md";

interface CurrencyOption {
  value: string;
  label: string;
  flag: string;
  fullName: string;
}

export default function MarketPublication() {
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([]);
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState<boolean>(false);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  
  const [marketRate, setMarketRate] = useState<number | null>(null);
  const [rateLoading, setRateLoading] = useState<boolean>(false);
  const [showRateError, setShowRateError] = useState(false);

  const [formData, setFormData] = useState({
    currency_from: 'XAF',
    currency_to: 'USD',
    amount_available: '',
    user_rate: '',
    description: ''
  });

  const estimatedTotal = useMemo(() => {
    const amount = parseFloat(formData.amount_available);
    const rate = formData.user_rate ? parseFloat(formData.user_rate) : marketRate;
    if (!isNaN(amount) && rate) {
      return (amount * rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return '0.00';
  }, [formData.amount_available, formData.user_rate, marketRate]);

  useEffect(() => {
    const loadCurrencies = async () => {
      try {
        const data = await CurrencyService.getAllCurrencies();
        setCurrencies(data.map(c => ({
          value: c.code, label: c.code, flag: c.flag, fullName: c.name
        })));
      } catch (err) { console.error("Erreur devises", err); }
    };
    loadCurrencies();
  }, []);

  const fetchMyListings = useCallback(async (shouldReset = false) => {
    try {
      setLoading(true);
      const currentPage = shouldReset ? 1 : page;
      const response: ListingPaginationResponse = await ListingService.getUserListings(currentPage);
      setMyListings(prev => shouldReset ? response.data : [...prev, ...response.data]);
      setHasMore(response.current_page < response.last_page);
    } catch (err) {
      console.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchMyListings(); }, [fetchMyListings]);

  useEffect(() => {
    const updateMarketRate = async () => {
      if (!showModal) return;
      if (formData.currency_from === formData.currency_to) { setMarketRate(1); return; }
      try {
        setRateLoading(true);
        const rate = await ListingService.getLiveMarketRate(formData.currency_from, formData.currency_to);
        setMarketRate(rate);
      } catch (err) { console.error(err); } finally { setRateLoading(false); }
    };
    updateMarketRate();
  }, [formData.currency_from, formData.currency_to, showModal]);

  const toggleModal = () => {
    setShowModal(!showModal);
    setShowRateError(false);
  };

  const handleEditClick = (listing: Listing) => {
    setIsEditing(true);
    setCurrentId(listing.listing_id);
    setFormData({
      currency_from: listing.currency_from,
      currency_to: listing.currency_to,
      amount_available: listing.amount_available.toString(),
      user_rate: listing.user_rate.toString(),
      description: listing.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Voulez-vous vraiment supprimer cette annonce ?")) {
      try {
        await ListingService.deleteListing(id);
        setMyListings(prev => prev.filter(l => l.listing_id !== id));
      } catch (err) { alert("Erreur lors de la suppression."); }
    }
  };

  const handleSelectChange = (option: ReactSelectSingleValue<CurrencyOption>, actionMeta: ActionMeta<CurrencyOption>) => {
    if (option && actionMeta.name) {
      setFormData(prev => ({ ...prev, [actionMeta.name!]: option.value }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === 'user_rate') setShowRateError(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalRate = formData.user_rate ? parseFloat(formData.user_rate) : (marketRate || 0);
    
    if (marketRate && finalRate > marketRate) {
        setShowRateError(true);
        return;
    }

    try {
      const payload = {
        ...formData,
        amount_available: parseFloat(formData.amount_available),
        user_rate: finalRate
      };

      if (isEditing && currentId) {
        await ListingService.updateListing(currentId, payload);
      } else {
        await ListingService.createListing(payload);
      }
      toggleModal();
      setPage(1);
      fetchMyListings(true); 
    } catch (err) { alert("Erreur lors de l'enregistrement."); }
  };

  // --- COMPOSANTS CUSTOM POUR SELECT (Identiques à MarketHome) ---
  const CustomOption = (props: any) => (
    <components.Option {...props}>
      <div className="d-flex align-items-center cursor-pointer">
        <img src={props.data.flag} alt="" style={{ width: 22, height: 16, marginRight: 10, borderRadius: 2, objectFit: 'cover' }} />
        <div>
          <span className="fw-bold d-block" style={{ lineHeight: '1.2' }}>{props.data.label}</span>
          <small className="text-muted" style={{ fontSize: '0.75rem' }}>{props.data.fullName}</small>
        </div>
      </div>
    </components.Option>
  );

  const CustomSingleValue = (props: any) => (
    <components.SingleValue {...props}>
      <div className="d-flex align-items-center">
        <img src={props.data.flag} alt="" style={{ width: 20, height: 14, marginRight: 8, borderRadius: 2 }} />
        <span className="fw-bold">{props.data.label}</span>
      </div>
    </components.SingleValue>
  );

  const selectStyles = {
    control: (base: any) => ({
      ...base, border: 'none', backgroundColor: '#f1f3f5', borderRadius: '12px', padding: '4px', boxShadow: 'none'
    }),
    menu: (base: any) => ({ ...base, zIndex: 9999, borderRadius: '12px', overflow: 'hidden' })
  };

  return (
    <div className="market-container w-100 py-4 px-3">
      <div className="mx-auto" style={{ maxWidth: '1200px' }}>
        
        {/* Header Section */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-5 px-2">
          <div className="mb-3 mb-md-0">
            <h3 className="fw-bold mb-0 text-dark">Mes Publications</h3>
            <p className="text-muted small mb-0">Gérez vos offres de change actives en un clic</p>
          </div>
          <button 
            onClick={() => { 
              setIsEditing(false); 
              setFormData({currency_from:'XAF', currency_to:'USD', amount_available:'', user_rate:'', description:''}); 
              toggleModal(); 
            }}
            className="btn btn-excha-orange rounded-pill px-4 py-2 fw-bold text-white shadow-lg d-flex align-items-center"
          >
            <MdAdd size={24} className="me-2" /> <span>Nouvelle Offre</span>
          </button>
        </div>

        {/* Listings Grid */}
        <div className="row g-4">
          {myListings.length === 0 && !loading ? (
            <div className="col-12 text-center py-5">
              <MdInfoOutline size={60} className="text-muted opacity-25 mb-3" />
              <p className="text-muted fw-bold">Vous n'avez aucune annonce en ligne pour le moment.</p>
            </div>
          ) : (
            myListings.map((listing, index) => {
              const delayClass = `card-delay-${(index % 4) + 1}`;
              return (
                <div key={listing.listing_id} className="col-12 col-md-6 col-lg-4">
                  <div className={`card listing-card-premium border-0 shadow-sm rounded-4 h-100 animate-card-floating ${delayClass}`}>
                    <div className="card-body p-4 d-flex flex-column">
                      
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="d-flex align-items-center">
                          <div className="bg-light rounded-pill px-3 py-1 d-flex align-items-center">
                            <span className="fw-bold text-dark">{listing.currency_from}</span>
                            <MdSwapHoriz className="mx-2 text-muted" size={18} />
                            <span className="fw-bold text-dark">{listing.currency_to}</span>
                          </div>
                        </div>
                        <span className="badge bg-success-subtle text-success rounded-pill px-3 border border-success border-opacity-25">Actif</span>
                      </div>

                      <div className="rate-comparison-box p-3 rounded-4 mb-4 text-center">
                          <div className="row g-0 align-items-center">
                              <div className="col-6 text-start">
                                  <span className="d-block text-muted" style={{fontSize: '9px'}}>MONTANT</span>
                                  <span className="fw-bold text-dark">{listing.amount_available} {listing.currency_from}</span>
                              </div>
                              <div className="col-6 text-end">
                                  <span className="d-block text-muted" style={{fontSize: '9px'}}>VOTRE TAUX</span>
                                  <span className="fw-bolder fs-5 text-excha-orange">{listing.user_rate}</span>
                              </div>
                          </div>
                      </div>

                      <div className="d-flex gap-2 mt-auto">
                        <button 
                          onClick={() => handleEditClick(listing)}
                          className="btn btn-dark flex-grow-1 rounded-pill py-2 fw-bold shadow-sm d-flex align-items-center justify-content-center btn-exchange-hover"
                        >
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
              )
            })
          )}
        </div>
        {loading && <div className="text-center p-5"><div className="spinner-border text-excha-orange" role="status" /></div>}
      </div>

      {/* Modal (Identique au MarketHome pour la cohérence) */}
      {showModal && (
        <div className="custom-modal-overlay d-flex align-items-center justify-content-center p-3 animate-fade-in">
          <div className="custom-modal-content bg-white rounded-5 shadow-2xl animate-slide-up">
            <div className="p-4 d-flex justify-content-between align-items-center border-bottom">
                <h5 className="fw-bold mb-0">{isEditing ? 'Modifier l\'offre' : 'Créer une offre'}</h5>
                <button className="btn btn-light rounded-circle p-1" onClick={toggleModal}><MdClose size={20}/></button>
            </div>
            <form className="p-4" onSubmit={handleSubmit}>
                <div className="row g-3">
                    <div className="col-6">
                        <label className="form-label small fw-bold">Je vends</label>
                        <Select name="currency_from" options={currencies} styles={selectStyles} components={{ Option: CustomOption, SingleValue: CustomSingleValue }} value={currencies.find(c => c.value === formData.currency_from)} onChange={handleSelectChange} />
                    </div>
                    <div className="col-6">
                        <label className="form-label small fw-bold">Je veux</label>
                        <Select name="currency_to" options={currencies} styles={selectStyles} components={{ Option: CustomOption, SingleValue: CustomSingleValue }} value={currencies.find(c => c.value === formData.currency_to)} onChange={handleSelectChange} />
                    </div>
                    <div className="col-12 text-center my-2">
                        <div className={`p-2 rounded-4 small fw-bold transition-all ${showRateError ? 'bg-danger-subtle text-danger border border-danger' : 'bg-light text-muted'}`}>
                            {rateLoading ? 'Chargement du taux...' : `Marché : 1 ${formData.currency_from} = ${marketRate || '---'} ${formData.currency_to}`}
                        </div>
                    </div>
                    <div className="col-12">
                        <label className="form-label small fw-bold">Montant disponible ({formData.currency_from})</label>
                        <input type="number" name="amount_available" value={formData.amount_available} onChange={handleChange} className="form-control border-0 bg-light py-2 rounded-3 shadow-none" placeholder="Ex: 500" required />
                    </div>
                    <div className="col-12">
                        <label className="form-label small fw-bold">Votre Taux (Optionnel)</label>
                        <input type="number" step="any" name="user_rate" value={formData.user_rate} onChange={handleChange} className={`form-control border-0 py-2 rounded-3 shadow-none ${showRateError ? 'is-invalid bg-danger-subtle' : 'bg-light'}`} placeholder={`Par défaut: ${marketRate || '...'}`} />
                        {showRateError && <div className="text-danger" style={{fontSize: '10px'}}>Le taux ne peut pas dépasser le prix du marché.</div>}
                    </div>

                    <div className="col-12">
                      <div className="calculation-preview p-3 rounded-4 d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center">
                          <div className="icon-circle me-3 shadow-sm">
                            <MdTrendingUp size={20} className="text-success" />
                          </div>
                          <div>
                            <small className="text-muted d-block fw-bold" style={{fontSize: '10px', letterSpacing: '0.5px'}}>L'ACHETEUR RECEVRA</small>
                            <span className="fw-bolder fs-5 text-dark">{estimatedTotal} {formData.currency_to}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                </div>
                <button type="submit" className="btn btn-excha-orange w-100 rounded-pill mt-4 py-3 fw-bold text-white shadow transition-all">
                    {isEditing ? 'Mettre à jour' : 'Publier l\'annonce'}
                </button>
            </form>
          </div>
        </div>
      )}

      {/* Styles globaux recyclés pour le cohérence */}
      <style>{`
        .market-container { background: #f8f9fa; min-height: 100vh; }
        .btn-excha-orange { background: linear-gradient(135deg, #FF7A00 0%, #FF9500 100%); border: none; transition: transform 0.2s; }
        .btn-excha-orange:hover { transform: scale(1.02); opacity: 0.9; }
        
        /* Animation flottante */
        @keyframes floating {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        .animate-card-floating { animation: floating 4s ease-in-out infinite; }
        .card-delay-1 { animation-delay: 0s; }
        .card-delay-2 { animation-delay: 0.8s; }
        .card-delay-3 { animation-delay: 1.6s; }
        .card-delay-4 { animation-delay: 2.4s; }

        .listing-card-premium { 
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
          border: 1px solid #f0f0f0 !important; 
          background: white;
        }
        .listing-card-premium:hover { 
          box-shadow: 0 20px 40px rgba(0,0,0,0.08) !important; 
          border-color: #FF7A00 !important;
        }

        .rate-comparison-box { background: #f8f9fa; border: 1px solid #eee; }
        .btn-exchange-hover:hover { background-color: #000 !important; transform: translateY(-2px); }

        .custom-modal-overlay { 
          position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
          background: rgba(0,0,0,0.6); z-index: 5000; backdrop-filter: blur(8px); 
        }
        .custom-modal-content { width: 100%; max-width: 460px; border: none; }
        .calculation-preview { background: #f0fff4; border: 2px dashed #c6f6d5; }
        .icon-circle { width: 40px; height: 40px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; }

        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slideUp 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.3s ease-in; }
      `}</style>
    </div>
  );
}