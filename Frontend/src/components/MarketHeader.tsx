import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import { 
  MdHome, MdPeople, MdCollectionsBookmark, MdNotificationsNone, 
  MdLogout, MdPerson, MdKeyboardArrowDown, MdSwapHoriz,
  MdMenu, MdLightMode, MdDarkMode
} from "react-icons/md";
import { authService } from "../services/authService";
import notificationService from "../services/NotificationService";
import type { User } from "../models/Utilisateur";

interface MarketHeaderProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  onMenuClick?: () => void; // Doit être relié au dashboard
}

const MarketHeader: React.FC<MarketHeaderProps> = ({ activeTab, setActiveTab, onMenuClick }) => {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [user, setUser] = useState<User | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user_data');
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch (e) { console.error(e); }
    }
    
    const fetchUnread = async () => {
      try {
        const count = await notificationService.getUnreadCount();
        setUnreadCount(count);
      } catch (e) { console.error(e); }
    };
    fetchUnread();
  }, []);

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
    <header className="d-flex justify-content-between align-items-center py-0 px-3 px-md-4 shadow-sm bg-white" 
            style={{ height: '70px', position: 'sticky', top: 0, zIndex: 999, borderBottom: '1px solid #eee' }}>
      
      {/* GAUCHE : Hamburger */}
      <div className="d-flex align-items-center gap-2" style={{ flex: 1 }}>
        <button 
          className="btn d-md-none p-1 text-excha-blue border-0" 
          onClick={() => {
            console.log("Clic Hamburger détecté");
            if (onMenuClick) onMenuClick(); // Déclenche l'ouverture de la sidebar
          }}
        >
          <MdMenu size={30} />
        </button>
      </div>

      {/* CENTRE : Navigation */}
      {setActiveTab && (
        <ul className="navbar-nav d-flex flex-row gap-1 gap-md-4" style={{ flex: 2, justifyContent: 'center' }}>
          {[
            { id: 'accueil', icon: <MdHome size={24} />, label: 'Accueil' },
            { id: 'reseau', icon: <MdPeople size={24} />, label: 'Réseau' },
            { id: 'publications', icon: <MdCollectionsBookmark size={22} />, label: 'Annonces' },
            { id: 'transactions', icon: <MdSwapHoriz size={26} />, label: 'Échanges' },
          ].map((tab) => (
            <li key={tab.id} 
                className={`nav-item text-center cursor-pointer px-2 px-md-3 pt-2 transition-all ${activeTab === tab.id ? "text-excha-orange border-bottom border-excha-orange border-3" : "text-muted opacity-75"}`}
                onClick={() => setActiveTab(tab.id)}>
              {tab.icon}
              <small className="d-none d-md-block fw-bold" style={{ fontSize: '0.65rem' }}>{tab.label}</small>
            </li>
          ))}
        </ul>
      )}

      {/* DROITE : Profil */}
      <div className="d-flex align-items-center justify-content-end gap-2 gap-md-3" style={{ flex: 1 }}>
        <button className="btn btn-link p-1 shadow-none border-0 d-none d-sm-block" onClick={() => setIsDarkMode(!isDarkMode)}>
          {isDarkMode ? <MdLightMode size={22} className="text-warning" /> : <MdDarkMode size={22} className="text-excha-blue" />}
        </button>

        <div className="position-relative cursor-pointer p-1" onClick={() => navigate('/user/notifications-user')}>
          <MdNotificationsNone size={26} className="text-excha-blue" />
          {unreadCount > 0 && (
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-excha-orange" style={{ fontSize: '0.6rem' }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>

        <div className="position-relative" ref={profileRef}>
          <div className="d-flex align-items-center gap-1 cursor-pointer p-1 rounded-pill border shadow-sm px-2 hover-effect" onClick={() => setShowProfileMenu(!showProfileMenu)}>
            <div className="avatar-circle" style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, var(--blue-light), var(--blue))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontWeight: 'bold', fontSize: '0.85rem' }}>
              {userInitial}
            </div>
            <MdKeyboardArrowDown size={18} className={`${showProfileMenu ? 'rotate-180' : ''} transition-all text-muted`} />
          </div>

          {showProfileMenu && (
            <div className="dropdown-menu show position-absolute end-0 mt-2 shadow-lg border-0 rounded-4 p-2" style={{ minWidth: '200px', zIndex: 1000 }}>
              <div className="px-3 py-2 border-bottom mb-2 bg-light rounded-top-4">
                <span className="fw-bold d-block text-truncate" style={{ fontSize: '0.9rem' }}>{user?.firstname} {user?.lastname}</span>
                <small className="text-muted text-truncate d-block" style={{ fontSize: '0.75rem' }}>{user?.email}</small>
              </div>
              <button className="dropdown-item d-flex align-items-center gap-2 py-2 rounded-3" onClick={() => navigate('/user/profile-user')}>
                <MdPerson size={18} /> Profil
              </button>
              <div className="dropdown-divider"></div>
              <button className="dropdown-item d-flex align-items-center gap-2 py-2 rounded-3 text-danger fw-bold" onClick={handleLogout}>
                <MdLogout size={18} /> Quitter
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default MarketHeader;