import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authService } from "../services/authService";
import "../styles/VerifyOtpContent.css"; 

export default function VerifyOtpContent() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(59);
  const [error, setError] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "";

  useEffect(() => {
    inputRefs.current[0]?.focus();
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
        state: { message: "Compte vérifié ! Vous pouvez vous connecter." },
      });
    } catch (err: any) {
      const msg = err.response?.data?.message || "Code invalide ou expiré.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setTimer(59);
    setError(null);
    console.log("Code renvoyé à :", email);
  };

  return (
    <div className="otp-page-wrapper light-theme">
      <div className="otp-card">
        <div className="otp-icon-circle">
          <span className="text-excha-green">📩</span>
        </div>
        
        <h2 className="otp-title">Vérifiez votre compte</h2>
        <p className="otp-subtitle">
          Entrez le code de sécurité envoyé à : <br />
          <strong>{email || "votre adresse email"}</strong>
        </p>

        {error && <div className="status-message error">{error}</div>}

        <form onSubmit={handleVerify} className="otp-form">
          <div className="otp-inputs">
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
                className={digit ? "filled" : ""}
              />
            ))}
          </div>

          <button
            type="submit"
            className={`btn-excha-orange otp-submit-btn ${loading ? "loading" : ""}`}
            disabled={loading || otp.includes("")}
          >
            {loading ? <span className="loader"></span> : "Confirmer la vérification"}
          </button>
        </form>

        <div className="otp-footer">
          {timer > 0 ? (
            <p className="timer-text">Renvoyer le code dans <span>{timer}s</span></p>
          ) : (
            <button className="resend-btn" onClick={handleResend}>
              Renvoyer un nouveau code
            </button>
          )}
        </div>
      </div>
    </div>
  );
}