import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import Select, { components } from 'react-select';
import ListingService from '../../../services/ListingService';
import CurrencyService from '../../../services/CurrencyService';
import type { Listing, ListingPaginationResponse } from '../../../models/Listing';
import type { MethodPayment } from '../../../models/MehodPayment';
import { paymentMethodService } from '../../../services/PaymentMethodService';

import { 
  MdAdd, MdAccountCircle, MdVerified, 
  MdPublic, MdLocalFireDepartment, MdTrendingUp, 
  MdClose, MdPayments, MdInfo, MdErrorOutline 
} from "react-icons/md";

interface CurrencyOption {
  value: string;
  label: string;
  flag: string;
  fullName: string;
}

interface PaymentOption {
  value: number;
  label: string;
  provider: string;
  type: string;
}

export default function MarketHome() {
  // --- États ---
  const [listings, setListings] = useState<Listing[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([]);
  const [userMethods, setUserMethods] = useState<PaymentOption[]>([]);
  
  const [selectedCountry, setSelectedCountry] = useState<string>('Tous');
  const [filterFrom, setFilterFrom] = useState<string>('Toutes');
  const [filterTo, setFilterTo] = useState<string>('Toutes');

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [showModal, setShowModal] = useState(false);
  
  const [marketRate, setMarketRate] = useState<number | null>(null);
  const [rateLoading, setRateLoading] = useState<boolean>(false);
  const [showRateError, setShowRateError] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    currency_from: 'XAF',
    currency_to: 'USD',
    amount_available: '',
    user_rate: '',
    description: '',
    method_payment_id: '' as string | number
  });

  // --- Initialisation des données ---
  useEffect(() => {
    const initData = async () => {
      try {
        const [currData, methodsResponse] = await Promise.all([
          CurrencyService.getAllCurrencies(),
          paymentMethodService.getUserMethods()
        ]);

        setCurrencies(currData.map(c => ({
          value: c.code, label: c.code, flag: c.flag, fullName: c.name
        })));

        const methodsArray = methodsResponse.data || [];
        setUserMethods(methodsArray.map((m: MethodPayment) => ({
          value: m.method_payment_id,
          label: `${m.provider} - ${m.account_number} (${m.account_name})`,
          provider: m.provider,
          type: m.type
        })));
      } catch (err) { 
        console.error("Erreur initialisation", err); 
      }
    };
    initData();
  }, []);

  // --- Logique métier (Calcul estimation) ---
  const estimatedTotal = useMemo(() => {
    const amount = parseFloat(formData.amount_available);
    const rate = formData.user_rate ? parseFloat(formData.user_rate) : marketRate;
    if (!isNaN(amount) && amount > 0 && rate) {
      return (amount * rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return '0.00';
  }, [formData.amount_available, formData.user_rate, marketRate]);

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      const response: ListingPaginationResponse = await ListingService.getAllListings(page);
      let filteredData = response.data;

      if (selectedCountry !== 'Tous') filteredData = filteredData.filter(l => l.currency_from === selectedCountry || l.currency_to === selectedCountry);
      if (filterFrom !== 'Toutes') filteredData = filteredData.filter(l => l.currency_from === filterFrom);
      if (filterTo !== 'Toutes') filteredData = filteredData.filter(l => l.currency_to === filterTo);

      setListings(prev => page === 1 ? filteredData : [...prev, ...filteredData]);
      setHasMore(response.current_page < response.last_page);
    } catch (err) { 
      console.error("Erreur listings"); 
    } finally { 
      setLoading(false); 
    }
  }, [page, selectedCountry, filterFrom, filterTo]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  // Infinite Scroll
  const observer = useRef<IntersectionObserver | null>(null);
  const lastListingElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) setPage(prev => prev + 1);
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  // Taux de marché en direct (Live fetch quand la modal est ouverte)
  useEffect(() => {
    const getMarketRate = async () => {
      if (!showModal) return;
      if (formData.currency_from === formData.currency_to) { setMarketRate(1); return; }
      try {
        setRateLoading(true);
        const rate = await ListingService.getLiveMarketRate(formData.currency_from, formData.currency_to);
        setMarketRate(rate);
      } catch (err) { 
        console.error(err); 
      } finally { 
        setRateLoading(false); 
      }
    };
    getMarketRate();
  }, [formData.currency_from, formData.currency_to, showModal]);

  // --- Handlers ---
  const toggleModal = () => {
    setShowModal(!showModal);
    setShowRateError(false);
    setFormError(null);
  };

  const handleFilterChange = (type: 'country' | 'from' | 'to', value: string) => {
    if (type === 'country') setSelectedCountry(value);
    setPage(1);
  };

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

    const finalRate = formData.user_rate ? parseFloat(formData.user_rate) : (marketRate || 0);
    
    if (marketRate && finalRate > marketRate * 1.5) {
        setShowRateError(true);
        setFormError("Votre taux semble anormalement élevé.");
        return;
    }

    try {
      const payload: Partial<Listing> = {
        method_payment_id: Number(formData.method_payment_id),
        currency_from: formData.currency_from,
        currency_to: formData.currency_to,
        amount_available: amount,
        user_rate: finalRate,
        description: formData.description || `Échange ${formData.currency_from} → ${formData.currency_to}`
      };

      await ListingService.createListing(payload); 
      toggleModal();
      setPage(1);
      fetchListings();
      setFormData({ ...formData, amount_available: '', user_rate: '', description: '', method_payment_id: '' });
    } catch (err) { 
      setFormError("Erreur lors de la publication. Vérifiez votre KYC ou votre solde."); 
    }
  };

  // --- UI Custom Select Components ---
  const CustomOption = (props: any) => (
    <components.Option {...props}>
      <div className="d-flex align-items-center cursor-pointer">
        <img src={props.data.flag} alt="" style={{ width: 22, height: 16, marginRight: 10, borderRadius: 2 }} />
        <div>
          <span className="fw-bold d-block">{props.data.label}</span>
          <small className="text-muted" style={{ fontSize: '0.75rem' }}>{props.data.fullName}</small>
        </div>
      </div>
    </components.Option>
  );

  const CustomSingleValue = (props: any) => (
    <components.SingleValue {...props}>
      <div className="d-flex align-items-center">
        {props.data.flag && <img src={props.data.flag} alt="" style={{ width: 20, height: 14, marginRight: 8, borderRadius: 2 }} />}
        <span className="fw-bold">{props.data.label}</span>
      </div>
    </components.SingleValue>
  );

  const selectStyles = {
    control: (base: any) => ({
      ...base, border: 'none', backgroundColor: '#f8f9fa', borderRadius: '14px', padding: '6px', boxShadow: 'none'
    }),
    menu: (base: any) => ({ ...base, zIndex: 9999, borderRadius: '14px', overflow: 'hidden', border: '1px solid #eee' })
  };

  return (
    <div className="market-container w-100 py-4 px-3">
      {/* Header & Filtres */}
      <div className="mx-auto mb-4" style={{ maxWidth: '1200px' }}>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 px-2">
          <div>
            <h3 className="fw-bold mb-0 text-dark">Marché ExchaPay</h3>
            <p className="text-muted small mb-0">Échangez vos devises en toute sécurité via Escrow</p>
          </div>
          <button onClick={toggleModal} className="btn btn-excha-orange rounded-pill px-4 py-2 fw-bold text-white shadow-lg d-flex align-items-center justify-content-center mt-3 mt-md-0 transition-hover">
            <MdAdd size={24} className="me-1" /> <span>Publier une offre</span>
          </button>
        </div>

        {/* Barre de Filtres Pays */}
        <div className="bg-white p-3 rounded-4 shadow-sm border mb-4">
            <label className="form-label small fw-bold text-muted text-uppercase mb-3" style={{letterSpacing: '1px', fontSize: '11px'}}>Filtrer par devise</label>
            <div className="d-flex overflow-x-auto no-scrollbar pt-1 gap-2">
                <button onClick={() => handleFilterChange('country', 'Tous')} className={`filter-pill px-4 py-2 rounded-pill border-0 flex-shrink-0 transition-all ${selectedCountry === 'Tous' ? 'bg-dark text-white shadow' : 'bg-light text-muted'}`}>
                    <MdPublic size={18} className="me-2" /> Tous
                </button>
                {currencies.map((curr) => (
                    <button key={curr.value} onClick={() => handleFilterChange('country', curr.value)} className={`filter-pill px-3 py-2 rounded-pill border-0 flex-shrink-0 transition-all ${selectedCountry === curr.value ? 'bg-excha-orange text-white fw-bold shadow' : 'bg-light text-muted border'}`}>
                        <img src={curr.flag} alt="" className="me-2 rounded-1 shadow-sm" style={{ width: 22, height: 14 }} /> {curr.label}
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* Grid des annonces */}
      <div className="mx-auto" style={{ maxWidth: '1400px' }}>
        <div className="row g-4">
          {listings.map((listing, index) => {
            const isLastElement = listings.length === index + 1;
            const isBestDeal = Number(listing.user_rate) < Number(listing.official_rate);
            
            return (
              <div key={listing.listing_id} ref={isLastElement ? lastListingElementRef : null} className="col-12 col-sm-6 col-md-4 col-xl-3">
                <div className={`card listing-card-premium border-0 shadow-sm rounded-4 h-100 animate-card-floating`}>
                  {isBestDeal && <div className="best-price-badge"><MdLocalFireDepartment size={14} className="me-1 animate-flicker" /> MEILLEUR TAUX</div>}
                  
                  <div className="card-body p-4 d-flex flex-column">
                    <div className="d-flex align-items-center mb-3">
                        <MdAccountCircle size={40} className="text-secondary me-2" />
                        <div>
                          <div className="fw-bold small">{listing.utilisateur?.firstname}</div>
                          <div className="d-flex align-items-center"><MdVerified className="text-primary me-1" size={14} /><span style={{fontSize: '10px'}} className="text-muted fw-bold">VÉRIFIÉ</span></div>
                        </div>
                    </div>

                    <div className="mb-3 px-3 py-1 rounded-pill bg-light border d-inline-flex align-items-center" style={{fontSize: '11px'}}>
                        <MdPayments className="text-muted me-2" />
                        <span className="text-muted">Via : </span>
                        <strong className="ms-1 text-dark text-uppercase">{listing.payment_method?.provider || 'Mobile Money'}</strong>
                    </div>

                    <div className="rate-comparison-box p-3 rounded-4 mb-4">
                        <div className="row g-0 align-items-center text-center">
                            <div className="col-5">
                                <span className="d-block text-muted mb-1" style={{fontSize: '10px'}}>MARCHÉ</span>
                                <span className="fw-bold text-dark">{listing.official_rate}</span>
                            </div>
                            <div className="col-2"><div className="vs-circle shadow-sm">VS</div></div>
                            <div className="col-5">
                                <span className="d-block text-muted mb-1" style={{fontSize: '10px'}}>OFFRE</span>
                                <span className={`fw-bolder fs-5 ${isBestDeal ? 'text-success' : 'text-excha-orange'}`}>{listing.user_rate}</span>
                            </div>
                        </div>
                    </div>

                    <div className="exchange-details flex-grow-1">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <small className="text-muted fw-bold">Disponible</small>
                            <span className="fw-bolder text-dark">{listing.amount_available} {listing.currency_from}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <small className="text-muted fw-bold">Cible</small>
                            <span className="badge bg-primary-subtle text-primary rounded-pill px-3 py-2">{listing.currency_to}</span>
                        </div>
                    </div>

                    <button className="btn btn-dark w-100 rounded-pill py-2 fw-bold btn-exchange-hover shadow-sm">Échanger</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {loading && <div className="text-center py-5"><div className="spinner-border text-excha-orange"></div></div>}
      </div>

      {/* --- MODAL DE PUBLICATION --- */}
      {showModal && (
        <div className="custom-modal-overlay d-flex align-items-center justify-content-center p-3 animate-fade-in" style={{position:'fixed', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.5)', zIndex: 1050}}>
          <div className="custom-modal-content bg-white rounded-5 shadow-2xl animate-slide-up" style={{maxWidth: '520px', width: '100%', maxHeight:'90vh', overflowY:'auto'}}>
            <div className="p-4 d-flex justify-content-between align-items-center border-bottom sticky-top bg-white">
                <div>
                    <h5 className="fw-bold mb-0">Créer une offre</h5>
                    <p className="text-muted small mb-0">Votre annonce sera visible sur le marché</p>
                </div>
                <button className="btn btn-light rounded-circle p-2" onClick={toggleModal}><MdClose size={22}/></button>
            </div>
            
            <form className="p-4" onSubmit={handleSubmit}>
                {formError && (
                    <div className="alert alert-danger rounded-4 py-2 px-3 d-flex align-items-center small mb-4">
                        <MdErrorOutline size={18} className="me-2" /> {formError}
                    </div>
                )}

                <div className="row g-3">
                    <div className="col-12">
                        <label className="form-label small fw-bold text-dark d-flex align-items-center">
                            <MdPayments size={18} className="text-excha-orange me-2" /> 
                            Compte de réception ({formData.currency_to})
                        </label>
                        <Select 
                            options={userMethods} 
                            styles={selectStyles}
                            placeholder="Choisir mon compte..."
                            onChange={(opt: any) => {
                                setFormData({...formData, method_payment_id: opt.value});
                                setFormError(null);
                            }}
                            noOptionsMessage={() => "Aucun compte enregistré."}
                        />
                    </div>

                    <div className="col-6">
                        <label className="form-label small fw-bold">Je vends</label>
                        <Select options={currencies} styles={selectStyles} components={{ Option: CustomOption, SingleValue: CustomSingleValue }} value={currencies.find(c => c.value === formData.currency_from)} onChange={(opt: any) => setFormData({...formData, currency_from: opt.value})} />
                    </div>
                    <div className="col-6">
                        <label className="form-label small fw-bold">Je veux</label>
                        <Select options={currencies} styles={selectStyles} components={{ Option: CustomOption, SingleValue: CustomSingleValue }} value={currencies.find(c => c.value === formData.currency_to)} onChange={(opt: any) => setFormData({...formData, currency_to: opt.value})} />
                    </div>

                    <div className="col-12 text-center">
                        <div className="p-2 rounded-4 small fw-bold bg-light border text-muted transition-all">
                            {rateLoading ? (
                                <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                            ) : (
                                <span>Taux marché : 1 {formData.currency_from} = <strong>{marketRate || '...'}</strong> {formData.currency_to}</span>
                            )}
                        </div>
                    </div>

                    <div className="col-12">
                        <label className="form-label small fw-bold">Montant à vendre ({formData.currency_from})</label>
                        <input 
                            type="number" 
                            min="0.01" 
                            step="any"
                            value={formData.amount_available} 
                            onChange={(e) => {
                                setFormData({...formData, amount_available: e.target.value});
                                setFormError(null);
                            }} 
                            className="form-control border-0 bg-light py-3 rounded-4 fw-bold" 
                            placeholder="Ex: 500" 
                            required 
                        />
                    </div>

                    <div className="col-12">
                        <label className="form-label small fw-bold">Votre Taux personnalisé (Optionnel)</label>
                        <input 
                            type="number" 
                            step="any" 
                            value={formData.user_rate} 
                            onChange={(e) => setFormData({...formData, user_rate: e.target.value})} 
                            className="form-control border-0 bg-light py-3 rounded-4" 
                            placeholder={`Par défaut: ${marketRate || '...'}`} 
                        />
                        <div className="mt-2 px-2 text-muted" style={{fontSize: '11px'}}>
                            Laissez vide pour utiliser le taux du marché en temps réel.
                        </div>
                    </div>

                    <div className="col-12">
                      <div className="calculation-preview p-3 rounded-4 d-flex align-items-center justify-content-between shadow-sm" style={{backgroundColor: '#fff9f5', border: '1px dashed #fd7e14'}}>
                          <div className="icon-circle bg-white shadow-sm p-2 rounded-circle me-3"><MdTrendingUp size={24} className="text-success" /></div>
                          <div className="flex-grow-1 text-end">
                            <small className="text-muted d-block fw-bold" style={{fontSize: '11px'}}>VOUS RECEVREZ ENVIRON</small>
                            <span className="fw-bolder fs-4 text-excha-orange">{estimatedTotal} {formData.currency_to}</span>
                          </div>
                      </div>
                    </div>
                </div>

                <button type="submit" className="btn btn-excha-orange w-100 rounded-pill mt-4 py-3 fw-bold text-white shadow-lg btn-publish-main">
                  Confirmer et Publier
                </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}