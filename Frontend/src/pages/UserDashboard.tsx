import { useState, useEffect } from 'react'; 
import { Outlet, useLocation } from 'react-router-dom';
import SidebarUser from '../contents/SidebarUser';
import TopBarUser from '../components/TopBarUser';

export default function UserDashboard() {
  // Par défaut : réduit (true) pour le look moderne
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const location = useLocation();

  // Détection du redimensionnement pour le responsive
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) setIsCollapsed(true); // Fermer d'office au changement vers mobile
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMarketPage = location.pathname.includes('/user/market');

  // Gestion dynamique de la marge gauche
  const getMarginLeft = () => {
    if (isMobile) return '0'; // Pas de marge sur mobile
    return isCollapsed ? '80px' : '280px'; // Marge variable sur PC
  };

  return (
    <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      
      {/* 1. BACKDROP MOBILE (Flou sombre quand le menu est ouvert sur mobile) */}
      {!isCollapsed && isMobile && (
        <div 
          onClick={() => setIsCollapsed(true)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(10, 37, 64, 0.5)',
            backdropFilter: 'blur(2px)',
            zIndex: 999
          }}
        />
      )}

      {/* 2. SIDEBAR */}
      <div className={`sidebar-wrapper ${isMobile ? 'mobile-mode' : ''}`}>
        <SidebarUser isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </div>

      {/* 3. ZONE DE DROITE (Contenu principal) */}
      <div 
        className="d-flex flex-column flex-grow-1" 
        style={{ 
          marginLeft: getMarginLeft(), 
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: '100vh',
          width: '100%'
        }}
      >
        {/* On passe setIsCollapsed à la TopBar pour que le bouton hamburger puisse l'ouvrir */}
        {!isMarketPage && (
          <TopBarUser onMenuClick={() => setIsCollapsed(!isCollapsed)} />
        )}

        <main className={`${isMarketPage ? 'p-0' : 'p-3 p-md-4'} flex-grow-1`}>
          <div className="container-fluid p-0 animate__animated animate__fadeIn">
            <Outlet />
          </div>
        </main>

        {!isMarketPage && (
          <footer className="px-4 py-3 text-center" style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>
            &copy; {new Date().getFullYear()} <strong>ExchaPay</strong> — Plateforme sécurisée.
          </footer>
        )}
      </div>

      <style>{`
        body { overflow-x: hidden; }
        .animate__fadeIn { animation-duration: 0.5s; }

        /* Styles Responsive Spécifiques */
        @media (max-width: 768px) {
          .sidebar-wrapper {
            position: fixed;
            z-index: 1000;
            height: 100vh;
            left: ${isCollapsed ? '-280px' : '0'}; /* Sort de l'écran si fermé */
            transition: left 0.3s ease;
          }
          
          /* Ajustement de la sidebar pour qu'elle soit toujours large sur mobile */
          .sidebar-wrapper > div {
            width: 280px !important; 
          }
        }

        /* Animation fluide pour les changements de largeur */
        .flex-grow-1 {
          will-change: margin-left;
        }
      `}</style>
    </div>
  );
}