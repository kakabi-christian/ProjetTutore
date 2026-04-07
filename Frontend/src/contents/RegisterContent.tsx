import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import type { SingleValue } from "react-select";
import { authService } from "../services/authService";
import type { UserRegistration } from "../models/Utilisateur";
import "../styles/RegisterContent.css";

// Interface mise à jour pour inclure le nom complet et le code ISO
interface CountryOption {
  value: string;      // On stocke ici le code ISO (ex: CM)
  fullCountryName: string; // Le nom complet (ex: Cameroun)
  label: React.JSX.Element;
  dialCode: string;
}

export default function RegisterContent() {
  const navigate = useNavigate();
  
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [formData, setFormData] = useState<UserRegistration>({
    lastname: "",
    firstname: "",
    email: "",
    telephone: "",
    country: "",
    country_code: "", // Champ critique pour ton backend
    password: "",
    password_confirmation: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, any>>({});

  // Récupération des pays
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch("https://restcountries.com/v3.1/all?fields=name,flags,idd,translations,cca2");
        const data = await response.json();
        
        const formatted = data.map((c: any) => ({
          value: c.cca2, // ✅ On utilise le code ISO 2 lettres (ex: CM) comme valeur principale
          fullCountryName: c.translations?.fra?.common || c.name.common,
          dialCode: (c.idd.root || "") + (c.idd.suffixes ? c.idd.suffixes[0] : ""),
          label: (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <img 
                src={c.flags.png} 
                alt={`Drapeau ${c.cca2}`} 
                style={{ width: "22px", height: "15px", borderRadius: "2px", objectFit: "cover" }} 
              />
              <span>{c.translations?.fra?.common || c.name.common}</span>
            </div>
          ),
        })).sort((a: any, b: any) => a.fullCountryName.localeCompare(b.fullCountryName));

        setCountries(formatted);
      } catch (err) {
        console.error("Erreur lors du chargement des pays:", err);
      }
    };
    fetchCountries();
  }, []);

  // Gestion du changement de pays
  const handleCountryChange = (selectedOption: SingleValue<CountryOption>) => {
    if (selectedOption) {
      setFormData((prev) => ({ 
        ...prev, 
        country: selectedOption.fullCountryName, // Ex: "Cameroun"
        country_code: selectedOption.value,      // Ex: "CM" -> Ira dans country_code en BD
        telephone: selectedOption.dialCode 
      }));
      setErrors((prev) => ({ ...prev, country: false, country_code: false }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setErrors({});

    if (formData.password !== formData.password_confirmation) {
      setErrors({ password: true, password_confirmation: true });
      setMessage({ type: "error", text: "Les mots de passe ne correspondent pas." });
      setLoading(false);
      return;
    }

    try {
      // ✅ Envoie maintenant country_code: "CM" et country: "Cameroun"
      await authService.register(formData);
      navigate("/verify-otp", { state: { email: formData.email } });
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Une erreur est survenue.";
      setMessage({ type: "error", text: errorMsg });
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors); 
      }
    } finally {
      setLoading(false);
    }
  };

  const customSelectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      background: "#fff",
      borderColor: errors.country || errors.country_code ? "#ff4d4f" : state.isFocused ? "#ff9800" : "#ddd",
      borderRadius: "8px",
      padding: "2px",
      boxShadow: state.isFocused ? "0 0 0 1px #ff9800" : "none",
      "&:hover": { borderColor: "#ff9800" }
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused ? "#fff3e0" : "#fff",
      color: "#333",
      cursor: "pointer"
    })
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
                required
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
                required
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
              required
            />
          </div>

          <div className="input-group-row">
            <div className="input-field">
              <label>Pays</label>
              <Select
                options={countries}
                onChange={handleCountryChange}
                placeholder="Choisir..."
                styles={customSelectStyles}
                required
              />
              {/* Le champ country_code est envoyé de manière invisible via formData */}
            </div>
            <div className="input-field">
              <label>Téléphone</label>
              <input
                className={errors.telephone ? "input-error" : ""}
                type="tel"
                name="telephone"
                placeholder="+237..."
                value={formData.telephone}
                onChange={handleChange}
                required
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
                required
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
                required
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