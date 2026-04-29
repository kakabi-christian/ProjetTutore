import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Select from "react-select";
import type { SingleValue } from "react-select";
import { authService } from "../services/authService";
import type { UserRegistration } from "../models/Utilisateur";
import { MdPerson, MdEmail, MdPhone, MdLock, MdArrowForward } from "react-icons/md";
import AOS from 'aos';
import 'aos/dist/aos.css';
import "../styles/RegisterContent.css";
import "../theme.css";

interface CountryOption {
  value: string;
  fullCountryName: string;
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
    country_code: "",
    password: "",
    password_confirmation: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
      easing: 'ease-out-back'
    });

    const fetchCountries = async () => {
      try {
        const response = await fetch("https://restcountries.com/v3.1/all?fields=name,flags,idd,translations,cca2");
        const data = await response.json();
        const formatted = data.map((c: any) => ({
          value: c.cca2,
          fullCountryName: c.translations?.fra?.common || c.name.common,
          dialCode: (c.idd.root || "") + (c.idd.suffixes ? c.idd.suffixes[0] : ""),
          label: (
            <div className="d-flex align-items-center gap-2">
              <img src={c.flags.png} alt="" style={{ width: "16px", height: "11px" }} />
              <span style={{ fontSize: '0.8rem' }}>{c.translations?.fra?.common || c.name.common}</span>
            </div>
          ),
        })).sort((a: any, b: any) => a.fullCountryName.localeCompare(b.fullCountryName));
        setCountries(formatted);
      } catch (err) {
        console.error("Erreur pays:", err);
      }
    };
    fetchCountries();
  }, []);

  const handleCountryChange = (selectedOption: SingleValue<CountryOption>) => {
    if (selectedOption) {
      setFormData((prev) => ({ 
        ...prev, 
        country: selectedOption.fullCountryName,
        country_code: selectedOption.value,
        telephone: selectedOption.dialCode 
      }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    if (formData.password !== formData.password_confirmation) {
      setMessage({ type: "error", text: "Mots de passe différents." });
      setLoading(false);
      return;
    }
    try {
      await authService.register(formData);
      navigate("/verify-otp", { state: { email: formData.email } });
    } catch (error: any) {
      setMessage({ type: "error", text: error.response?.data?.message || "Erreur." });
    } finally {
      setLoading(false);
    }
  };

  // Styles mis à jour avec la gestion du z-index pour le portail
  const customSelectStyles = {
    control: (base: any) => ({
      ...base,
      background: "#F1F4F9",
      border: "none",
      borderRadius: "8px",
      minHeight: "34px",
      fontSize: "0.8rem",
    }),
    valueContainer: (base: any) => ({ ...base, padding: "0 8px" }),
    indicatorsContainer: (base: any) => ({ ...base, height: "30px" }),
    menuPortal: (base: any) => ({ ...base, zIndex: 9999 }), // Priorité d'affichage
    menu: (base: any) => ({ ...base, zIndex: 9999 }),
  };

  return (
    <div className="register-page-wrapper d-flex align-items-center justify-content-center py-2" 
         style={{ minHeight: '100vh', background: 'radial-gradient(circle at center, #F8FFFE 0%, #E6F0EE 100%)' }}>
      
      <div className="register-card p-3 p-md-4 shadow-lg bg-white rounded-4 border-0" 
           data-aos="fade-up"
           style={{ maxWidth: '550px', width: '95%' }}>
        
        <div className="text-center mb-2" data-aos="zoom-in" data-aos-delay="200">
          <h5 className="fw-bold mb-0" style={{ color: '#0A2540' }}>Créer un compte</h5>
          <p className="small text-muted mb-2" style={{ fontSize: '0.75rem' }}>
            Rejoignez l'aventure <span className="fw-bold" style={{ color: '#00C896' }}>ExchaPay</span>
          </p>
        </div>

        {message && (
          <div className="alert p-1 mb-2 border-0 rounded-3 small text-center animate__animated animate__headShake"
               style={{ fontSize: '0.7rem', color: '#FF6B2B', backgroundColor: '#FFF0EA' }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* LIGNE 1 : PRENOM & NOM */}
          <div className="row g-2 mb-2" data-aos="fade-right" data-aos-delay="300">
            <div className="col-6">
              <label htmlFor="firstname" className="form-label fw-bold mb-1" style={{ color: '#1A4B8C', fontSize: '0.7rem' }}>Prénom</label>
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-0"><MdPerson size={14} /></span>
                <input id="firstname" type="text" name="firstname" className="form-control border-0 bg-light" value={formData.firstname} onChange={handleChange} required />
              </div>
            </div>
            <div className="col-6">
              <label htmlFor="lastname" className="form-label fw-bold mb-1" style={{ color: '#1A4B8C', fontSize: '0.7rem' }}>Nom</label>
              <input id="lastname" type="text" name="lastname" className="form-control form-control-sm border-0 bg-light px-2" value={formData.lastname} onChange={handleChange} required />
            </div>
          </div>

          {/* LIGNE 2 : EMAIL */}
          <div className="mb-2" data-aos="fade-right" data-aos-delay="400">
            <label htmlFor="email" className="form-label fw-bold mb-1" style={{ color: '#1A4B8C', fontSize: '0.7rem' }}>Adresse Email</label>
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-0"><MdEmail size={14} /></span>
              <input id="email" type="email" name="email" className="form-control border-0 bg-light" value={formData.email} onChange={handleChange} required />
            </div>
          </div>

          {/* LIGNE 3 : PAYS & TELEPHONE */}
          <div className="row g-2 mb-2" data-aos="fade-right" data-aos-delay="500">
            <div className="col-6">
              <label htmlFor="country-select" className="form-label fw-bold mb-1" style={{ color: '#1A4B8C', fontSize: '0.7rem' }}>Pays</label>
              <Select 
                id="country-select" 
                inputId="country-select" 
                options={countries} 
                onChange={handleCountryChange} 
                styles={customSelectStyles} 
                placeholder="Pays..." 
                menuPortalTarget={document.body} // Téléporte le menu hors du flux DOM
              />
            </div>
            <div className="col-6">
              <label htmlFor="telephone" className="form-label fw-bold mb-1" style={{ color: '#1A4B8C', fontSize: '0.7rem' }}>Téléphone</label>
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-0"><MdPhone size={14} /></span>
                <input id="telephone" type="tel" name="telephone" className="form-control border-0 bg-light" value={formData.telephone} onChange={handleChange} required />
              </div>
            </div>
          </div>

          {/* LIGNE 4 : MOT DE PASSE & CONFIRMATION */}
          <div className="row g-2 mb-3" data-aos="fade-right" data-aos-delay="600">
            <div className="col-6">
              <label htmlFor="password" className="form-label fw-bold mb-1" style={{ color: '#1A4B8C', fontSize: '0.7rem' }}>Mot de passe</label>
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-0"><MdLock size={14} /></span>
                <input id="password" type="password" name="password" className="form-control border-0 bg-light" value={formData.password} onChange={handleChange} required />
              </div>
            </div>
            <div className="col-6">
              <label htmlFor="password_confirmation" className="form-label fw-bold mb-1" style={{ color: '#1A4B8C', fontSize: '0.7rem' }}>Confirmation</label>
              <input id="password_confirmation" type="password" name="password_confirmation" className="form-control form-control-sm border-0 bg-light px-2" value={formData.password_confirmation} onChange={handleChange} required />
            </div>
          </div>

          <div data-aos="zoom-in" data-aos-delay="800">
            <button type="submit" className="btn btn-sm w-100 py-2 rounded-pill fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 btn-register-submit"
                    style={{ backgroundColor: '#FF6B2B', color: '#fff', border: 'none', fontSize: '0.85rem' }} disabled={loading}>
              {loading ? <span className="spinner-border spinner-border-sm"></span> : <>Créer mon compte <MdArrowForward /></>}
            </button>
          </div>
        </form>

        <p className="mt-3 text-center mb-0" data-aos="fade-in" data-aos-delay="1000" style={{ fontSize: '0.75rem', color: '#8A9BB0' }}>
          Déjà un compte ? <Link to="/login" className="fw-bold text-decoration-none" style={{ color: '#00C896' }}>Se connecter</Link>
        </p>
      </div>
    </div>
  );
}