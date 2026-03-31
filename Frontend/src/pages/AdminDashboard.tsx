import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../contents/Sidebar';

const AdminDashboard: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      {/* Sidebar avec passage d'état */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Contenu principal dynamique */}
      <div 
        className="flex-grow-1 p-4" 
        style={{ 
          backgroundColor: '#f8f9fa',
          // On ajuste la marge gauche selon l'état de la sidebar
          marginLeft: isCollapsed ? '80px' : '280px', 
          transition: 'margin-left 0.3s ease', // Même animation que la sidebar
          width: '100%' 
        }}
      >
        <Outlet />
      </div>
    </div>
  );
};

export default AdminDashboard;