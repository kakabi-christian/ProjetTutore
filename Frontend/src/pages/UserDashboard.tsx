// AJOUTE CETTE LIGNE EN HAUT 
import React, { useState } from 'react'; 
import { Outlet } from 'react-router-dom';
import SidebarUser from '../contents/SidebarUser';
import TopBarUser from '../components/TopBarUser';

export default function UserDashboard() {
  // Maintenant useState sera reconnu
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      
      {/* 1. SIDEBAR */}
      <SidebarUser isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* 2. ZONE DE DROITE */}
      <div 
        className="d-flex flex-column flex-grow-1" 
        style={{ 
          marginLeft: isCollapsed ? '80px' : '280px', 
          transition: 'margin-left 0.3s ease',
          minHeight: '100vh',
          width: '100%'
        }}
      >
        <TopBarUser />

        <main className="p-4 flex-grow-1">
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
      `}</style>
    </div>
  );
}