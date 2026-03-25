import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authService } from "../services/authService";
import "../styles/LoginContent.css"; 

export default function LoginContent() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (location.state?.message) {
      setMessage({ type: "success", text: location.state.message });
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await authService.login(formData);
      navigate("/"); 
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Identifiants incorrects.";
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper light-theme">
      <div className="login-card">
        <div className="login-header">
          <h2 className="login-title">Bon retour sur <span className="brand-text">ExchaPay</span></h2>
          <p className="login-subtitle">Connectez-vous pour gérer vos échanges</p>
        </div>

        {message && (
          <div className={`status-alert ${message.type}`}>
            <span className="icon">{message.type === "success" ? "✅" : "❌"}</span>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-box">
            <label>Adresse Email</label>
            <input 
              type="email" 
              name="email" 
              placeholder="votre@email.com" 
              value={formData.email} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="input-box">
            <div className="label-row">
              <label>Mot de passe</label>
              <a href="/forgot-password" self-title="Mot de passe oublié ?" className="forgot-link">Oublié ?</a>
            </div>
            <input 
              type="password" 
              name="password" 
              placeholder="••••••••" 
              value={formData.password} 
              onChange={handleChange} 
              required 
            />
          </div>

          {/* Utilisation de ta classe orange du thème */}
          <button type="submit" className="btn-excha-orange login-submit-btn" disabled={loading}>
            {loading ? <span className="loader"></span> : "Se connecter"}
          </button>
        </form>

        <p className="register-redirect">
          Nouveau sur la plateforme ? <a href="/register" className="text-excha-green">Créer un compte</a>
        </p>
      </div>
    </div>
  );
}