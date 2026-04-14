import { useState, useEffect } from 'react'; 
import { Outlet, useLocation } from 'react-router-dom';
import SidebarUser from '../contents/SidebarUser';
import TopBarUser from '../components/TopBarUser';

export default function UserDashboard() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) setIsCollapsed(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMarketPage = location.pathname.includes('/user/market');

  const getMarginLeft = () => {
    if (isMobile) return '0';
    return isCollapsed ? '80px' : '280px';
  };

  // Fonction centrale pour basculer la sidebar
  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  return (
    <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      
      {/* 1. BACKDROP MOBILE */}
      {!isCollapsed && isMobile && (
        <div 
          onClick={() => setIsCollapsed(true)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(10, 37, 64, 0.5)',
            backdropFilter: 'blur(2px)',
            zIndex: 1500 // Entre la sidebar et le contenu
          }}
        />
      )}

      {/* 2. SIDEBAR */}
      <div className={`sidebar-wrapper ${isMobile ? 'mobile-mode' : ''}`}>
        <SidebarUser isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </div>

      {/* 3. ZONE DE DROITE */}
      <div 
        className="d-flex flex-column flex-grow-1" 
        style={{ 
          marginLeft: getMarginLeft(), 
          transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: '100vh',
          width: '100%'
        }}
      >
        {/* TopBar classique (si pas sur le marché) */}
        {!isMarketPage && (
          <TopBarUser onMenuClick={toggleSidebar} />
        )}

        <main className={`${isMarketPage ? 'p-0' : 'p-3 p-md-4'} flex-grow-1`}>
          <div className="container-fluid p-0 animate__animated animate__fadeIn">
            {/* CRITIQUE : On passe toggleSidebar dans le context de l'Outlet.
               Toutes les pages enfants pourront y accéder via useOutletContext()
            */}
            <Outlet context={{ toggleSidebar }} />
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

        @media (max-width: 768px) {
          .sidebar-wrapper {
            position: fixed;
            z-index: 2000; 
            height: 100vh;
            left: ${isCollapsed ? '-280px' : '0'};
            transition: left 0.3s ease;
          }
          
          .sidebar-wrapper > div {
            width: 280px !important; 
          }
        }

        .flex-grow-1 {
          will-change: margin-left;
        }
      `}</style>
    </div>
  );
}