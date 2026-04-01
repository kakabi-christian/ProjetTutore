import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import { 
  MdHome, 
  MdPeople, 
  MdChat, 
  MdNotifications, 
  MdSearch,
  MdAddCircleOutline,
  MdLogout,
  MdPerson,
  MdKeyboardArrowDown
} from "react-icons/md";
import { authService } from "../services/authService";
import type { User } from "../models/Utilisateur";

// 🏷️ Définition des types pour corriger l'erreur TS(2322)
interface MarketHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const MarketHeader: React.FC<MarketHeaderProps> = ({ activeTab, setActiveTab }) => {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // 👤 Récupération de l'utilisateur
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
        
        {/* GAUCHE : Recherche */}
        <div className="d-flex align-items-center flex-grow-1" style={{ maxWidth: '300px' }}>
          <div className="input-group bg-light rounded-pill px-3 py-1">
            <MdSearch size={22} className="text-muted mt-1" />
            <input 
              type="text" 
              className="form-control border-0 bg-transparent shadow-none" 
              placeholder="Rechercher..." 
            />
          </div>
        </div>

        {/* CENTRE : Navigation (Pilotée par le parent) */}
        <ul className="navbar-nav mx-auto d-flex flex-row gap-2 gap-md-4">
          <li 
            className={`nav-item text-center cursor-pointer px-3 pt-2 ${activeTab === "accueil" ? "text-excha-orange border-bottom border-excha-orange border-3" : "text-muted"}`}
            onClick={() => setActiveTab("accueil")}
          >
            <MdHome size={24} />
            <small className="d-none d-md-block fw-bold" style={{ fontSize: '0.65rem' }}>Accueil</small>
          </li>
          
          <li 
            className={`nav-item text-center cursor-pointer px-3 pt-2 ${activeTab === "reseau" ? "text-excha-orange border-bottom border-excha-orange border-3" : "text-muted"}`}
            onClick={() => setActiveTab("reseau")}
          >
            <MdPeople size={24} />
            <small className="d-none d-md-block fw-bold" style={{ fontSize: '0.65rem' }}>Réseau</small>
          </li>

          {/* AJOUT : Onglet Messages */}
          <li 
            className={`nav-item text-center cursor-pointer px-3 pt-2 ${activeTab === "messages" ? "text-excha-orange border-bottom border-excha-orange border-3" : "text-muted"}`}
            onClick={() => setActiveTab("messages")}
          >
            <MdChat size={24} />
            <small className="d-none d-md-block fw-bold" style={{ fontSize: '0.65rem' }}>Messages</small>
          </li>

          <li 
            className={`nav-item text-center cursor-pointer px-3 pt-2 ${activeTab === "notifs" ? "text-excha-orange border-bottom border-excha-orange border-3" : "text-muted"}`}
            onClick={() => setActiveTab("notifs")}
          >
            <MdNotifications size={24} />
            <small className="d-none d-md-block fw-bold" style={{ fontSize: '0.65rem' }}>Notifications</small>
          </li>
        </ul>

        {/* DROITE : Actions & Profil */}
        <div className="d-flex align-items-center gap-3">
         

          <div className="vr d-none d-md-block mx-2" style={{ height: '30px' }}></div>

          <div className="position-relative" ref={profileRef}>
            <div 
              className="d-flex align-items-center gap-1 cursor-pointer p-1 rounded-pill hover-effect"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <div className="avatar-circle" 
                   style={{ 
                      width: '35px', height: '35px', 
                      background: 'linear-gradient(135deg, var(--blue-light), var(--blue))', 
                      color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      borderRadius: '50%', fontWeight: 'bold', fontSize: '0.9rem'
                   }}>
                {userInitial}
              </div>
              <MdKeyboardArrowDown className={`${showProfileMenu ? 'rotate-180' : ''} transition-all`} />
            </div>

            {showProfileMenu && (
              <div className="dropdown-menu show position-absolute end-0 mt-2 shadow-lg border-0 rounded-4 p-2 animate__animated animate__fadeIn" 
                   style={{ minWidth: '200px' }}>
                <div className="px-3 py-2 border-bottom mb-2">
                  <span className="fw-bold d-block text-truncate" style={{ fontSize: '0.9rem' }}>
                      {user?.firstname} {user?.lastname}
                  </span>
                  <small className="text-muted text-truncate d-block">{user?.email}</small>
                </div>
                
                <button className="dropdown-item d-flex align-items-center gap-2 py-2 rounded-3 text-dark" onClick={() => navigate('/user/profile-user')}>
                  <MdPerson size={18} /> Mon Profil
                </button>
                
                <div className="dropdown-divider"></div>
                
                <button className="dropdown-item d-flex align-items-center gap-2 py-2 rounded-3 text-danger fw-bold" onClick={handleLogout}>
                  <MdLogout size={18} /> Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .cursor-pointer { cursor: pointer; }
        .rotate-180 { transform: rotate(180deg); }
        .transition-all { transition: all 0.3s ease; }
        .hover-effect:hover { background-color: rgba(0,0,0,0.05); }
        .dropdown-item:hover { background-color: var(--excha-orange); color: white !important; }
      `}</style>
    </nav>
  );
};

export default MarketHeader;