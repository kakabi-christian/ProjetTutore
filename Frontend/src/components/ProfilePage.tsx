import React, { useState, useEffect } from 'react';
import { 
  MdPerson, 
  MdLock, 
  MdPhone, 
  MdEmail, 
  MdPublic, 
  MdSave, 
  MdCheckCircle 
} from 'react-icons/md';
import UtilisateurService from '../services/UtilisateurService';
import type { UpdateProfilePayload, UpdatePasswordPayload } from '../services/UtilisateurService';
import type { User } from '../models/Utilisateur';
export default function ProfilePage() {
  // États pour les données
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Formulaire Profil
  const [profileData, setProfileData] = useState<UpdateProfilePayload>({
    lastname: '',
    firstname: '',
    telephone: '',
    country: '',
    email: ''
  });

  // Formulaire Mot de passe
  const [passwordData, setPasswordData] = useState<UpdatePasswordPayload>({
    old_password: '',
    new_password: '',
    new_password_confirmation: ''
  });

  // Charger les données au montage
  useEffect(() => {
    const storedUser = localStorage.getItem('user_data');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setProfileData({
        lastname: parsedUser.lastname || '',
        firstname: parsedUser.firstname || '',
        telephone: parsedUser.telephone || '',
        country: parsedUser.country || '',
        email: parsedUser.email || ''
      });
    }
  }, []);

  // Gestion de la mise à jour du profil
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const updatedUser = await UtilisateurService.updateProfile(profileData);
      setUser(updatedUser);
      setSuccessMsg("Profil mis à jour avec succès !");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Erreur lors de la mise à jour.");
    } finally {
      setLoading(false);
    }
  };

  // Gestion du changement de mot de passe
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await UtilisateurService.updatePassword(passwordData);
      setSuccessMsg("Mot de passe modifié avec succès !");
      setPasswordData({ old_password: '', new_password: '', new_password_confirmation: '' });
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Erreur de mot de passe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid py-4" style={{ backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      <div className="row justify-content-center">
        <div className="col-12 col-xl-10">
          
          {/* Header */}
          <div className="mb-4 d-flex align-items-center justify-content-between">
            <div>
              <h2 className="fw-bold mb-1" style={{ color: 'var(--blue)' }}>Mon Profil</h2>
              <p className="text-muted">Gérez vos informations personnelles et votre sécurité</p>
            </div>
            {user && (
                <span className="badge p-2 px-3 bg-excha-green shadow-sm" style={{ borderRadius: '8px' }}>
                    Compte {user.type?.toUpperCase()}
                </span>
            )}
          </div>

          {/* Alertes */}
          {successMsg && (
            <div className="alert alert-success border-0 shadow-sm d-flex align-items-center animate__animated animate__fadeIn" style={{ borderRadius: '12px' }}>
              <MdCheckCircle className="me-2" size={24} /> <strong>{successMsg}</strong>
            </div>
          )}
          {errorMsg && (
            <div className="alert alert-danger border-0 shadow-sm animate__animated animate__shakeX" style={{ borderRadius: '12px' }}>
              <strong>{errorMsg}</strong>
            </div>
          )}

          <div className="row g-4">
            {/* Colonne Gauche : Infos Personnelles */}
            <div className="col-lg-7">
              <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '15px' }}>
                <div className="card-header bg-white border-0 py-3">
                  <h5 className="mb-0 fw-bold d-flex align-items-center" style={{ color: 'var(--blue)' }}>
                    <MdPerson className="me-2 text-excha-orange" size={24} /> Informations Personnelles
                  </h5>
                </div>
                <div className="card-body p-4">
                  <form onSubmit={handleUpdateProfile}>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-bold small text-muted">NOM</label>
                        <input 
                          type="text" className="form-control" 
                          value={profileData.lastname}
                          onChange={(e) => setProfileData({...profileData, lastname: e.target.value})}
                          style={{ borderRadius: '10px', padding: '10px', backgroundColor: '#f9f9f9' }} 
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-bold small text-muted">PRÉNOM</label>
                        <input 
                          type="text" className="form-control" 
                          value={profileData.firstname}
                          onChange={(e) => setProfileData({...profileData, firstname: e.target.value})}
                          style={{ borderRadius: '10px', padding: '10px', backgroundColor: '#f9f9f9' }} 
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-bold small text-muted"><MdEmail className="me-1"/> EMAIL</label>
                        <input 
                          type="email" className="form-control" 
                          value={profileData.email}
                          onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                          style={{ borderRadius: '10px', padding: '10px', backgroundColor: '#f9f9f9' }} 
                          readOnly
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-bold small text-muted"><MdPhone className="me-1"/> TÉLÉPHONE</label>
                        <input 
                          type="text" className="form-control" 
                          value={profileData.telephone}
                          onChange={(e) => setProfileData({...profileData, telephone: e.target.value})}
                          style={{ borderRadius: '10px', padding: '10px', backgroundColor: '#f9f9f9' }} 
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-bold small text-muted"><MdPublic className="me-1"/> PAYS</label>
                        <input 
                          type="text" className="form-control" 
                          value={profileData.country}
                          onChange={(e) => setProfileData({...profileData, country: e.target.value})}
                          style={{ borderRadius: '10px', padding: '10px', backgroundColor: '#f9f9f9' }} 
                        />
                      </div>
                    </div>
                    <button 
                      type="submit" 
                      className="btn btn-excha-orange w-100 mt-4 fw-bold py-2 shadow-sm"
                      disabled={loading}
                      style={{ borderRadius: '10px' }}
                    >
                      {loading ? 'Traitement...' : <><MdSave className="me-2"/> Enregistrer les modifications</>}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Colonne Droite : Sécurité */}
            <div className="col-lg-5">
              <div className="card border-0 shadow-sm" style={{ borderRadius: '15px' }}>
                <div className="card-header bg-white border-0 py-3">
                  <h5 className="mb-0 fw-bold d-flex align-items-center" style={{ color: 'var(--blue)' }}>
                    <MdLock className="me-2 text-excha-orange" size={24} /> Sécurité
                  </h5>
                </div>
                <div className="card-body p-4">
                  <form onSubmit={handleChangePassword}>
                    <div className="mb-3">
                      <label className="form-label fw-bold small text-muted">ANCIEN MOT DE PASSE</label>
                      <input 
                        type="password" className="form-control" 
                        placeholder="••••••••"
                        value={passwordData.old_password}
                        onChange={(e) => setPasswordData({...passwordData, old_password: e.target.value})}
                        style={{ borderRadius: '10px', padding: '10px' }} 
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-bold small text-muted">NOUVEAU MOT DE PASSE</label>
                      <input 
                        type="password" className="form-control" 
                        placeholder="Min 8 caractères"
                        value={passwordData.new_password}
                        onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                        style={{ borderRadius: '10px', padding: '10px' }} 
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label className="form-label fw-bold small text-muted">CONFIRMATION</label>
                      <input 
                        type="password" className="form-control" 
                        placeholder="Confirmer le nouveau"
                        value={passwordData.new_password_confirmation}
                        onChange={(e) => setPasswordData({...passwordData, new_password_confirmation: e.target.value})}
                        style={{ borderRadius: '10px', padding: '10px' }} 
                        required
                      />
                    </div>
                    <button 
                      type="submit" 
                      className="btn btn-outline-excha-blue w-100 fw-bold py-2"
                      disabled={loading}
                      style={{ borderRadius: '10px', border: '2px solid var(--blue)', color: 'var(--blue)' }}
                    >
                      Modifier le mot de passe
                    </button>
                  </form>
                </div>
              </div>

              {/* Note informative */}
              <div className="mt-4 p-3 border-start border-4 border-excha-green bg-white shadow-sm" style={{ borderRadius: '0 10px 10px 0' }}>
                <small className="text-muted d-block">
                  <strong>Note :</strong> Vos informations sont protégées par chiffrement. Pensez à utiliser un mot de passe complexe pour sécuriser votre compte administrateur.
                </small>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}