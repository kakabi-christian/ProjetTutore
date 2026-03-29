import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { 
  MdDescription, 
  MdSwapHorizontalCircle, 
  MdLogout,
} from "react-icons/md";
import { authService } from "../services/authService";

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  // État pour gérer l'affichage du modal de déconnexion
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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
              Administration
            </small>
          </div>
        </div>

        <hr style={{ backgroundColor: "rgba(255,255,255,0.1)", height: '1px', border: 'none' }} />

        {/* Menu Navigation */}
        <ul className="nav nav-pills flex-column mb-auto">
          <li className="nav-item mb-2">
            <NavLink
              to="/admin/type-documents"
              className={({ isActive }) =>
                isActive
                  ? "nav-link active bg-excha-orange text-white fw-bold shadow-sm"
                  : "nav-link text-white opacity-75 hover-opacity-100"
              }
              style={({ isActive }) => ({
                  borderRadius: '10px',
                  transition: 'all 0.3s ease',
                  backgroundColor: isActive ? 'var(--orange)' : 'transparent'
              })}
            >
              <MdDescription className="me-2" size={22} />
              Types de Documents
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

      {/* MODAL DE DÉCONNEXION (Inspiré de ton TypeDocumentPage) */}
      {showLogoutModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(10, 37, 64, 0.6)', backdropFilter: 'blur(4px)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '400px' }}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px' }}>
              <div className="modal-body p-4 text-center">
                <div className="mb-3">
                    <MdLogout size={50} className="text-excha-orange" />
                </div>
                <h5 className="fw-bold mb-3" style={{ color: 'var(--blue)' }}>Déconnexion</h5>
                <p className="text-muted">Êtes-vous sûr de vouloir quitter votre session administrateur ?</p>
                
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