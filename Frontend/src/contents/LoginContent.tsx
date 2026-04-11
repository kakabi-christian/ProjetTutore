import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { authService } from "../services/authService";
import { MdEmail, MdLock, MdArrowForward, MdErrorOutline, MdCheckCircleOutline } from "react-icons/md";
import AOS from 'aos';
import 'aos/dist/aos.css';
import "../styles/LoginContent.css"; 
import "../theme.css";

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
    AOS.init({
      duration: 1000,
      once: true,
      easing: 'ease-out-quart',
    });

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
      const response = await authService.login(formData);
      if (response.user.type === 'admin') {
        navigate("/admin/type-documents");
      } else if(response.user.type === 'user') {
        navigate("/user/kyc"); 
      }
    } catch (error: any) {
      const status = error.response?.status;
      const data = error.response?.data;

      if (status === 403 && data?.needs_verification) {
        navigate("/verify-otp", { 
          state: { email: formData.email, message: data.message } 
        });
      } else {
        const errorMsg = data?.message || "Identifiants incorrects ou problème réseau.";
        setMessage({ type: "error", text: errorMsg });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper d-flex align-items-center justify-content-center" 
          style={{ minHeight: '100vh', background: 'radial-gradient(circle at center, #F8FFFE 0%, #E6F0EE 100%)' }}>
      
      <div className="login-card p-4 p-md-5 shadow-2xl bg-white rounded-5 border-0" 
            data-aos="zoom-in-up"
            style={{ maxWidth: '450px', width: '90%' }}>
        
        <div className="text-center mb-5" data-aos="fade-down" data-aos-delay="200">
          <h2 className="fw-bold mb-2" style={{ color: '#0A2540' }}>Bon retour !</h2>
          <p style={{ color: '#8A9BB0' }}>
            Accédez à votre espace sécurisé <span className="fw-bold" style={{ color: '#FF6B2B' }}>ExchaPay</span>
          </p>
        </div>

        {message && (
          <div className={`d-flex align-items-center p-3 mb-4 rounded-4`} 
                data-aos="shake"
                style={{ 
                  backgroundColor: message.type === 'success' ? '#E6F9F4' : '#FFF0EA',
                  borderLeft: `5px solid ${message.type === 'success' ? '#00C896' : '#FF6B2B'}`,
                  color: message.type === 'success' ? '#009E76' : '#FF6B2B'
                }}>
            <span className="fs-4 me-3">
              {message.type === "success" ? <MdCheckCircleOutline /> : <MdErrorOutline />}
            </span>
            <span className="small fw-medium">{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="mb-4" data-aos="fade-up" data-aos-delay="400">
            <label htmlFor="login-email" className="form-label small fw-bold mb-2" style={{ color: '#1A4B8C' }}>Adresse Email</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-0 px-3" style={{ color: '#8A9BB0' }}><MdEmail /></span>
              <input 
                id="login-email"
                type="email" 
                className="form-control form-control-lg border-0 bg-light fs-6"
                style={{ borderRadius: '0 12px 12px 0' }}
                name="email" 
                placeholder="votre@email.com" 
                value={formData.email} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <div className="mb-3" data-aos="fade-up" data-aos-delay="600">
            <div className="d-flex justify-content-between mb-2">
              <label htmlFor="login-password" className="form-label small fw-bold" style={{ color: '#1A4B8C' }}>Mot de passe</label>
              <Link to="/forgot-password" style={{ color: '#FF6B2B' }} className="small fw-bold text-decoration-none hover-underline">
                Oublié ?
              </Link>
            </div>
            <div className="input-group">
              <span className="input-group-text bg-light border-0 px-3" style={{ color: '#8A9BB0' }}><MdLock /></span>
              <input 
                id="login-password"
                type="password" 
                className="form-control form-control-lg border-0 bg-light fs-6"
                style={{ borderRadius: '0 12px 12px 0' }}
                name="password" 
                placeholder="••••••••" 
                value={formData.password} 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <div data-aos="fade-up" data-aos-delay="800">
            <button type="submit" 
                    className="btn w-100 mt-4 py-3 rounded-pill fw-bold shadow-lg d-flex align-items-center justify-content-center gap-2 btn-login-submit" 
                    disabled={loading}
                    style={{ 
                      backgroundColor: '#FF6B2B', 
                      color: '#fff', 
                      border: 'none',
                      fontSize: '1rem'
                    }}>
              {loading ? (
                /* ✅ CORRECTION LIGNE 154 : Remplacement de role="status" par <output> */
                <output className="spinner-border spinner-border-sm"></output>
              ) : (
                <>Se connecter <MdArrowForward /></>
              )}
            </button>
          </div>
        </form>

        <div className="mt-5 text-center" data-aos="fade-in" data-aos-delay="1000">
          <p className="small mb-0" style={{ color: '#8A9BB0' }}>
            Pas encore de compte ? 
            <Link to="/register" className="ms-2 fw-bold text-decoration-none" style={{ color: '#00C896' }}>
              Inscrivez-vous gratuitement
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}