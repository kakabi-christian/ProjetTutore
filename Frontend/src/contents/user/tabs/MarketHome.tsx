import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import Select, { components } from 'react-select';
import type { ActionMeta } from 'react-select';
import type { SingleValue as ReactSelectSingleValue } from 'react-select';

import ListingService from '../../../services/ListingService';
import type { Listing, ListingPaginationResponse } from '../../../models/Listing';
import { 
  MdAdd, MdAccountCircle, MdVerified, 
  MdPublic, MdSwapHoriz, MdLocalFireDepartment, MdTrendingUp, MdClose
} from "react-icons/md";
import CurrencyService from '../../../services/CurrencyService';

interface CurrencyOption {
  value: string;
  label: string;
  flag: string;
  fullName: string;
}

export default function MarketHome() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([]);
  
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

  const observer = useRef<IntersectionObserver | null>(null);
  const lastListingElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  useEffect(() => {
    const loadCurrencies = async () => {
      try {
        const data = await CurrencyService.getAllCurrencies();
        const formatted = data.map(c => ({
          value: c.code, label: c.code, flag: c.flag, fullName: c.name
        }));
        setCurrencies(formatted);
      } catch (err) { console.error("Erreur devises", err); }
    };
    loadCurrencies();
  }, []);

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      const response: ListingPaginationResponse = await ListingService.getAllListings(page);
      let filteredData = response.data;

      if (selectedCountry !== 'Tous') {
        filteredData = filteredData.filter(l => l.currency_from === selectedCountry || l.currency_to === selectedCountry);
      }
      if (filterFrom !== 'Toutes') {
        filteredData = filteredData.filter(l => l.currency_from === filterFrom);
      }
      if (filterTo !== 'Toutes') {
        filteredData = filteredData.filter(l => l.currency_to === filterTo);
      }

      setListings(prev => page === 1 ? filteredData : [...prev, ...filteredData]);
      setHasMore(response.current_page < response.last_page);
    } catch (err) {
      console.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [page, selectedCountry, filterFrom, filterTo]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const handleFilterChange = (type: 'country' | 'from' | 'to', value: string) => {
    if (type === 'country') setSelectedCountry(value);
    if (type === 'from') setFilterFrom(value);
    if (type === 'to') setFilterTo(value);
    setPage(1);
  };

  useEffect(() => {
    const getMarketRate = async () => {
      if (!showModal) return;
      if (formData.currency_from === formData.currency_to) { setMarketRate(1); return; }
      try {
        setRateLoading(true);
        const rate = await ListingService.getLiveMarketRate(formData.currency_from, formData.currency_to);
        setMarketRate(rate);
        setShowRateError(false);
      } catch (err) { console.error(err); } finally { setRateLoading(false); }
    };
    getMarketRate();
  }, [formData.currency_from, formData.currency_to, showModal]);

  const toggleModal = () => {
    setShowModal(!showModal);
    setShowRateError(false);
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
      const payload: Partial<Listing> = {
        currency_from: formData.currency_from,
        currency_to: formData.currency_to,
        amount_available: parseFloat(formData.amount_available),
        user_rate: finalRate,
        description: formData.description || `Échange ${formData.currency_from} → ${formData.currency_to}`
      };

      await ListingService.createListing(payload); 
      toggleModal();
      setPage(1);
      fetchListings();
      setFormData({ ...formData, amount_available: '', user_rate: '', description: '' });
    } catch (err) { alert("Erreur lors de la publication."); }
  };

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

  const filterOptions = useMemo(() => [
    { value: 'Toutes', label: 'Toutes les monnaies', flag: '', fullName: 'Toutes' },
    ...currencies
  ], [currencies]);

  return (
    <div className="market-container w-100 py-4 px-3">
      {/* Header & Filtres */}
      <div className="mx-auto mb-4" style={{ maxWidth: '1200px' }}>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 px-2">
          <div className="mb-3 mb-md-0">
             <h3 className="fw-bold mb-0 text-dark">Marché ExchaPay</h3>
             <p className="text-muted small mb-0">Trouvez les meilleurs taux de change en direct</p>
          </div>
          <button onClick={toggleModal} className="btn btn-excha-orange rounded-pill px-4 py-2 fw-bold text-white shadow-lg d-flex align-items-center justify-content-center">
            <MdAdd size={22} className="me-1" /> <span>Publier une offre</span>
          </button>
        </div>

        <div className="bg-white p-3 rounded-4 shadow-sm border mb-4">
          <div className="row g-3 align-items-center">
            <div className="col-12 border-bottom pb-3 mb-2">
              <label className="form-label small fw-bold text-muted text-uppercase" style={{fontSize: '10px', letterSpacing: '1px'}}>Filtrer par pays</label>
              <div className="country-filter-bar d-flex overflow-x-auto no-scrollbar align-items-center pt-1">
                <button
                  onClick={() => handleFilterChange('country', 'Tous')}
                  className={`filter-pill me-2 px-3 py-2 rounded-pill border-0 transition-all flex-shrink-0 d-flex align-items-center ${
                    selectedCountry === 'Tous' ? 'bg-dark text-white' : 'bg-light text-muted border'
                  }`}
                >
                  <MdPublic size={18} className="me-2" /> Tous
                </button>
                {currencies.map((curr) => (
                  <button
                    key={curr.value}
                    onClick={() => handleFilterChange('country', curr.value)}
                    className={`filter-pill me-2 px-3 py-2 rounded-pill border-0 transition-all flex-shrink-0 d-flex align-items-center ${
                      selectedCountry === curr.value ? 'bg-excha-orange text-white shadow-sm fw-bold' : 'bg-light text-muted border'
                    }`}
                  >
                    <img src={curr.flag} alt="" className="me-2 rounded-1" style={{ width: 20, height: 14 }} /> {curr.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="col-12 col-md-5">
              <label className="form-label small fw-bold text-muted" style={{fontSize: '10px'}}>JE DÉTIENS</label>
              <Select 
                options={filterOptions}
                styles={selectStyles}
                value={filterOptions.find((o: CurrencyOption) => o.value === filterFrom)}
                onChange={(opt) => handleFilterChange('from', opt?.value || 'Toutes')}
                components={{ Option: CustomOption, SingleValue: CustomSingleValue }}
              />
            </div>

            <div className="col-12 col-md-2 text-center d-none d-md-block">
              <MdSwapHoriz size={28} className="text-muted mt-3" />
            </div>

            <div className="col-12 col-md-5">
              <label className="form-label small fw-bold text-muted" style={{fontSize: '10px'}}>JE RECHERCHE</label>
              <Select 
                options={filterOptions}
                styles={selectStyles}
                value={filterOptions.find((o: CurrencyOption) => o.value === filterTo)}
                onChange={(opt) => handleFilterChange('to', opt?.value || 'Toutes')}
                components={{ Option: CustomOption, SingleValue: CustomSingleValue }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Liste des annonces avec ANIMATIONS INFINIES */}
      <div className="mx-auto" style={{ maxWidth: '1400px' }}>
        <div className="row g-4">
          {listings.map((listing, index) => {
            const isLastElement = listings.length === index + 1;
            const officialRate = listing.official_rate || '---';
            const isBestDeal = Number(listing.user_rate) < Number(officialRate);
            
            // On alterne les classes de délai pour un effet moins "robotique"
            const delayClass = `card-delay-${(index % 4) + 1}`;

            return (
              <div key={listing.listing_id} ref={isLastElement ? lastListingElementRef : null} className="col-12 col-sm-6 col-md-4 col-xl-3">
                <div className={`card listing-card-premium border-0 shadow-sm rounded-4 h-100 overflow-hidden animate-card-floating ${delayClass}`}>
                  {isBestDeal && (
                    <div className="best-price-badge">
                      <MdLocalFireDepartment size={14} className="me-1 animate-flicker" /> MEILLEUR TAUX
                    </div>
                  )}
                  <div className="card-body p-4 d-flex flex-column">
                    <div className="d-flex align-items-center mb-3">
                        <div className="profile-icon-wrapper me-2">
                            <MdAccountCircle size={38} className="text-secondary" />
                        </div>
                        <div>
                            <div className="fw-bold small">{listing.utilisateur?.firstname || 'Utilisateur'}</div>
                            <div className="d-flex align-items-center">
                                <MdVerified className="text-primary me-1" size={12} />
                                <span style={{fontSize: '9px'}} className="text-muted fw-bold text-uppercase">Vérifié</span>
                            </div>
                        </div>
                    </div>

                    <div className="rate-comparison-box p-3 rounded-4 mb-4 text-center">
                        <div className="row g-0 align-items-center">
                            <div className="col-5">
                                <span className="d-block text-muted" style={{fontSize: '9px'}}>OFFICIEL</span>
                                <span className="fw-bold text-dark">{officialRate}</span>
                            </div>
                            <div className="col-2"><div className="vs-circle">VS</div></div>
                            <div className="col-5">
                                <span className="d-block text-muted" style={{fontSize: '9px'}}>PROPOSÉ</span>
                                <span className={`fw-bolder fs-5 ${isBestDeal ? 'text-success' : 'text-excha-orange'}`}>{listing.user_rate}</span>
                            </div>
                        </div>
                    </div>

                    <div className="exchange-details flex-grow-1">
                        <div className="d-flex justify-content-between mb-2">
                            <small className="text-muted fw-bold">Dispo.</small>
                            <span className="fw-bolder">{listing.amount_available} {listing.currency_from}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-4">
                            <small className="text-muted fw-bold">Cible</small>
                            <span className="badge bg-primary-subtle text-primary rounded-pill px-3">{listing.currency_to}</span>
                        </div>
                    </div>

                    <button className="btn btn-dark w-100 rounded-pill py-2 fw-bold shadow-sm mt-auto btn-exchange-hover">
                        Échanger
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {loading && <div className="text-center p-5"><div className="spinner-border text-excha-orange" role="status" /></div>}
      </div>

      {/* Modal de Publication */}
      {showModal && (
        <div className="custom-modal-overlay d-flex align-items-center justify-content-center p-3 animate-fade-in">
          <div className="custom-modal-content bg-white rounded-5 shadow-2xl animate-slide-up">
            <div className="p-4 d-flex justify-content-between align-items-center border-bottom">
                <h5 className="fw-bold mb-0">Créer une offre</h5>
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
                            <small className="text-muted d-block fw-bold" style={{fontSize: '10px', letterSpacing: '0.5px'}}>VOUS RECEVREZ</small>
                            <span className="fw-bolder fs-5 text-dark">{estimatedTotal} {formData.currency_to}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                </div>
                <button type="submit" className="btn btn-excha-orange w-100 rounded-pill mt-4 py-3 fw-bold text-white shadow transition-all">
                    Publier l'annonce
                </button>
            </form>
          </div>
        </div>
      )}

      {/* Styles mis à jour avec animations */}
      <style>{`
        .market-container { background: #f8f9fa; min-height: 100vh; }
        .btn-excha-orange { background: linear-gradient(135deg, #FF7A00 0%, #FF9500 100%); border: none; transition: transform 0.2s; }
        .btn-excha-orange:hover { transform: scale(1.02); opacity: 0.9; }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .filter-pill { font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.3s ease; }
        
        /* Animation flottante infinie des cartes */
        @keyframes floating {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }

        .animate-card-floating {
          animation: floating 4s ease-in-out infinite;
        }

        /* Délais d'animation pour un effet naturel */
        .card-delay-1 { animation-delay: 0s; }
        .card-delay-2 { animation-delay: 0.8s; }
        .card-delay-3 { animation-delay: 1.6s; }
        .card-delay-4 { animation-delay: 2.4s; }

        .listing-card-premium { 
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
          border: 1px solid #f0f0f0 !important; 
          position: relative; 
          background: white;
        }
        
        /* On garde le hover pour accentuer l'effet quand l'utilisateur survole */
        .listing-card-premium:hover { 
          animation-play-state: paused; /* Optionnel: stoppe l'animation au survol */
          box-shadow: 0 20px 40px rgba(0,0,0,0.1) !important; 
          border-color: #FF7A00 !important;
          z-index: 10;
        }

        .btn-exchange-hover:hover { background-color: #000 !important; transform: translateY(-2px); }

        .best-price-badge { 
          position: absolute; top: 0; right: 0; background: #ff4d4d; color: white; padding: 5px 15px; 
          font-size: 10px; font-weight: 900; border-bottom-left-radius: 20px; 
          display: flex; align-items: center; z-index: 5; box-shadow: -2px 2px 10px rgba(255, 77, 77, 0.3);
        }

        .rate-comparison-box { background: #f8f9fa; border: 1px solid #eee; }
        .vs-circle { 
          width: 24px; height: 24px; background: #fff; border-radius: 50%; 
          display: flex; align-items: center; justify-content: center; 
          font-size: 8px; font-weight: 900; color: #adb5bd; 
          border: 1px solid #eee; margin: 0 auto; 
        }

        .custom-modal-overlay { 
          position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
          background: rgba(0,0,0,0.6); z-index: 5000; backdrop-filter: blur(8px); 
        }
        .custom-modal-content { width: 100%; max-width: 460px; border: none; }

        .calculation-preview { 
          background: #f0fff4; 
          border: 2px dashed #c6f6d5; 
        }

        @keyframes flicker {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
        .animate-flicker { animation: flicker 1.5s infinite; }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { animation: slideUp 0.4s ease-out; }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in { animation: fadeIn 0.3s ease-in; }
      `}</style>
    </div>
  );
}