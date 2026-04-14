import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    MdNotificationsNone, 
    MdLogout, 
    MdPerson, 
    MdLightMode, 
    MdDarkMode,
    MdKeyboardArrowDown,
    MdSwapHorizontalCircle,
    MdMenu // ✅ Import de l'icône menu
} from 'react-icons/md';
import { authService } from "../services/authService";
import notificationService from "../services/NotificationService";
import type { User } from '../models/Utilisateur';

// ✅ Ajout de l'interface pour recevoir la prop du parent
interface TopBarUserProps {
    onMenuClick?: () => void;
}

const TopBarUser: React.FC<TopBarUserProps> = ({ onMenuClick }) => {
    const navigate = useNavigate();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [user, setUser] = useState<User | null>(null);
    const profileRef = useRef<HTMLDivElement>(null);

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

    useEffect(() => {
        const fetchUnread = async () => {
            try {
                const count = await notificationService.getUnreadCount();
                setUnreadCount(count);
            } catch (e) { console.error(e); }
        };
        fetchUnread();
    }, []);

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

    const userInitial = user?.firstname ? user.firstname.charAt(0).toUpperCase() : (user?.lastname ? user.lastname.charAt(0).toUpperCase() : 'U');

    return (
        <header className="d-flex justify-content-between align-items-center py-2 px-3 px-md-4 shadow-sm" 
                style={{ 
                    height: '70px', 
                    position: 'sticky', 
                    top: 0, 
                    zIndex: 999,
                    backgroundColor: isDarkMode ? 'var(--blue)' : 'white',
                    borderBottom: `1px solid ${isDarkMode ? 'var(--border)' : '#eee'}`
                }}>
            
            {/* 🚀 GAUCHE : Hamburger (Mobile) + Branding */}
            <div className="d-flex align-items-center gap-2">
                {/* ✅ Bouton Hamburger visible UNIQUEMENT sur mobile */}
                <button 
                    className="btn d-md-none p-1 text-excha-blue border-0" 
                    onClick={onMenuClick}
                >
                    <MdMenu size={30} />
                </button>

                
            </div>

            {/* 🛠️ DROITE : Actions */}
            <div className="d-flex align-items-center gap-2 gap-md-4">
                
                {/* Theme Switcher (Caché sur très petits mobiles pour gagner de la place si besoin, ou gardé) */}
                <button 
                    className="btn btn-link p-1 p-md-2 shadow-none border-0" 
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    style={{ color: isDarkMode ? 'var(--gray)' : 'var(--blue)' }}
                >
                    {isDarkMode ? <MdLightMode size={22} className="text-warning" /> : <MdDarkMode size={22} />}
                </button>

                {/* Notifications */}
                <div className="position-relative cursor-pointer p-1" onClick={() => navigate('/user/notifications-user')}>
                    <MdNotificationsNone size={26} style={{ color: isDarkMode ? 'var(--gray)' : 'var(--blue)' }} />
                    {unreadCount > 0 && (
                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill" 
                              style={{ fontSize: '0.6rem', marginTop: '8px', marginLeft: '-5px', backgroundColor: 'var(--orange)' }}>
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </div>

                {/* Profil Dropdown */}
                <div className="position-relative" ref={profileRef}>
                    <div 
                        className="d-flex align-items-center gap-1 gap-md-2 cursor-pointer p-1 rounded-pill hover-effect"
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                    >
                        <div className="avatar-circle shadow-sm" 
                             style={{ 
                                width: '35px', 
                                height: '35px', 
                                background: 'linear-gradient(135deg, var(--blue-light), var(--blue))', 
                                color: 'white', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                borderRadius: '50%', 
                                fontWeight: 'bold',
                                border: '2px solid var(--white)',
                                fontSize: '0.9rem'
                             }}>
                            {userInitial}
                        </div>
                        <MdKeyboardArrowDown className={`transition-all d-none d-sm-block ${showProfileMenu ? 'rotate-180' : ''}`} 
                                            style={{ color: isDarkMode ? 'var(--gray)' : 'var(--blue)' }} />
                    </div>

                    {showProfileMenu && (
                        <div className="dropdown-menu show position-absolute end-0 mt-2 shadow-lg border-0 rounded-4 p-2 animate__animated animate__fadeIn" 
                             style={{ 
                                minWidth: '200px', 
                                backgroundColor: isDarkMode ? '#16213e' : 'white',
                                color: isDarkMode ? 'white' : 'inherit',
                                right: '0'
                             }}>
                            <div className="px-3 py-2 border-bottom mb-2">
                                <span className="fw-bold d-block text-truncate" style={{ fontSize: '0.9rem', color: isDarkMode ? 'var(--white)' : 'var(--blue)' }}>
                                    {user?.lastname || 'Utilisateur'}
                                </span>
                                <small className="text-muted text-truncate d-block" style={{ fontSize: '0.75rem' }}>{user?.email}</small>
                            </div>
                            
                            <button className="dropdown-item d-flex align-items-center gap-2 py-2 rounded-3" onClick={() => navigate('/user/profile-user')}>
                                <MdPerson size={18} /> Profil
                            </button>
                            
                            <div className="dropdown-divider" style={{ opacity: 0.1 }}></div>
                            
                            <button className="dropdown-item d-flex align-items-center gap-2 py-2 rounded-3 text-danger fw-bold" onClick={handleLogout}>
                                <MdLogout size={18} /> Quitter
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
                .dropdown-item { 
                    transition: all 0.2s; 
                    font-size: 0.9rem;
                    color: ${isDarkMode ? '#ccc' : '#555'}; 
                }
                .dropdown-item:hover { 
                    background-color: var(--orange) !important; 
                    color: white !important;
                }
            `}</style>
        </header>
    );
};

export default TopBarUser;