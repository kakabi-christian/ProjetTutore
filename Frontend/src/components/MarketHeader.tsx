import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import { 
  MdHome, 
  MdPeople, 
  MdCollectionsBookmark, // 🆕 Icône plus adaptée pour "Mes Publications"
  MdNotifications, 
  MdSearch,
  MdLogout,
  MdPerson,
  MdKeyboardArrowDown
} from "react-icons/md";
import { authService } from "../services/authService";
import type { User } from "../models/Utilisateur";

interface MarketHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const MarketHeader: React.FC<MarketHeaderProps> = ({ activeTab, setActiveTab }) => {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // 👤 Récupération de l'utilisateur au montage
  useEffect(() => {
    const storedUser = localStorage.getItem('user_data');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Erreur de lecture de user_data", e);
      }
    }
  }, []);

  // 🖱️ Fermer le menu si clic à l'extérieur
  useEffect(() => {
    const closeMenu = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', closeMenu);
    return () => document.removeEventListener('mousedown', closeMenu);
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate("/login");
    } catch (error) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      navigate("/login");
    }
  };

  const userInitial = user?.firstname ? user.firstname.charAt(0).toUpperCase() : 'U';

  return (
    <nav className="navbar navbar-expand-lg bg-white border-bottom sticky-top py-0 shadow-sm" style={{ height: '70px' }}>
      <div className="container-fluid d-flex justify-content-between align-items-center px-4">
        
        

        {/* CENTRE : Navigation */}
        <ul className="navbar-nav mx-auto d-flex flex-row gap-2 gap-md-4">
          <li 
            className={`nav-item text-center cursor-pointer px-3 pt-2 transition-all ${activeTab === "accueil" ? "text-excha-orange border-bottom border-excha-orange border-3" : "text-muted opacity-75"}`}
            onClick={() => setActiveTab("accueil")}
          >
            <MdHome size={26} />
            <small className="d-none d-md-block fw-bold" style={{ fontSize: '0.65rem' }}>Accueil</small>
          </li>
          
          <li 
            className={`nav-item text-center cursor-pointer px-3 pt-2 transition-all ${activeTab === "reseau" ? "text-excha-orange border-bottom border-excha-orange border-3" : "text-muted opacity-75"}`}
            onClick={() => setActiveTab("reseau")}
          >
            <MdPeople size={26} />
            <small className="d-none d-md-block fw-bold" style={{ fontSize: '0.65rem' }}>Réseau</small>
          </li>

          {/* 🏷️ Onglet Publications avec nouvelle icône */}
          <li 
            className={`nav-item text-center cursor-pointer px-3 pt-2 transition-all ${activeTab === "publications" ? "text-excha-orange border-bottom border-excha-orange border-3" : "text-muted opacity-75"}`}
            onClick={() => setActiveTab("publications")}
          >
            <MdCollectionsBookmark size={24} />
            <small className="d-none d-md-block fw-bold" style={{ fontSize: '0.65rem' }}>Mes posts</small>
          </li>

          {/* <li 
            className={`nav-item text-center cursor-pointer px-3 pt-2 transition-all ${activeTab === "notifs" ? "text-excha-orange border-bottom border-excha-orange border-3" : "text-muted opacity-75"}`}
            onClick={() => setActiveTab("notifs")}
          >
            <MdNotifications size={26} />
            <small className="d-none d-md-block fw-bold" style={{ fontSize: '0.65rem' }}>Notifications</small>
          </li> */}
        </ul>

        {/* DROITE : Actions & Profil */}
        <div className="d-flex align-items-center gap-3">
          <div className="vr d-none d-md-block mx-2" style={{ height: '30px', opacity: 0.2 }}></div>

          <div className="position-relative" ref={profileRef}>
            <div 
              className="d-flex align-items-center gap-1 cursor-pointer p-1 rounded-pill hover-effect border shadow-sm px-2"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <div className="avatar-circle" 
                   style={{ 
                      width: '32px', height: '32px', 
                      background: 'linear-gradient(135deg, #FF7A00, #FFB800)', 
                      color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      borderRadius: '50%', fontWeight: 'bold', fontSize: '0.85rem'
                   }}>
                {userInitial}
              </div>
              <MdKeyboardArrowDown size={18} className={`${showProfileMenu ? 'rotate-180' : ''} transition-all text-muted`} />
            </div>

            {showProfileMenu && (
              <div className="dropdown-menu show position-absolute end-0 mt-2 shadow-lg border-0 rounded-4 p-2 animate__animated animate__fadeIn" 
                   style={{ minWidth: '220px', zIndex: 1050 }}>
                <div className="px-3 py-3 border-bottom mb-2 bg-light rounded-top-4">
                  <span className="fw-bold d-block text-truncate text-dark" style={{ fontSize: '0.9rem' }}>
                      {user?.firstname} {user?.lastname}
                  </span>
                  <small className="text-muted text-truncate d-block" style={{ fontSize: '0.8rem' }}>{user?.email}</small>
                </div>
                
                <button className="dropdown-item d-flex align-items-center gap-2 py-2 rounded-3 text-dark" onClick={() => navigate('/user/profile-user')}>
                  <MdPerson size={20} className="text-muted" /> Mon Profil
                </button>
                
                <div className="dropdown-divider mx-2"></div>
                
                <button className="dropdown-item d-flex align-items-center gap-2 py-2 rounded-3 text-danger fw-bold" onClick={handleLogout}>
                  <MdLogout size={20} /> Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .cursor-pointer { cursor: pointer; }
        .rotate-180 { transform: rotate(180deg); }
        .transition-all { transition: all 0.2s ease-in-out; }
        .hover-effect:hover { background-color: #f8f9fa; border-color: #dee2e6 !important; }
        .nav-item:hover { opacity: 1 !important; color: var(--excha-orange) !important; }
        .dropdown-item { font-size: 0.9rem; transition: all 0.2s; }
        .dropdown-item:hover { background-color: #fff5eb !important; color: #FF7A00 !important; transform: translateX(5px); }
        .dropdown-item.text-danger:hover { background-color: #fff5f5 !important; color: #dc3545 !important; }
      `}</style>
    </nav>
  );
};

export default MarketHeader;