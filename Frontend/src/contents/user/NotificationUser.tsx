import React, { useEffect, useState } from 'react';
import { 
  MdNotifications, 
  MdDoneAll, 
  MdAccessTime, 
  MdCheckCircle, 
  MdError, 
  MdInfo, 
  MdWarning,
  MdArrowBack,
  MdArrowForward 
} from 'react-icons/md';

import { type Notification, NotificationType } from '../../models/Notification';
import notificationService from '../../services/NotificationService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function NotificationUser() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchNotifications = async (page: number) => {
    setLoading(true);
    try {
      const response = await notificationService.getUserNotifications(page);
      setNotifications(response.data.data);
      setTotalPages(response.data.last_page);
      setCurrentPage(response.data.current_page);
    } catch (error) {
      console.error("Erreur chargement notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(currentPage);
  }, [currentPage]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error(error);
    }
  };

  const getIcon = (type: number) => {
    switch (type) {
      case NotificationType.SUCCESS: return <MdCheckCircle className="text-excha-green" size={24} />;
      case NotificationType.ERROR: return <MdError className="text-danger" size={24} />;
      case NotificationType.WARNING: return <MdWarning className="text-excha-orange" size={24} />;
      default: return <MdInfo className="text-excha-blue" size={24} />;
    }
  };

  return (
    <div className="container-fluid p-2 p-md-4" style={{ backgroundColor: 'var(--white)', minHeight: '100vh' }}>
      
      {/* Header Responsive */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="fw-bold mb-0 fs-4 fs-md-2" style={{ color: 'var(--blue)' }}>
            <MdNotifications className="me-2" />
            Mes Notifications
          </h2>
          <p className="text-muted small mb-0">Restez informé de l'état de votre compte ExchaPay.</p>
        </div>
        <button 
          className="btn btn-excha-outline d-flex align-items-center justify-content-center gap-2 py-2 px-3 shadow-sm w-100 w-md-auto"
          onClick={handleMarkAllRead}
          disabled={notifications.length === 0 || notifications.every(n => n.is_read)}
        >
          <MdDoneAll size={20} />
          Tout marquer comme lu
        </button>
      </div>

      {/* List / Loading State */}
      <div className="row">
        <div className="col-12">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-excha-orange" role="status"></div>
              <p className="mt-2 text-muted">Chargement de vos messages...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-5 bg-light rounded-4 border border-dashed mx-2">
              <MdNotifications size={60} className="text-gray mb-3 opacity-25" />
              <h5 className="text-muted">Aucune notification pour le moment.</h5>
            </div>
          ) : (
            <div className="list-group shadow-sm rounded-4 overflow-hidden border-0 mx-1 mx-md-0">
              {notifications.map((notif) => (
                <div 
                  key={notif.notification_id}
                  className={`list-group-item list-group-item-action p-3 p-md-4 border-0 border-bottom d-flex gap-2 gap-md-3 align-items-start transition-all ${!notif.is_read ? 'bg-light' : ''}`}
                  style={{ 
                    cursor: 'pointer',
                    borderLeft: !notif.is_read ? '5px solid var(--orange)' : '5px solid transparent',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => !notif.is_read && handleMarkAsRead(notif.notification_id)}
                >
                  <div className="mt-1 flex-shrink-0">
                    {getIcon(notif.type)}
                  </div>
                  
                  <div className="flex-grow-1 min-w-0">
                    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center mb-1 gap-1">
                      <h6 className={`mb-0 text-truncate w-100 ${!notif.is_read ? 'fw-bold text-dark' : 'text-muted fw-normal'}`}>
                        {notif.title}
                      </h6>
                      <small className="text-muted d-flex align-items-center gap-1 flex-shrink-0" style={{ fontSize: '0.7rem' }}>
                        <MdAccessTime size={14} />
                        {format(new Date(notif.created_at), "dd/MM à HH:mm", { locale: fr })}
                      </small>
                    </div>
                    <p className={`mb-0 small ${!notif.is_read ? 'text-dark' : 'text-muted'}`} style={{ lineHeight: '1.4' }}>
                      {notif.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pagination Responsive */}
      {!loading && totalPages > 1 && (
        <div className="d-flex justify-content-center mt-5 mb-4">
          <nav>
            <ul className="pagination gap-2 gap-md-3 align-items-center">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button 
                  className="btn btn-light shadow-sm rounded-circle p-2 p-md-3 d-flex align-items-center justify-content-center" 
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  style={{ width: '45px', height: '45px' }}
                >
                  <MdArrowBack size={20} />
                </button>
              </li>
              <li className="px-2 text-muted fw-bold small">
                {currentPage} / {totalPages}
              </li>
              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <button 
                  className="btn btn-light shadow-sm rounded-circle p-2 p-md-3 d-flex align-items-center justify-content-center" 
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  style={{ width: '45px', height: '45px' }}
                >
                  <MdArrowForward size={20} />
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}

      <style>{`
        .list-group-item:last-child { border-bottom: none !important; }
        .transition-all:hover { background-color: rgba(0,0,0,0.02); }
        
        @media (max-width: 576px) {
          .fs-4 { font-size: 1.25rem !important; }
          .p-3 { padding: 1rem !important; }
        }
      `}</style>
    </div>
  );
}