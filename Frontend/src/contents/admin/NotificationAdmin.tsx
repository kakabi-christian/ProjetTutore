import React, { useState, useEffect } from "react";
import { 
  MdSend, 
  MdNotificationsActive, 
  MdGroup, 
  MdPerson, 
  MdInfo 
} from "react-icons/md";
import { NotificationType } from "../../models/Notification";
import type { User } from "../../models/Utilisateur";
import Swal from "sweetalert2";
import notificationService from "../../services/NotificationService";
import utilisateurService from "../../services/UtilisateurService";

// Interface pour typer l'état du formulaire
interface NotificationForm {
  user_id: string; 
  is_broadcast: boolean;
  type: number;
  title: string;
  message: string;
}

const NotificationAdmin: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]); // Liste des utilisateurs de type 'user'
  const [formData, setFormData] = useState<NotificationForm>({
    user_id: "",
    is_broadcast: false,
    type: NotificationType.INFO,
    title: "",
    message: ""
  });

  // Chargement de la liste des utilisateurs au montage du composant
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await utilisateurService.adminGetUsersList();
        setUsers(data);
      } catch (error) {
        console.error("Erreur lors de la récupération des utilisateurs", error);
      }
    };
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation simple pour le mode individuel
    if (!formData.is_broadcast && !formData.user_id) {
      Swal.fire("Attention", "Veuillez sélectionner un destinataire.", "warning");
      return;
    }

    setLoading(true);

    try {
      await notificationService.adminSendNotification({
        user_id: formData.is_broadcast ? null : Number(formData.user_id),
        is_broadcast: formData.is_broadcast,
        type: formData.type,
        title: formData.title,
        message: formData.message
      });

      Swal.fire({
        icon: 'success',
        title: 'Envoyé !',
        text: 'La notification a été transmise avec succès.',
        confirmButtonColor: '#FF6B2B', 
      });

      // Reset du formulaire (on garde le type de diffusion actuel)
      setFormData({
        ...formData,
        title: "",
        message: "",
        user_id: ""
      });
    } catch (error: any) {
      console.error("Erreur d'envoi", error);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: error.response?.data?.message || "Impossible d'envoyer la notification.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid p-4" style={{ backgroundColor: '#f0f4f8', minHeight: '100vh' }}>
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          
          {/* Header de la page */}
          <div className="d-flex align-items-center mb-4">
            <div className="p-3 rounded-circle bg-excha-blue shadow-sm me-3">
              <MdNotificationsActive size={30} className="text-excha-green" />
            </div>
            <div>
              <h2 className="fw-bold mb-0" style={{ color: 'var(--blue)' }}>Centre de Notifications</h2>
              <p className="text-muted mb-0">Diffusez des messages système ou ciblez un utilisateur spécifique sur ExchaPay.</p>
            </div>
          </div>

          {/* Carte du Formulaire */}
          <div className="card border-0 shadow-sm" style={{ borderRadius: '20px', overflow: 'hidden' }}>
            <div className="card-header bg-excha-blue p-4 border-0">
              <h5 className="text-white mb-0 d-flex align-items-center">
                <MdSend className="me-2 text-excha-orange" /> Composer un message
              </h5>
            </div>
            
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                
                {/* Switch Broadcast */}
                <div className="mb-4 p-3 rounded-4 border d-flex align-items-center justify-content-between" 
                     style={{ backgroundColor: formData.is_broadcast ? 'rgba(0, 200, 150, 0.05)' : 'transparent' }}>
                  <div className="d-flex align-items-center">
                    {formData.is_broadcast ? (
                      <MdGroup size={24} className="text-excha-green me-2" />
                    ) : (
                      <MdPerson size={24} className="text-excha-orange me-2" />
                    )}
                    <div>
                      <h6 className="mb-0 fw-bold">{formData.is_broadcast ? "Diffusion Générale" : "Ciblage Individuel"}</h6>
                      <small className="text-muted">
                        {formData.is_broadcast ? "Tous les utilisateurs recevront ce message" : "Sélectionnez un destinataire dans la liste"}
                      </small>
                    </div>
                  </div>
                  <div className="form-check form-switch">
                    <input 
                      className="form-check-input custom-switch" 
                      type="checkbox" 
                      role="switch"
                      checked={formData.is_broadcast}
                      onChange={(e) => setFormData({ ...formData, is_broadcast: e.target.checked, user_id: "" })}
                      style={{ cursor: 'pointer', width: '3em', height: '1.5em' }}
                    />
                  </div>
                </div>

                <div className="row">
                  {/* Sélecteur d'utilisateur (Masqué si broadcast) */}
                  {!formData.is_broadcast && (
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold small text-uppercase">Destinataire</label>
                      <select 
                        className="form-select p-3 rounded-3 border-2" 
                        required={!formData.is_broadcast}
                        value={formData.user_id}
                        onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                        style={{ borderColor: 'rgba(10, 37, 64, 0.1)' }}
                      >
                        <option value="">-- Choisir un utilisateur --</option>
                        {users.map((user) => (
                          <option key={user.user_id} value={user.user_id}>
                            {user.lastname.toUpperCase()} {user.firstname} ({user.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Type de Notification */}
                  <div className={formData.is_broadcast ? "col-12 mb-3" : "col-md-6 mb-3"}>
                    <label className="form-label fw-bold small text-uppercase">Type d'alerte</label>
                    <select 
                      className="form-select p-3 rounded-3 border-2"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: Number(e.target.value) })}
                      style={{ borderColor: 'rgba(10, 37, 64, 0.1)' }}
                    >
                      <option value={NotificationType.INFO}>Info (Bleu)</option>
                      <option value={NotificationType.SUCCESS}>Succès (Vert)</option>
                      <option value={NotificationType.WARNING}>Avertissement (Orange)</option>
                      <option value={NotificationType.ERROR}>Erreur (Rouge)</option>
                    </select>
                  </div>
                </div>

                {/* Titre */}
                <div className="mb-3">
                  <label className="form-label fw-bold small text-uppercase">Titre du message</label>
                  <input 
                    type="text" 
                    className="form-control p-3 rounded-3 border-2" 
                    placeholder="Ex: Mise à jour des conditions d'utilisation"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    style={{ borderColor: 'rgba(10, 37, 64, 0.1)' }}
                  />
                </div>

                {/* Message */}
                <div className="mb-4">
                  <label className="form-label fw-bold small text-uppercase">Contenu du message</label>
                  <textarea 
                    className="form-control p-3 rounded-3 border-2" 
                    rows={4}
                    placeholder="Décrivez ici le contenu détaillé..."
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    style={{ borderColor: 'rgba(10, 37, 64, 0.1)' }}
                  ></textarea>
                </div>

                {/* Bouton d'action */}
                <button 
                  type="submit" 
                  className="btn btn-excha-orange w-100 p-3 fw-bold shadow-sm d-flex align-items-center justify-content-center"
                  disabled={loading}
                  style={{ borderRadius: '12px' }}
                >
                  {loading ? (
                    <span className="spinner-border spinner-border-sm me-2"></span>
                  ) : (
                    <>
                      <MdSend className="me-2" size={20} />
                      {formData.is_broadcast ? "Diffuser à tous" : "Envoyer à l'utilisateur"}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Aide / Tips */}
          <div className="mt-4 p-3 bg-white rounded-4 border-start border-4 border-excha-green shadow-sm">
            <div className="d-flex align-items-start">
              <MdInfo className="text-excha-green me-2 mt-1" size={20} />
              <small className="text-muted">
                <strong>Admin Info :</strong> La liste des destinataires ne contient que les utilisateurs actifs de type "Client". Les administrateurs ne sont pas listés ici.
              </small>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default NotificationAdmin;