import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import Select, { components } from 'react-select';
import type { ActionMeta } from 'react-select';
import type { SingleValue as ReactSelectSingleValue } from 'react-select';

import ListingService from '../../../services/ListingService';
import type { Listing, ListingPaginationResponse } from '../../../models/Listing';
import { 
  MdAdd, MdAccountCircle, MdVerified, 
  MdPublic, MdSwapHoriz, MdLocalFireDepartment, MdTrendingUp
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
      return (amount * rate).toLocaleString();
    }
    return '0';
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
      const data = await CurrencyService.getAllCurrencies();
      const formatted = data.map(c => ({
        value: c.code, label: c.code, flag: c.flag, fullName: c.name
      }));
      setCurrencies(formatted);
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
      if (formData.currency_from === formData.currency_to) { setMarketRate(null); return; }
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
    
    // Correction de l'erreur TS : on s'assure que finalRate n'est jamais null pour le payload
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
        user_rate: finalRate, // Maintenant garanti comme number
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
      <div className="d-flex align-items-center">
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
      ...base, border: 'none', backgroundColor: '#f8f9fa', borderRadius: '12px', padding: '2px', boxShadow: 'none'
    }),
    menu: (base: any) => ({ ...base, zIndex: 9999 })
  };

  const filterOptions = useMemo(() => [
    { value: 'Toutes', label: 'Toutes les monnaies', flag: '', fullName: 'Toutes' },
    ...currencies
  ], [currencies]);

  return (
    <div className="market-container w-100 py-4 px-3">
      <div className="mx-auto mb-4" style={{ maxWidth: '1200px' }}>
        <div className="d-flex justify-content-between align-items-center mb-4 px-2">
          <div>
             <h3 className="fw-bold mb-0 text-dark">Marché ExchaPay</h3>
             <p className="text-muted small mb-0">Trouvez les meilleurs taux de change en direct</p>
          </div>
          <button onClick={toggleModal} className="btn btn-excha-orange rounded-pill px-4 fw-bold text-white shadow-lg d-flex align-items-center">
            <MdAdd size={22} className="me-1" /> <span className="d-none d-sm-inline">Publier une offre</span>
          </button>
        </div>

        <div className="bg-white p-3 rounded-4 shadow-sm border mb-4">
          <div className="row g-3 align-items-center">
            <div className="col-12 border-bottom pb-3 mb-2">
              <label className="form-label small fw-bold text-muted text-uppercase" style={{fontSize: '10px'}}>Par Pays</label>
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
                placeholder="Monnaie vendue..."
              />
            </div>

            <div className="col-12 col-md-2 text-center d-none d-md-block">
              <MdSwapHoriz size={24} className="text-muted mt-3" />
            </div>

            <div className="col-12 col-md-5">
              <label className="form-label small fw-bold text-muted" style={{fontSize: '10px'}}>JE RECHERCHE</label>
              <Select 
                options={filterOptions}
                styles={selectStyles}
                value={filterOptions.find((o: CurrencyOption) => o.value === filterTo)}
                onChange={(opt) => handleFilterChange('to', opt?.value || 'Toutes')}
                components={{ Option: CustomOption, SingleValue: CustomSingleValue }}
                placeholder="Monnaie reçue..."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto" style={{ maxWidth: '1400px' }}>
        <div className="row g-4">
          {listings.map((listing, index) => {
            const isLastElement = listings.length === index + 1;
            const officialRate = listing.official_rate || '---';
            const isBestDeal = Number(listing.user_rate) < Number(officialRate);

            return (
              <div key={listing.listing_id} ref={isLastElement ? lastListingElementRef : null} className="col-12 col-sm-6 col-md-4 col-xl-3">
                <div className="card listing-card-premium border-0 shadow-sm rounded-4 h-100 overflow-hidden">
                  {isBestDeal && (
                    <div className="best-price-badge">
                      <MdLocalFireDepartment size={14} className="me-1" /> MEILLEUR PRIX
                    </div>
                  )}
                  <div className="card-body p-4 d-flex flex-column">
                    <div className="d-flex align-items-center mb-3">
                        <MdAccountCircle size={36} className="text-secondary me-2" />
                        <div>
                            <div className="fw-bold small">{listing.utilisateur?.firstname || 'Trader'}</div>
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
                            <small className="text-muted fw-bold">Disponible</small>
                            <span className="fw-bolder">{listing.amount_available} {listing.currency_from}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-4">
                            <small className="text-muted fw-bold">Reçoit</small>
                            <span className="badge bg-primary-subtle text-primary rounded-pill px-3">{listing.currency_to}</span>
                        </div>
                    </div>

                    <button className="btn btn-dark w-100 rounded-pill py-2 fw-bold shadow-sm mt-auto">
                        Échanger
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {loading && <div className="text-center p-5"><div className="spinner-border text-excha-orange" /></div>}
      </div>

      {showModal && (
        <div className="custom-modal-overlay d-flex align-items-center justify-content-center p-3">
          <div className="custom-modal-content bg-white rounded-5 shadow-2xl">
            <div className="p-4 d-flex justify-content-between align-items-center border-bottom">
                <h5 className="fw-bold mb-0">Créer une offre</h5>
                <button className="btn-close" onClick={toggleModal}></button>
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
                        <div className={`p-2 rounded-4 small fw-bold ${showRateError ? 'bg-danger-subtle text-danger' : 'bg-light text-muted'}`}>
                            Marché : 1 {formData.currency_from} = {rateLoading ? '...' : marketRate || '---'} {formData.currency_to}
                        </div>
                    </div>
                    <div className="col-12">
                        <label className="form-label small fw-bold">Montant disponible ({formData.currency_from})</label>
                        <input type="number" name="amount_available" value={formData.amount_available} onChange={handleChange} className="form-control border-0 bg-light py-2 rounded-3 shadow-none" placeholder="Ex: 100" required />
                    </div>
                    <div className="col-12">
                        <label className="form-label small fw-bold">Votre Taux (Optionnel)</label>
                        <input type="number" step="any" name="user_rate" value={formData.user_rate} onChange={handleChange} className={`form-control border-0 py-2 rounded-3 shadow-none ${showRateError ? 'is-invalid bg-danger-subtle' : 'bg-light'}`} placeholder={`Par défaut: ${marketRate || '...'}`} />
                    </div>

                    <div className="col-12">
                      <div className="calculation-preview p-3 rounded-4 d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center">
                          <div className="icon-circle me-3">
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
                <button type="submit" className="btn btn-excha-orange w-100 rounded-pill mt-4 py-3 fw-bold text-white shadow">
                    Publier sur le marché
                </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .market-container { background: #f8f9fa; min-height: 100vh; }
        .btn-excha-orange { background: linear-gradient(135deg, #FF7A00 0%, #FF9500 100%); border: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .filter-pill { font-size: 13px; font-weight: 500; cursor: pointer; }
        .listing-card-premium { transition: all 0.3s ease; border: 1px solid #eee !important; position: relative; }
        .listing-card-premium:hover { transform: translateY(-5px); box-shadow: 0 10px 25px rgba(0,0,0,0.05) !important; }
        .best-price-badge { 
          position: absolute; top: 0; right: 0; background: #ff4d4d; color: white; padding: 5px 12px; font-size: 9px; font-weight: 900; 
          border-bottom-left-radius: 15px; display: flex; align-items: center; z-index: 5;
        }
        .rate-comparison-box { background: #f1f3f5; }
        .vs-circle { width: 22px; height: 22px; background: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 7px; font-weight: 900; color: #adb5bd; border: 1px solid #dee2e6; margin: 0 auto; }
        .custom-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 4000; backdrop-filter: blur(5px); }
        .custom-modal-content { width: 100%; max-width: 450px; }
        .calculation-preview { background: #e8f5e9; border: 1px dashed #2e7d32; }
        .icon-circle { width: 40px; height: 40px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
      `}</style>
    </div>
  );
}