import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import SidebarUser from '../contents/SidebarUser';

export default function UserDashboard() {
  // Déclaration de l'état pour gérer la réduction de la sidebar
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      {/* Sidebar avec passage d'état et de la fonction de modification */}
      <SidebarUser isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Contenu principal dynamique */}
      <div 
        className="flex-grow-1 p-4" 
        style={{ 
          backgroundColor: '#f8f9fa',
          // Ajustement dynamique de la marge pour ne pas que le contenu passe sous la sidebar fixe
          marginLeft: isCollapsed ? '80px' : '280px', 
          transition: 'margin-left 0.3s ease', // Animation synchronisée avec la sidebar
          width: '100%',
          minHeight: '100vh'
        }}
      >
        <Outlet />
      </div>
    </div>
  );
}