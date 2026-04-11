import React, { useState } from "react";
import "../styles/Header.css";
import img from "../assets/Logo Appli.png";
import { Link } from "react-router-dom";

const Header: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  // Gestion de la fermeture via le clavier (Touche Entrée ou Espace)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      setMenuOpen(false);
    }
  };

  return (
    <header className="main-header">
      <nav className="navbar-custom">
        <div className="nav-logo">
          <Link to="/">
            <img src={img} alt="ExchaPay Logo" />
          </Link>
        </div>

        <ul className="nav-links">
          <li><Link to="/" className="nav-item">Accueil</Link></li>
          <li><Link to="/about" className="nav-item">À propos</Link></li>
          <li><Link to="/how-it-work" className="nav-item">Comment ça marche</Link></li>
          <li><Link to="/annonces" className="nav-item">Annonces</Link></li>
        </ul>

        <div className="nav-cta">
          <Link to="/login" className="login-link">Connexion</Link>
          <Link to="/register" className="btn-primary-gradient">
            S'inscrire
          </Link>

          <button
            type="button"
            className={`hamburger ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      {/* ✅ CORRECTION FINALE LIGNE 61 : Suppression du role="presentation" */}
      {/* On garde onClick et onKeyDown pour l'interaction utilisateur, 
          mais on utilise aria-hidden pour ne pas polluer l'expérience des lecteurs d'écran */}
      <div 
        className={`menu-overlay ${menuOpen ? "active" : ""}`} 
        onClick={() => setMenuOpen(false)}
        onKeyDown={handleKeyDown}
        tabIndex={-1} 
        aria-hidden="true"
      ></div>

      <div className={`mobile-menu ${menuOpen ? "open" : ""}`} aria-hidden={!menuOpen}>
        <ul className="mobile-nav-list">
          <li><Link to="/" onClick={() => setMenuOpen(false)}>Accueil</Link></li>
          <li><Link to="/about" onClick={() => setMenuOpen(false)}>À propos</Link></li>
          <li><Link to="/how-it-work" onClick={() => setMenuOpen(false)}>Comment ça marche</Link></li>
          <li><Link to="/annonces" onClick={() => setMenuOpen(false)}>Annonces</Link></li>
        </ul>
        <div className="mobile-cta">
          <Link to="/login" className="btn-mobile-secondary" onClick={() => setMenuOpen(false)}>Connexion</Link>
          <Link to="/register" className="btn-mobile-primary" onClick={() => setMenuOpen(false)}>S'inscrire gratuitement</Link>
        </div>
      </div>
    </header>
  );
};

export default Header;