import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { 
  MdDescription, 
  MdSwapHorizontalCircle, 
  MdLogout,
  MdNotificationsActive,
  MdSend,
  MdAccountCircle // NOUVEAU : Icône pour le profil
} from "react-icons/md";
import { authService } from "../services/authService";
import KycService from "../services/KycService";

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [pendingCount, setPendingCount] = useState<number>(0);

  const fetchPendingCount = async () => {
    try {
      const response = await KycService.getPendingCount();
      setPendingCount(response.count);
    } catch (error) {
      console.error("Erreur lors de la récupération du compteur KYC", error);
    }
  };

  useEffect(() => {
    fetchPendingCount();
    window.addEventListener('kyc-status-changed', fetchPendingCount);
    return () => {
      window.removeEventListener('kyc-status-changed', fetchPendingCount);
    };
  }, []);

  const confirmLogout = async () => {
    try {
      await authService.logout();
      setShowLogoutModal(false);
      navigate("/login"); 
    } catch (error) {
      console.error("Erreur lors de la déconnexion", error);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data'); // Nettoyage propre
      setShowLogoutModal(false);
      navigate("/login");
    }
  };

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "nav-link active bg-excha-orange text-white fw-bold shadow-sm"
      : "nav-link text-excha-green fw-bold opacity-75 hover-opacity-100";

  const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
    borderRadius: '10px',
    transition: 'all 0.3s ease',
    backgroundColor: isActive ? 'var(--orange)' : 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  });

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
              Administration
            </small>
          </div>
        </div>

        <hr style={{ backgroundColor: "rgba(255,255,255,0.1)", height: '1px', border: 'none' }} />

        {/* Menu Navigation */}
        <ul className="nav nav-pills flex-column mb-auto">
          
          {/* Types de Documents */}
          <li className="nav-item mb-2">
            <NavLink to="/admin/type-documents" className={navLinkClasses} style={navLinkStyle}>
              <div className="d-flex align-items-center">
                <MdDescription className="me-2" size={22} />
                Types de Documents
              </div>
            </NavLink>
          </li>

          {/* Gestion des KYC avec Badge */}
          <li className="nav-item mb-2">
            <NavLink to="/admin/kyc" className={navLinkClasses} style={navLinkStyle}>
              <div className="d-flex align-items-center">
                <MdNotificationsActive className="me-2" size={22} />
                Gestion des KYC
              </div>

              {pendingCount > 0 && (
                <span 
                  className="badge rounded-pill bg-white text-excha-orange shadow-sm d-flex align-items-center justify-content-center"
                  style={{ 
                    minWidth: '22px', 
                    height: '22px', 
                    fontSize: '0.75rem',
                    border: '1px solid var(--orange)'
                  }}
                >
                  {pendingCount}
                </span>
              )}
            </NavLink>
          </li>

          {/* Envoi de Notifications */}
          <li className="nav-item mb-2">
            <NavLink to="/admin/notifications-admin" className={navLinkClasses} style={navLinkStyle}>
              <div className="d-flex align-items-center">
                <MdSend className="me-2" size={22} />
                Notifications
              </div>
            </NavLink>
          </li>

          {/* NOUVEAU : Mon Profil */}
          <li className="nav-item mb-2">
            <NavLink to="/admin/profile-admin" className={navLinkClasses} style={navLinkStyle}>
              <div className="d-flex align-items-center">
                <MdAccountCircle className="me-2" size={22} />
                Mon Profil
              </div>
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

export default Sidebar;