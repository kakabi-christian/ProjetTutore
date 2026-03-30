import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { 
  MdDescription, 
  MdSwapHorizontalCircle, 
  MdLogout,
  MdNotifications // Import de l'icône notification
} from "react-icons/md";
import { authService } from "../services/authService";
import notificationService from "../services/NotificationService";
const SidebarUser: React.FC = () => {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Récupération du compteur de notifications au chargement
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
    // Optionnel : Rafraîchir toutes les 2 minutes
    const interval = setInterval(fetchUnreadCount, 120000);
    return () => clearInterval(interval);
  }, []);

  const confirmLogout = async () => {
    try {
      await authService.logout();
      setShowLogoutModal(false);
      navigate("/login"); 
    } catch (error) {
      console.error("Erreur lors de la déconnexion", error);
      localStorage.removeItem('auth_token');
      setShowLogoutModal(false);
      navigate("/login");
    }
  };

  return (
    <>
      <div
        className="d-flex flex-column flex-shrink-0 p-3 shadow"
        style={{ 
          width: "280px", 
          minHeight: "100vh", 
          backgroundColor: "var(--blue)", 
          color: "var(--white)" 
        }}
      >
        {/* Brand / Logo */}
        <div className="d-flex align-items-center mb-4 mt-2 me-md-auto text-decoration-none">
          <MdSwapHorizontalCircle className="text-excha-green me-2" size={36} />
          <div className="d-flex flex-column">
            <span className="fs-4 fw-bold text-white" style={{ lineHeight: '1.2' }}>ExchaPay</span>
            <small className="text-excha-green fw-bold text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>
              Utilisateur
            </small>
          </div>
        </div>

        <hr style={{ backgroundColor: "rgba(255,255,255,0.1)", height: '1px', border: 'none' }} />

        {/* Menu Navigation */}
        <ul className="nav nav-pills flex-column mb-auto">
          {/* Item KYC */}
          <li className="nav-item mb-2">
            <NavLink
              to="/user/kyc"
              className={({ isActive }) =>
                isActive
                  ? "nav-link active bg-excha-orange text-white fw-bold shadow-sm"
                  : "nav-link text-white opacity-75 hover-opacity-100"
              }
              style={{ borderRadius: '10px', transition: 'all 0.3s ease' }}
            >
              <MdDescription className="me-2" size={22} />
              KYC
            </NavLink>
          </li>

          {/* Item Notifications avec Badge */}
          <li className="nav-item mb-2">
            <NavLink
              to="/user/notifications-user"
              className={({ isActive }) =>
                isActive
                  ? "nav-link active bg-excha-orange text-white fw-bold shadow-sm d-flex justify-content-between align-items-center"
                  : "nav-link text-white opacity-75 hover-opacity-100 d-flex justify-content-between align-items-center"
              }
              style={{ borderRadius: '10px', transition: 'all 0.3s ease' }}
            >
              <div className="d-flex align-items-center">
                <MdNotifications className="me-2" size={22} />
                Notifications
              </div>
              
              {unreadCount > 0 && (
                <span 
                  className="badge rounded-pill bg-danger shadow-sm" 
                  style={{ fontSize: '0.7rem', padding: '0.4em 0.6em' }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </NavLink>
          </li>
        </ul>

        <hr style={{ backgroundColor: "rgba(255,255,255,0.1)", height: '1px', border: 'none' }} />

        {/* Bouton de Déconnexion */}
        <div className="mt-auto">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="btn w-100 d-flex align-items-center justify-content-start gap-2 p-3 text-white border-0"
            style={{ 
              borderRadius: '12px', 
              backgroundColor: 'rgba(255, 107, 43, 0.1)', 
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 107, 43, 0.2)')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 107, 43, 0.1)')}
          >
            <MdLogout size={22} className="text-excha-orange" />
            <span className="fw-bold">Déconnexion</span>
          </button>
          
          <div className="text-center mt-3">
            <small style={{ fontSize: '0.6rem', color: 'var(--gray)' }}>© 2026 ExchaPay Platform</small>
          </div>
        </div>
      </div>

      {/* MODAL DE DÉCONNEXION */}
      {showLogoutModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(10, 37, 64, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '400px' }}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px' }}>
              <div className="modal-body p-4 text-center">
                <div className="mb-3">
                    <MdLogout size={50} className="text-excha-orange" />
                </div>
                <h5 className="fw-bold mb-3" style={{ color: 'var(--blue)' }}>Déconnexion</h5>
                <p className="text-muted">Êtes-vous sûr de vouloir quitter votre session ?</p>
                
                <div className="d-flex gap-2 mt-4">
                  <button 
                    type="button" 
                    className="btn fw-bold w-50 py-2" 
                    style={{ color: 'var(--gray)', borderRadius: '10px' }} 
                    onClick={() => setShowLogoutModal(false)}
                  >
                    Annuler
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-excha-orange fw-bold w-50 py-2 shadow-sm" 
                    style={{ borderRadius: '10px' }}
                    onClick={confirmLogout}
                  >
                    Oui, quitter
                  </button>
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