import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import type { UserRegistration } from "../models/User";
import "../styles/RegisterContent.css";

export default function RegisterContent() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<UserRegistration>({
    lastname: "",
    firstname: "",
    email: "",
    telephone: "",
    country: "",
    password: "",
    password_confirmation: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // État pour suivre les champs en erreur
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // On retire l'erreur dès que l'utilisateur recommence à saisir
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setErrors({});

    // Exemple de validation locale : vérification des mots de passe
    if (formData.password !== formData.password_confirmation) {
      setErrors({ password: true, password_confirmation: true });
      setMessage({ type: "error", text: "Les mots de passe ne correspondent pas." });
      setLoading(false);
      return;
    }

    try {
      await authService.register(formData);
      navigate("/verify-otp", { state: { email: formData.email } });
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Une erreur est survenue.";
      setMessage({ type: "error", text: errorMsg });
      
      // Si l'API renvoie des erreurs spécifiques aux champs (ex: email déjà pris)
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors); 
      } else {
        // Optionnel : marquer tous les champs en erreur si c'est une erreur globale
        setErrors({ email: true, telephone: true }); 
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page-wrapper light-theme">
      <div className="register-card">
        <div className="card-header">
          <h2 className="register-title">Rejoindre <span className="brand-text">ExchaPay</span></h2>
          <p className="register-subtitle">Créez votre compte en quelques secondes</p>
        </div>

        {message && (
          <div className={`status-message ${message.type}`}>
            <span className="status-icon">{message.type === "success" ? "✓" : "⚠️"}</span>
            <p>{message.text}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="input-group-row">
            <div className="input-field">
              <label>Prénom</label>
              <input
                className={errors.firstname ? "input-error" : ""}
                type="text"
                name="firstname"
                value={formData.firstname}
                onChange={handleChange}
                
              />
            </div>
            <div className="input-field">
              <label>Nom</label>
              <input
                className={errors.lastname ? "input-error" : ""}
                type="text"
                name="lastname"
                value={formData.lastname}
                onChange={handleChange}
                
              />
            </div>
          </div>

          <div className="input-field">
            <label>Adresse Email</label>
            <input
              className={errors.email ? "input-error" : ""}
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              
            />
          </div>

          <div className="input-group-row">
            <div className="input-field">
              <label>Pays</label>
              <input
                className={errors.country ? "input-error" : ""}
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                
              />
            </div>
            <div className="input-field">
              <label>Téléphone</label>
              <input
                className={errors.telephone ? "input-error" : ""}
                type="tel"
                name="telephone"
                value={formData.telephone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="input-group-row">
            <div className="input-field">
              <label>Mot de passe</label>
              <input
                className={errors.password ? "input-error" : ""}
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                
              />
            </div>
            <div className="input-field">
              <label>Confirmation</label>
              <input
                className={errors.password_confirmation ? "input-error" : ""}
                type="password"
                name="password_confirmation"
                value={formData.password_confirmation}
                onChange={handleChange}
              />
            </div>
          </div>

          <button type="submit" className="btn-excha-orange register-submit-btn" disabled={loading}>
            {loading ? <span className="loader"></span> : "Créer mon compte"}
          </button>
        </form>

        <div className="footer-link">
          <p>Déjà inscrit ? <a href="/login" className="text-excha-green">Connectez-vous</a></p>
        </div>
      </div>
    </div>
  );
}