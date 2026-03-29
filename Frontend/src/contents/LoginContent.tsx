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
      // Nettoyer l'état après affichage
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
      // 1. Tentative de connexion
      const response = await authService.login(formData);
      
      // 2. Si succès, redirection selon le type (admin ou user)
      if (response.user.type === 'admin') {
        navigate("/admin/type-documents"); // Redirection vers ton nouveau dashboard
      } else if(response.user.type === 'user') {
        navigate("/user/kyc"); 
      }

    } catch (error: any) {
      // --- LOGIQUE DE REDIRECTION OTP AUTOMATIQUE ---
      const status = error.response?.status;
      const data = error.response?.data;

      if (status === 403 && data?.needs_verification) {
        // Redirection immédiate vers la vérification OTP avec l'email et le message
        navigate("/verify-otp", { 
          state: { 
            email: formData.email, 
            message: data.message 
          } 
        });
      } else {
        // Erreur classique (identifiants, compte suspendu, etc.)
        const errorMsg = data?.message || "Une erreur est survenue lors de la connexion.";
        setMessage({ type: "error", text: errorMsg });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper light-theme">
      <div className="login-card shadow-lg animate__animated animate__fadeIn">
        <div className="login-header text-center mb-4">
          <h2 className="login-title fw-bold">Bon retour sur <span className="text-warning">ExchaPay</span></h2>
          <p className="text-muted">Connectez-vous pour gérer vos échanges</p>
        </div>

        {message && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'} animate__animated animate__shakeX`} role="alert">
            {message.type === "success" ? "✅ " : "❌ "}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="mb-3">
            <label className="form-label fw-bold small text-secondary">Adresse Email</label>
            <input 
              type="email" 
              className="form-control form-control-lg fs-6"
              name="email" 
              placeholder="votre@email.com" 
              value={formData.email} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="mb-3">
            <div className="d-flex justify-content-between mb-1">
              <label className="form-label fw-bold small text-secondary">Mot de passe</label>
              <a href="/forgot-password" size-title="Mot de passe oublié ?" className="small text-warning text-decoration-none fw-bold">Oublié ?</a>
            </div>
            <input 
              type="password" 
              className="form-control form-control-lg fs-6"
              name="password" 
              placeholder="••••••••" 
              value={formData.password} 
              onChange={handleChange} 
              required 
            />
          </div>

          <button type="submit" className="btn btn-warning w-100 mt-3 fw-bold text-dark py-2 shadow-sm" disabled={loading}>
            {loading ? (
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
            ) : (
              "Se connecter"
            )}
          </button>
        </form>

        <p className="mt-4 text-center small">
          Nouveau sur la plateforme ? <a href="/register" className="text-success fw-bold text-decoration-none">Créer un compte</a>
        </p>
      </div>
    </div>
  );
}