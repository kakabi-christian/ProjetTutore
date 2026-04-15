import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    MdNotificationsNone, 
    MdLogout, 
    MdPerson, 
    MdLightMode, 
    MdDarkMode,
    MdKeyboardArrowDown,
    MdSwapHorizontalCircle
} from 'react-icons/md';
import { authService } from "../services/authService";
import notificationService from "../services/NotificationService";
import type { User } from '../models/Utilisateur';

const TopBarAdmin: React.FC = () => {
    const navigate = useNavigate();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [user, setUser] = useState<User | null>(null);
    const profileRef = useRef<HTMLDivElement>(null);

    // 👤 Récupération dynamique de l'utilisateur (depuis user_data)
    useEffect(() => {
        const storedUser = localStorage.getItem('user_data');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Erreur de lecture de user_data", e);
            }
        }
    }, []);

    // 🔔 Charger les notifications
    useEffect(() => {
        const fetchUnread = async () => {
            try {
                const count = await notificationService.getUnreadCount();
                setUnreadCount(count);
            } catch (e) { console.error(e); }
        };
        fetchUnread();
    }, []);

    // 🖱️ Fermer le menu si clic à l'extérieur
    useEffect(() => {
        const closeMenu = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setShowProfileMenu(false);
            }
        };
        document.addEventListener('mousedown', closeMenu);
        return () => document.removeEventListener('mousedown', closeMenu);
    }, []);

    const handleLogout = async () => {
        try {
            await authService.logout();
            navigate("/login");
        } catch (error) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_data');
            navigate("/login");
        }
    };

    // Extraction de l'initiale
    const userInitial = user?.firstname ? user.firstname.charAt(0).toUpperCase() : (user?.lastname ? user.lastname.charAt(0).toUpperCase() : 'U');

    return (
        <header className="d-flex justify-content-between align-items-center py-2 px-4 shadow-sm" 
                style={{ 
                    height: '70px', 
                    position: 'sticky', 
                    top: 0, 
                    zIndex: 999,
                    backgroundColor: isDarkMode ? 'var(--blue)' : 'white',
                    borderBottom: `1px solid ${isDarkMode ? 'var(--border)' : '#eee'}`
                }}>
            
            {/* 🚀 GAUCHE : Branding ExchaPay */}
            <div className="d-flex align-items-center cursor-pointer" onClick={() => navigate('/user/dashboard')}>
                
            </div>

            {/* 🛠️ DROITE : Actions */}
            <div className="d-flex align-items-center gap-4">
                
                {/* 1. Theme Switcher */}
                <button 
                    className="btn btn-link p-2 shadow-none border-0" 
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    style={{ color: isDarkMode ? 'var(--gray)' : 'var(--blue)' }}
                >
                    {isDarkMode ? <MdLightMode size={22} className="text-warning" /> : <MdDarkMode size={22} />}
                </button>

                {/* 2. Notifications */}
                <div className="position-relative cursor-pointer" onClick={() => navigate('/admin/notifications-admin')}>
                    <MdNotificationsNone size={26} style={{ color: isDarkMode ? 'var(--gray)' : 'var(--blue)' }} />
                    {/* {unreadCount > 0 && (
                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill" 
                              style={{ fontSize: '0.65rem', marginTop: '5px', backgroundColor: 'var(--orange)' }}>
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )} */}
                </div>

                {/* 3. Profil Dropdown */}
                <div className="position-relative" ref={profileRef}>
                    <div 
                        className="d-flex align-items-center gap-2 cursor-pointer p-1 rounded-pill hover-effect"
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                    >
                        <div className="avatar-circle shadow-sm" 
                             style={{ 
                                width: '38px', 
                                height: '38px', 
                                background: 'linear-gradient(135deg, var(--blue-light), var(--blue))', 
                                color: 'white', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                borderRadius: '50%', 
                                fontWeight: 'bold',
                                border: '2px solid var(--white)'
                             }}>
                            {userInitial}
                        </div>
                        <MdKeyboardArrowDown className={`transition-all ${showProfileMenu ? 'rotate-180' : ''}`} 
                                            style={{ color: isDarkMode ? 'var(--gray)' : 'var(--blue)' }} />
                    </div>

                    {showProfileMenu && (
                        <div className="dropdown-menu show position-absolute end-0 mt-2 shadow-lg border-0 rounded-4 p-2 animate__animated animate__fadeIn" 
                             style={{ 
                                minWidth: '220px', 
                                backgroundColor: isDarkMode ? '#16213e' : 'white',
                                color: isDarkMode ? 'white' : 'inherit'
                             }}>
                            <div className="px-3 py-3 border-bottom mb-2">
                                <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>Connecté en tant que</small>
                                <span className="fw-bold d-block text-truncate" style={{ color: isDarkMode ? 'var(--white)' : 'var(--blue)' }}>
                                    {user?.lastname || 'Utilisateur'} {user?.firstname || ''}
                                </span>
                                <small className="text-muted text-truncate d-block">{user?.email}</small>
                            </div>
                            
                            <button className="dropdown-item d-flex align-items-center gap-2 py-2 rounded-3 text-muted-hover" onClick={() => navigate('/user/profile-user')}>
                                <MdPerson size={18} /> Mon Profil
                            </button>
                            
                            <div className="dropdown-divider" style={{ opacity: 0.1 }}></div>
                            
                            <button className="dropdown-item d-flex align-items-center gap-2 py-2 rounded-3 text-danger fw-bold" onClick={handleLogout}>
                                <MdLogout size={18} /> Déconnexion
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .cursor-pointer { cursor: pointer; }
                .hover-effect:hover { background-color: rgba(0,0,0,0.05); }
                .rotate-180 { transform: rotate(180deg); }
                .transition-all { transition: all 0.3s ease; }
                .dropdown-item { transition: all 0.2s; color: ${isDarkMode ? 'var(--gray)' : 'var(--blue)'}; }
                .dropdown-item:hover { 
                    background-color: var(--orange); 
                    color: white !important;
                }
                .text-muted-hover:hover { color: white !important; }
            `}</style>
        </header>
    );
};

export default TopBarAdmin;