import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../contents/Sidebar';
import TopBarAdmin from '../components/TopBarAdmin';
const AdminDashboard: React.FC = () => {
    // État pour la réduction de la sidebar admin
    const [isCollapsed, setIsCollapsed] = useState(true);

    return (
        <div className="d-flex" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
            
            {/* 1. SIDEBAR ADMIN (Fixe) */}
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

            {/* 2. ZONE DE DROITE (TopBar + Contenu Admin) */}
            <div 
                className="d-flex flex-column flex-grow-1" 
                style={{ 
                    // Ajustement dynamique pour laisser la place à la Sidebar
                    marginLeft: isCollapsed ? '80px' : '280px', 
                    transition: 'margin-left 0.3s ease',
                    minHeight: '100vh',
                    width: '100%',
                    overflowX: 'hidden'
                }}
            >
                {/* TOPBAR (Toujours visible en haut) */}
                <TopBarAdmin />

                {/* CONTENU DYNAMIQUE DES PAGES ADMIN */}
                <main className="p-4 flex-grow-1">
                    {/* Petit badge pour indiquer qu'on est en mode Admin */}
                    <div className="mb-3 d-inline-block px-3 py-1 rounded-pill" 
                         style={{ backgroundColor: 'rgba(10, 37, 64, 0.05)', border: '1px solid var(--blue)' }}>
                        <small className="fw-bold" style={{ color: 'var(--blue)' }}>
                            🛡️ ESPACE ADMINISTRATION
                        </small>
                    </div>

                    <div className="container-fluid p-0 animate__animated animate__fadeIn">
                        <Outlet />
                    </div>
                </main>

                {/* Footer Admin */}
                <footer className="px-4 py-3 text-center" style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>
                    &copy; {new Date().getFullYear()} <strong>ExchaPay Admin</strong> — Panel de gestion sécurisé.
                </footer>
            </div>

            <style>{`
                body {
                    overflow-x: hidden;
                }
                .animate__fadeIn {
                    animation-duration: 0.6s;
                }
                /* Scrollbar personnalisée pour la zone admin */
                ::-webkit-scrollbar {
                    width: 6px;
                }
                ::-webkit-scrollbar-track {
                    background: #f1f1f1;
                }
                ::-webkit-scrollbar-thumb {
                    background: var(--blue);
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
};

export default AdminDashboard;