import React, { useEffect, useState } from 'react';
import { 
  MdNotifications, 
  MdDoneAll, 
  MdAccessTime, 
  MdCheckCircle, 
  MdError, 
  MdInfo, 
  MdWarning 
} from 'react-icons/md';

import { type Notification, NotificationType } from '../../models/Notification';
import notificationService from '../../services/NotificationService';
// Import pour le formatage des dates
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function NotificationUser() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Charger les notifications
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

  // Marquer une seule comme lue
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

  // Tout marquer comme lu
  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error(error);
    }
  };

  // Helper pour l'icône selon le type
  const getIcon = (type: number) => {
    switch (type) {
      case NotificationType.SUCCESS: return <MdCheckCircle className="text-excha-green" size={24} />;
      case NotificationType.ERROR: return <MdError className="text-danger" size={24} />;
      case NotificationType.WARNING: return <MdWarning className="text-excha-orange" size={24} />;
      default: return <MdInfo className="text-excha-blue" size={24} />;
    }
  };

  return (
    <div className="container-fluid p-4" style={{ backgroundColor: 'var(--white)', minHeight: '100vh' }}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0" style={{ color: 'var(--blue)' }}>
            <MdNotifications className="me-2" />
            Mes Notifications
          </h2>
          <p className="text-muted small">Restez informé de l'état de votre compte ExchaPay.</p>
        </div>
        <button 
          className="btn btn-excha-outline d-flex align-items-center gap-2 py-2 px-3 shadow-sm"
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
            <div className="text-center py-5 bg-light rounded-4 border border-dashed">
              <MdNotifications size={60} className="text-gray mb-3 opacity-25" />
              <h5 className="text-muted">Aucune notification pour le moment.</h5>
            </div>
          ) : (
            <div className="list-group shadow-sm rounded-4 overflow-hidden border-0">
              {notifications.map((notif) => (
                <div 
                  key={notif.notification_id}
                  className={`list-group-item list-group-item-action p-4 border-start-0 border-end-0 border-top-0 border-bottom d-flex gap-3 align-items-start transition-all ${!notif.is_read ? 'bg-light' : ''}`}
                  style={{ 
                    cursor: 'pointer',
                    borderLeft: !notif.is_read ? '5px solid var(--orange)' : '5px solid transparent',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => !notif.is_read && handleMarkAsRead(notif.notification_id)}
                >
                  <div className="mt-1">
                    {getIcon(notif.type)}
                  </div>
                  
                  <div className="flex-grow-1">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <h6 className={`mb-0 ${!notif.is_read ? 'fw-bold text-dark' : 'text-muted fw-normal'}`}>
                        {notif.title}
                      </h6>
                      <small className="text-muted d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
                        <MdAccessTime size={14} />
                        {format(new Date(notif.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                      </small>
                    </div>
                    <p className={`mb-0 small ${!notif.is_read ? 'text-dark' : 'text-muted'}`}>
                      {notif.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <nav>
            <ul className="pagination gap-2 align-items-center">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button className="btn btn-outline-secondary rounded-pill px-3 shadow-sm" onClick={() => setCurrentPage(prev => prev - 1)}>
                  Précédent
                </button>
              </li>
              <li className="px-3 text-muted fw-bold">
                Page {currentPage} / {totalPages}
              </li>
              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <button className="btn btn-outline-secondary rounded-pill px-3 shadow-sm" onClick={() => setCurrentPage(prev => prev + 1)}>
                  Suivant
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
}