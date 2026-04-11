import { useState } from 'react'; 
import { Outlet, useLocation } from 'react-router-dom'; // Import de useLocation
import SidebarUser from '../contents/SidebarUser';
import TopBarUser from '../components/TopBarUser';

export default function UserDashboard() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  // Détection de la page "Réseau" pour éviter le double Header
  const isMarketPage = location.pathname.includes('/user/market');

  return (
    <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      
      {/* 1. SIDEBAR */}
      <SidebarUser isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* 2. ZONE DE DROITE (Contenu principal) */}
      <div 
        className="d-flex flex-column flex-grow-1" 
        style={{ 
          marginLeft: isCollapsed ? '80px' : '280px', 
          transition: 'margin-left 0.3s ease',
          minHeight: '100vh',
          width: '100%'
        }}
      >
        {/* On affiche la TopBar globale UNIQUEMENT si on n'est PAS sur le marché */}
        {!isMarketPage && <TopBarUser />}

        {/* Le main retire son padding (p-0) sur le marché pour que 
            le Header du MarketContent colle parfaitement aux bords.
        */}
        <main className={`${isMarketPage ? 'p-0' : 'p-4'} flex-grow-1`}>
          <div className="container-fluid p-0 animate__animated animate__fadeIn">
            <Outlet />
          </div>
        </main>

        <footer className="px-4 py-3 text-center" style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>
          &copy; {new Date().getFullYear()} <strong>ExchaPay</strong> — Plateforme sécurisée d'échange.
        </footer>
      </div>

      <style>{`
        body { overflow-x: hidden; }
        .animate__fadeIn { animation-duration: 0.5s; }
        /* Optionnel : cacher le footer sur le market pour un look plus "App" */
        ${isMarketPage ? 'footer { display: none; }' : ''}
      `}</style>
    </div>
  );
}