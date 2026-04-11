import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { components } from "react-select";
import ListingService from "../../../services/ListingService";
import type { Listing, ListingPaginationResponse } from "../../../models/Listing";
import ListingCard from "../../../components/ListingCard";
import UserAddListing from "../../../components/UserAddListing";
import ExchangeModal from "../../../components/Exchangemodal";
import CurrencyService from "../../../services/CurrencyService";
import { paymentMethodService } from "../../../services/PaymentMethodService";

import { 
  MdAdd, MdPublic, MdSearch, MdSort, 
  MdFiberManualRecord 
} from "react-icons/md";

// --- Composants Custom Select ---
const CustomOption = (props: any) => (
  <components.Option {...props}>
    <div className="d-flex align-items-center cursor-pointer p-1">
      <img src={props.data.flag} alt="" className="rounded-1 me-2" style={{ width: 22, height: 15 }} />
      <div>
        <span className="fw-bold d-block small">{props.data.label}</span>
        <small className="text-muted" style={{ fontSize: "0.7rem" }}>{props.data.fullName}</small>
      </div>
    </div>
  </components.Option>
);

const CustomSingleValue = (props: any) => (
  <components.SingleValue {...props}>
    <div className="d-flex align-items-center">
      <img src={props.data.flag} alt="" className="rounded-1 me-2" style={{ width: 20, height: 14 }} />
      <span className="fw-bold small">{props.data.label}</span>
    </div>
  </components.SingleValue>
);

const selectStyles = {
  control: (base: any) => ({
    ...base,
    border: "1px solid #eee",
    borderRadius: "12px",
    padding: "2px",
    boxShadow: "none",
    "&:hover": { border: "1px solid #FF7A00" }
  }),
};

export default function MarketHome() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [userMethods, setUserMethods] = useState<any[]>([]);
  
  const [selectedCountry, setSelectedCountry] = useState<string>("Tous");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  const isInitialMount = useRef(true);

  // --- 1. Initialisation des métadonnées (Une seule fois) ---
  useEffect(() => {
    const initData = async () => {
      try {
        const [currData, methodsResponse] = await Promise.all([
          CurrencyService.getAllCurrencies(),
          paymentMethodService.getUserMethods(),
        ]);
        setCurrencies(currData.map((c) => ({
          value: c.code, label: c.code, flag: c.flag, fullName: c.name,
        })));
        setUserMethods((methodsResponse.data || []).map((m: any) => ({
          value: m.method_payment_id,
          label: `${m.provider} - ${m.account_number}`,
        })));
      } catch (err) { console.error("❌ Erreur init:", err); }
    };
    initData();
  }, []);

  // --- 2. Fonction de Fetch (Stabilisée) ---
  const fetchListings = useCallback(async (targetPage: number, isRefresh = false) => {
    // Si on est déjà en train de charger, on ignore (sauf si c'est un refresh auto)
    if (loading && !isRefresh) return;
    
    try {
      if (!isRefresh) setLoading(true);
      const response: ListingPaginationResponse = await ListingService.getAllListings(targetPage);
      
      setListings((prev) => {
        if (targetPage === 1 || isRefresh) return response.data;
        // Filtrer les doublons éventuels par listing_id
        const newItems = response.data.filter(
          (newItem) => !prev.some((oldItem) => oldItem.listing_id === newItem.listing_id)
        );
        return [...prev, ...newItems];
      });
      
      setHasMore(response.current_page < response.last_page);
    } catch (err) { 
      console.error(`❌ Erreur Fetch:`, err); 
    } finally { 
      setLoading(false); 
    }
  }, [loading]);

  // Déclencheur de changement de page
  useEffect(() => {
    fetchListings(page);
  }, [page]);

  // Refresh automatique toutes les 60 secondes (plus raisonnable vu la lenteur API)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) fetchListings(1, true);
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchListings, loading]);

  const handleListingCreated = () => {
    setShowModal(false);
    if (page === 1) fetchListings(1, true);
    else setPage(1);
  };

  // --- 3. Filtrage et Tri (Memoized) ---
  const filteredAndSortedListings = useMemo(() => {
    let result = [...listings];
    if (selectedCountry !== "Tous") {
      result = result.filter(l => l.currency_from === selectedCountry || l.currency_to === selectedCountry);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l => 
        l.amount_available.toString().includes(q) || 
        l.utilisateur?.firstname?.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => sortBy === "rate" ? Number(a.user_rate) - Number(b.user_rate) : b.listing_id - a.listing_id);
    return result;
  }, [listings, selectedCountry, searchQuery, sortBy]);

  // --- 4. Intersection Observer pour Pagination Infinie ---
  const observer = useRef<IntersectionObserver | null>(null);
  const lastListingRef = useCallback((node: any) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        setPage(p => p + 1);
      }
    }, { threshold: 0.8 }); // On attend que l'élément soit bien visible

    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  return (
    <div className="market-container w-100 py-4 px-3 bg-market min-vh-100">
      <div className="mx-auto mb-4" style={{ maxWidth: "1200px" }}>
        
        {/* En-tête */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 px-2">
          <div>
            <div className="d-flex align-items-center mb-1">
              <h2 className="fw-black mb-0 text-dark me-3">Marché ExchaPay</h2>
              <div className="live-indicator-red">
                <span className="radar-ping"></span>
                <MdFiberManualRecord className="pulse-icon" />
                <span>DIRECT</span>
              </div>
            </div>
           
          </div>
          
          <button onClick={() => setShowModal(true)} className="btn btn-publish shadow-orange mt-3 mt-md-0">
            <MdAdd size={22} className="me-1" /> Créer une annonce
          </button>
        </div>

        {/* Filtres */}
        <div className="filter-glass p-3 rounded-4 mb-4">
          <div className="row g-3 align-items-center">
            <div className="col-lg-4 col-md-6">
              <div className="search-box">
                <MdSearch className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Filtrer par montant ou nom..." 
                  className="form-control border-0 bg-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <div className="col-lg-2 col-md-6">
               <div className="sort-box px-2">
                  <MdSort className="text-muted me-1" />
                  <select 
                    className="form-select form-select-sm border-0 bg-transparent fw-bold"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="recent">Plus récents</option>
                    <option value="rate">Meilleur Taux</option>
                  </select>
               </div>
            </div>

            <div className="col-lg-6 col-12">
              <div className="d-flex overflow-x-auto gap-2 no-scrollbar px-2">
                <button
                  onClick={() => setSelectedCountry("Tous")}
                  className={`pill-btn ${selectedCountry === "Tous" ? "active" : ""}`}
                >
                  <MdPublic className="me-1" /> Tous
                </button>
                {currencies.map((curr) => (
                  <button
                    key={curr.value}
                    onClick={() => setSelectedCountry(curr.value)}
                    className={`pill-btn ${selectedCountry === curr.value ? "active" : ""}`}
                  >
                    <img src={curr.flag} alt="" className="me-2 flag-img" />
                    {curr.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des annonces */}
      <div className="mx-auto" style={{ maxWidth: "1350px" }}>
        {loading && page === 1 ? (
          <div className="row g-4">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="col-md-6 col-lg-4 col-xl-3">
                <div className="skeleton-card"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="row g-4">
            {filteredAndSortedListings.map((listing, index) => (
              <ListingCard
                key={`${listing.listing_id}-${index}`}
                listing={listing}
                index={index}
                innerRef={index === filteredAndSortedListings.length - 1 ? lastListingRef : undefined}
                onExchange={(l) => setSelectedListing(l)}
              />
            ))}
            
            {/* Petit loader de pagination si on charge la page suivante */}
            {loading && page > 1 && (
              <div className="col-12 text-center py-4">
                 <div className="spinner-border text-primary" role="status"></div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedListing && (
        <ExchangeModal listing={selectedListing} onClose={() => setSelectedListing(null)} />
      )}

      {showModal && (
        <UserAddListing
          show={showModal}
          onClose={() => setShowModal(false)} 
          onSuccess={handleListingCreated}
          currencies={currencies}
          userMethods={userMethods}
          selectStyles={selectStyles}
          CustomOption={CustomOption}
          CustomSingleValue={CustomSingleValue}
        />
      )}

      <style>{`
        // .bg-market { background-color: #f4f7fe; }
        .fw-black { font-weight: 900; letter-spacing: -1px; }
        .btn-publish {
          background: linear-gradient(135deg, #FF7A00 0%, #FF9533 100%);
          color: white; border: none; padding: 12px 25px;
          border-radius: 15px; font-weight: 700; transition: 0.3s;
        }
        .btn-publish:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(255, 122, 0, 0.3); color: white; }

        .live-indicator-red {
          display: flex; align-items: center; position: relative;
          background: #fff0f0; border: 1px solid #ffcccc;
          color: #ff3b3b; padding: 4px 12px; border-radius: 20px;
          font-size: 10px; font-weight: 900; letter-spacing: 1px;
        }
        .radar-ping {
          position: absolute; left: 10px; height: 10px; width: 10px;
          background: #ff3b3b; border-radius: 50%; opacity: 0.7;
          animation: radar 1.5s infinite ease-out;
        }
        @keyframes radar { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(3); opacity: 0; } }

        .filter-glass { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(10px); border: 1px solid white; box-shadow: 0 10px 30px rgba(0,0,0,0.03); }
        .search-box, .sort-box { background: #f0f2f5; border-radius: 12px; padding: 8px 15px; display: flex; align-items: center; }
        .pill-btn {
          display: flex; align-items: center; white-space: nowrap; padding: 10px 18px; border-radius: 12px;
          background: white; border: 1px solid #eee; font-weight: 700; font-size: 13px; transition: 0.3s;
        }
        .pill-btn.active { background: #1a1a1b; color: white; border-color: #1a1a1b; }

        .skeleton-card { height: 220px; background: #eee; border-radius: 20px; animation: shimmer 1.5s infinite; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .flag-img { width: 20px; height: 14px; border-radius: 2px; }
      `}</style>
    </div>
  );
}