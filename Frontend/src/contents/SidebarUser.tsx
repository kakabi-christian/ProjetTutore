import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { 
  MdDescription, 
  MdSwapHorizontalCircle, 
  MdLogout,
  MdNotifications,
  MdRateReview,
  MdAccountCircle,
  MdMenu 
} from "react-icons/md";
import { authService } from "../services/authService";
import notificationService from "../services/NotificationService";

interface SidebarUserProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const SidebarUser: React.FC<SidebarUserProps> = ({ isCollapsed, setIsCollapsed }) => {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const count = await notificationService.getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.error("Erreur compteur notifications:", error);
      }
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 120000);
    return () => clearInterval(interval);
  }, []);

  const confirmLogout = async () => {
    try {
      await authService.logout();
      setShowLogoutModal(false);
      navigate("/login"); 
    } catch (error) {
      console.error("Erreur déconnexion", error);
      localStorage.removeItem('auth_token');
      setShowLogoutModal(false);
      navigate("/login");
    }
  };

  // Classes de base pour les liens
  // Ajout de h-100 pour que le background orange prenne toute la hauteur du li
  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `nav-link h-100 ${isActive ? "active bg-excha-orange text-white fw-bold shadow-sm" : "text-white opacity-75 hover-opacity-100"} d-flex align-items-center p-0`;

  // Style des éléments de liste (li)
  const navItemStyle = {
    borderRadius: '12px', // Légèrement plus arrondi pour aller avec la taille plus grande
    transition: 'all 0.3s ease',
    height: '56px', // AUGMENTÉ : de 48px à 56px pour un background plus large
    overflow: 'hidden',
    marginBottom: '10px', // Un peu plus d'espace entre les boutons
    position: 'relative' as const
  };

  return (
    <>
      <div
        className="d-flex flex-column flex-shrink-0 p-2 shadow"
        style={{ 
          width: isCollapsed ? "80px" : "280px", 
          minHeight: "100vh", 
          backgroundColor: "var(--blue)", 
          transition: "width 0.3s ease",
          position: "fixed",
          zIndex: 1000
        }}
      >
        {/* Header */}
        <div className={`d-flex align-items-center mb-4 mt-2 ${isCollapsed ? 'justify-content-center' : 'px-3 justify-content-between'}`}>
          {!isCollapsed && (
            <div className="d-flex align-items-center text-decoration-none">
              <MdSwapHorizontalCircle className="text-excha-green me-2" size={32} />
              <div className="d-flex flex-column">
                <span className="fw-bold text-white" style={{ fontSize: '1.1rem' }}>ExchaPay</span>
                <small className="text-excha-green fw-bold text-uppercase" style={{ fontSize: '0.6rem' }}>Utilisateur</small>
              </div>
            </div>
          )}
          <button className="btn text-excha-green p-0 border-0" onClick={() => setIsCollapsed(!isCollapsed)}>
            <MdMenu size={28} />
          </button>
        </div>

        <hr className="mx-2" style={{ backgroundColor: "rgba(255,255,255,0.1)", border: 'none', height: '1px' }} />

        {/* Navigation */}
        <ul className="nav nav-pills flex-column mb-auto px-1">
          
          {/* KYC */}
          <li style={navItemStyle}>
            <NavLink to="/user/kyc" className={navLinkClasses}>
              <div className="d-flex align-items-center justify-content-center" style={{ minWidth: '64px', height: '100%' }}>
                <MdDescription size={26} /> {/* Icône un poil plus grande */}
              </div>
              {!isCollapsed && <span className="text-nowrap" style={{ fontSize: '1rem' }}>KYC</span>}
            </NavLink>
          </li>

          {/* Notifications */}
          <li style={navItemStyle}>
            <NavLink to="/user/notifications-user" className={navLinkClasses}>
              <div className="d-flex align-items-center justify-content-center" style={{ minWidth: '64px', height: '100%' }}>
                <MdNotifications size={26} />
                {isCollapsed && unreadCount > 0 && (
                  <span className="badge rounded-pill bg-danger position-absolute" 
                        style={{ top: '10px', right: '18px', fontSize: '0.6rem', padding: '0.3em 0.5em' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              {!isCollapsed && (
                <div className="d-flex align-items-center justify-content-between flex-grow-1 pe-3">
                  <span className="text-nowrap" style={{ fontSize: '1rem' }}>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="badge rounded-pill bg-danger shadow-sm" style={{ fontSize: '0.75rem', padding: '0.4em 0.7em' }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          </li>

          {/* Feedback */}
          <li style={navItemStyle}>
            <NavLink to="/user/feedback" className={navLinkClasses}>
              <div className="d-flex align-items-center justify-content-center" style={{ minWidth: '64px', height: '100%' }}>
                <MdRateReview size={26} />
              </div>
              {!isCollapsed && <span className="text-nowrap" style={{ fontSize: '1rem' }}>Avis & Feedback</span>}
            </NavLink>
          </li>

          {/* Profil */}
          <li style={navItemStyle}>
            <NavLink to="/user/profile-user" className={navLinkClasses}>
              <div className="d-flex align-items-center justify-content-center" style={{ minWidth: '64px', height: '100%' }}>
                <MdAccountCircle size={26} />
              </div>
              {!isCollapsed && <span className="text-nowrap" style={{ fontSize: '1rem' }}>Mon Profil</span>}
            </NavLink>
          </li>
        </ul>

        <hr className="mx-2" style={{ backgroundColor: "rgba(255,255,255,0.1)", border: 'none', height: '1px' }} />

        {/* Déconnexion */}
        <div className="px-1 mb-3">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="btn w-100 d-flex align-items-center p-0 border-0"
            style={{ 
              height: '56px', // Aligné sur la hauteur des autres boutons
              borderRadius: '12px', 
              backgroundColor: 'rgba(255, 107, 43, 0.1)', 
              color: 'white',
              transition: 'all 0.2s'
            }}
          >
            <div className="d-flex align-items-center justify-content-center" style={{ minWidth: '64px' }}>
              <MdLogout size={24} className="text-excha-orange" />
            </div>
            {!isCollapsed && <span className="fw-bold" style={{ fontSize: '1rem' }}>Déconnexion</span>}
          </button>
        </div>
      </div>

      {/* MODAL */}
      {showLogoutModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(10, 37, 64, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1100 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '400px' }}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px' }}>
              <div className="modal-body p-4 text-center">
                <MdLogout size={50} className="text-excha-orange mb-3" />
                <h5 className="fw-bold mb-3" style={{ color: 'var(--blue)' }}>Déconnexion</h5>
                <p className="text-muted">Êtes-vous sûr de vouloir quitter votre session ?</p>
                <div className="d-flex gap-2 mt-4">
                  <button className="btn fw-bold w-50 py-2" onClick={() => setShowLogoutModal(false)}>Annuler</button>
                  <button className="btn btn-excha-orange fw-bold w-50 py-2 shadow-sm" onClick={confirmLogout}>Oui, quitter</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SidebarUser;