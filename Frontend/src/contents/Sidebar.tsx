import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { 
  MdDescription, 
  MdSwapHorizontalCircle, 
  MdLogout,
  MdNotificationsActive,
  MdSend,
  MdAccountCircle,
  MdShield,
  MdPeople,
  MdMenu 
} from "react-icons/md";
import { authService } from "../services/authService";
import KycService from "../services/KycService";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
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
      localStorage.removeItem('user_data');
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
    justifyContent: isCollapsed ? 'center' : 'space-between',
    padding: isCollapsed ? '10px 0' : '10px 15px',
    position: 'relative' as const, // Important pour le positionnement du tooltip
  });

  return (
    <>
      <div
        className={`d-flex flex-column flex-shrink-0 p-3 shadow sidebar-container ${isCollapsed ? "collapsed" : ""}`}
        style={{ 
          width: isCollapsed ? "80px" : "280px", 
          minHeight: "100vh", 
          backgroundColor: "var(--blue)", 
          color: "var(--white)",
          transition: "all 0.3s ease",
          position: "fixed",
          left: 0,
          top: 0,
          zIndex: 1000
        }}
      >
        {/* Header */}
        <div className={`d-flex align-items-center mb-4 mt-2 ${isCollapsed ? 'justify-content-center' : 'justify-content-between'}`}>
          {!isCollapsed && (
            <div className="d-flex align-items-center text-decoration-none">
              <MdSwapHorizontalCircle className="text-excha-green me-2" size={36} />
              <div className="d-flex flex-column">
                <span className="fs-4 fw-bold text-white" style={{ lineHeight: '1.2' }}>ExchaPay</span>
                <small className="text-excha-green fw-bold text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '1px' }}>
                  Admin
                </small>
              </div>
            </div>
          )}
          <button 
            className="btn text-white p-0 border-0" 
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{ fontSize: '28px' }}
          >
            <MdMenu className="text-excha-green" />
          </button>
        </div>

        <hr style={{ backgroundColor: "rgba(255,255,255,0.1)", height: '1px', border: 'none' }} />

        {/* Menu Navigation */}
        <ul className="nav nav-pills flex-column mb-auto">
          
          <li className="nav-item mb-2">
            <NavLink to="/admin/roles" className={navLinkClasses} style={navLinkStyle} data-label="Gestion des Rôles">
              <div className="d-flex align-items-center">
                <MdShield className={isCollapsed ? "" : "me-2"} size={22} />
                {!isCollapsed && <span>Gestion des Rôles</span>}
              </div>
            </NavLink>
          </li>

          <li className="nav-item mb-2">
            <NavLink to="/admin/users-list" className={navLinkClasses} style={navLinkStyle} data-label="Utilisateurs">
              <div className="d-flex align-items-center">
                <MdPeople className={isCollapsed ? "" : "me-2"} size={22} />
                {!isCollapsed && <span>Utilisateurs</span>}
              </div>
            </NavLink>
          </li>

          <li className="nav-item mb-2">
            <NavLink to="/admin/type-documents" className={navLinkClasses} style={navLinkStyle} data-label="Documents">
              <div className="d-flex align-items-center">
                <MdDescription className={isCollapsed ? "" : "me-2"} size={22} />
                {!isCollapsed && <span>Types de Documents</span>}
              </div>
            </NavLink>
          </li>

          <li className="nav-item mb-2">
            <NavLink to="/admin/kyc" className={navLinkClasses} style={navLinkStyle} data-label="Gestion des KYC">
              <div className="d-flex align-items-center">
                <MdNotificationsActive className={isCollapsed ? "" : "me-2"} size={22} />
                {!isCollapsed && <span>Gestion des KYC</span>}
              </div>

              {pendingCount > 0 && (
                <span 
                  className={`badge rounded-pill bg-white text-excha-orange shadow-sm d-flex align-items-center justify-content-center ${isCollapsed ? 'position-absolute' : ''}`}
                  style={isCollapsed ? { top: '0', right: '5px', fontSize: '0.6rem'} : { 
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

          <li className="nav-item mb-2">
            <NavLink to="/admin/notifications-admin" className={navLinkClasses} style={navLinkStyle} data-label="Notifications">
              <div className="d-flex align-items-center">
                <MdSend className={isCollapsed ? "" : "me-2"} size={22} />
                {!isCollapsed && <span>Notifications</span>}
              </div>
            </NavLink>
          </li>

          <li className="nav-item mb-2">
            <NavLink to="/admin/profile-admin" className={navLinkClasses} style={navLinkStyle} data-label="Mon Profil">
              <div className="d-flex align-items-center">
                <MdAccountCircle className={isCollapsed ? "" : "me-2"} size={22} />
                {!isCollapsed && <span>Mon Profil</span>}
              </div>
            </NavLink>
          </li>
        </ul>

        <hr style={{ backgroundColor: "rgba(255,255,255,0.1)", height: '1px', border: 'none' }} />

        {/* Déconnexion */}
        <div className="mt-auto">
          <button
            onClick={() => setShowLogoutModal(true)}
            className={`btn w-100 d-flex align-items-center gap-2 p-3 text-white border-0 ${isCollapsed ? 'justify-content-center' : 'justify-content-start'}`}
            style={{ 
              borderRadius: '12px', 
              backgroundColor: 'rgba(255, 107, 43, 0.1)', 
              transition: 'all 0.2s'
            }}
          >
            <MdLogout size={22} className="text-excha-orange" />
            {!isCollapsed && <span className="fw-bold">Déconnexion</span>}
          </button>
          
          {!isCollapsed && (
            <div className="text-center mt-3">
              <small style={{ fontSize: '0.6rem', color: 'var(--gray)' }}>© 2026 ExchaPay Platform</small>
            </div>
          )}
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