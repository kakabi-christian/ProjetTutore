import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authService } from "../services/authService";
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

  // Récupération de l'email et du message envoyés par le Login ou le Register
  const email = location.state?.email || "";

  useEffect(() => {
    // SÉCURITÉ : Si pas d'email, retour au login
    if (!email) {
      navigate("/login");
      return;
    }

    // Affichage du message d'information s'il existe (ex: "Un nouveau code a été envoyé")
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
      // Appel au backend (verifyOtp mettra isverified à true)
      await authService.verifyOtp(email, code);
      
      // Redirection vers login avec message de succès
      navigate("/login", {
        state: { message: "Compte vérifié avec succès ! Connectez-vous maintenant." },
      });
    } catch (err: any) {
      const msg = err.response?.data?.message || "Code invalide ou expiré.";
      setError(msg);
      setInfoMessage(null); // On efface le message d'info si erreur
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setLoading(true);
      // Ici tu peux appeler une fonction authService.resendOtp(email) si tu en as une
      // Sinon, pour l'instant on simule le renvoi
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
    <div className="otp-page-wrapper light-theme">
      <div className="otp-card shadow-lg animate__animated animate__fadeIn">
        <div className="otp-icon-circle bg-warning-subtle">
          <span className="fs-1">📩</span>
        </div>
        
        <h2 className="otp-title mt-3 fw-bold">Vérifiez votre compte</h2>
        <p className="otp-subtitle text-muted">
          Entrez le code de sécurité envoyé à : <br />
          <strong className="text-dark">{email}</strong>
        </p>

        {/* Message d'info du Login */}
        {infoMessage && <div className="alert alert-info py-2 small">{infoMessage}</div>}
        
        {/* Message d'erreur */}
        {error && <div className="alert alert-danger py-2 small animate__animated animate__shakeX">{error}</div>}

        <form onSubmit={handleVerify} className="otp-form mt-4">
          <div className="otp-inputs d-flex justify-content-center gap-2 mb-4">
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
                className={`form-control text-center fw-bold fs-4 ${digit ? "border-warning bg-light" : ""}`}
                style={{ width: "45px", height: "55px" }}
              />
            ))}
          </div>

          <button
            type="submit"
            className="btn btn-warning w-100 fw-bold py-2 shadow-sm"
            disabled={loading || otp.includes("")}
          >
            {loading ? <span className="spinner-border spinner-border-sm"></span> : "Confirmer la vérification"}
          </button>
        </form>

        <div className="otp-footer mt-4 text-center">
          {timer > 0 ? (
            <p className="timer-text text-muted small">
              Renvoyer le code dans <span className="fw-bold text-dark">{timer}s</span>
            </p>
          ) : (
            <button className="btn btn-link text-success fw-bold text-decoration-none" onClick={handleResend} disabled={loading}>
              Renvoyer un nouveau code
            </button>
          )}
        </div>
      </div>
    </div>
  );
}