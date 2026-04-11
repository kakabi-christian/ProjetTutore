import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authService } from "../services/authService";
import AOS from 'aos';
import 'aos/dist/aos.css';
import "../styles/VerifyOtpContent.css"; 

export default function VerifyOtpContent() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(59);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "";

  useEffect(() => {
    // Initialisation de AOS
    AOS.init({
      duration: 1000,
      once: true,
      easing: 'ease-out-back'
    });

    if (!email) {
      navigate("/login");
      return;
    }

    if (location.state?.message) {
      setInfoMessage(location.state.message);
    }

    inputRefs.current[0]?.focus();
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [email, navigate, location.state]);

  const handleChange = (value: string, index: number) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) return;

    setLoading(true);
    setError(null);

    try {
      await authService.verifyOtp(email, code);
      navigate("/login", {
        state: { message: "Compte vérifié avec succès ! Connectez-vous maintenant." },
      });
    } catch (err: any) {
      const msg = err.response?.data?.message || "Code invalide ou expiré.";
      setError(msg);
      setInfoMessage(null);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setLoading(true);
      // await authService.resendOtp(email); 
      setTimer(59);
      setError(null);
      setInfoMessage("Un nouveau code a été envoyé à votre adresse.");
    } catch (err) {
      setError("Impossible de renvoyer le code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="otp-page-wrapper d-flex align-items-center justify-content-center" 
         style={{ minHeight: '100vh', background: 'radial-gradient(circle at center, #F8FFFE 0%, #E6F0EE 100%)' }}>
      
      <div className="otp-card p-4 shadow-lg bg-white rounded-4 border-0 text-center" 
           data-aos="fade-up"
           style={{ maxWidth: '450px', width: '95%' }}>
        
        <div className="otp-icon-circle bg-warning-subtle mx-auto mb-3 d-flex align-items-center justify-content-center" 
             data-aos="zoom-in" data-aos-delay="200"
             style={{ width: '80px', height: '80px', borderRadius: '50%' }}>
          <span style={{ fontSize: '2rem' }}>📩</span>
        </div>
        
        <h2 className="fw-bold mb-2" data-aos="fade-down" data-aos-delay="300" style={{ color: '#0A2540' }}>Vérifiez votre compte</h2>
        <p className="text-muted small mb-4" data-aos="fade-down" data-aos-delay="400">
          Entrez le code de sécurité envoyé à : <br />
          <strong style={{ color: '#1A4B8C' }}>{email}</strong>
        </p>

        {infoMessage && (
          <div className="alert p-2 mb-3 border-0 rounded-3 small animate__animated animate__fadeIn"
               style={{ backgroundColor: '#E6F0EE', color: '#00C896' }}>
            {infoMessage}
          </div>
        )}
        
        {error && (
          <div className="alert p-2 mb-3 border-0 rounded-3 small animate__animated animate__shakeX"
               style={{ backgroundColor: '#FFF0EA', color: '#FF6B2B' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="mt-2">
          <div className="otp-inputs d-flex justify-content-center gap-2 mb-4" data-aos="fade-up" data-aos-delay="500">
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                ref={(el) => { inputRefs.current[index] = el; }}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="form-control text-center fw-bold fs-4 shadow-sm border-0"
                style={{ 
                    width: "45px", 
                    height: "55px", 
                    backgroundColor: "#F1F4F9",
                    color: "#0A2540",
                    borderRadius: "10px"
                }}
              />
            ))}
          </div>

          <div data-aos="zoom-in" data-aos-delay="600">
            <button
              type="submit"
              className="btn w-100 fw-bold py-2 rounded-pill shadow-sm d-flex align-items-center justify-content-center"
              style={{ backgroundColor: '#FF6B2B', color: '#fff', border: 'none' }}
              disabled={loading || otp.includes("")}
            >
              {loading ? <span className="spinner-border spinner-border-sm"></span> : "Confirmer la vérification"}
            </button>
          </div>
        </form>

        <div className="otp-footer mt-4" data-aos="fade-in" data-aos-delay="800">
          {timer > 0 ? (
            <p className="text-muted small">
              Renvoyer le code dans <span className="fw-bold text-dark">{timer}s</span>
            </p>
          ) : (
            <button className="btn btn-link fw-bold text-decoration-none p-0" 
                    style={{ color: '#00C896', fontSize: '0.85rem' }} 
                    onClick={handleResend} 
                    disabled={loading}>
              Renvoyer un nouveau code
            </button>
          )}
        </div>
      </div>
    </div>
  );
}