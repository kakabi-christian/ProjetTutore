// src/components/Header.tsx
import React from "react";
import "../styles/Header.css"; // Assurez-vous d'avoir un fichier CSS pour le style du header
import img from "../assets/Logo Appli.png";
import { Link } from "react-router-dom";
const Header: React.FC = () => {
  return (
    <nav className="navbar-custom">
      <div className="nav-logo">
        <img src={img} alt="Logo Appli" />
      </div>

      <ul className="nav-links d-none d-lg-flex">
        <li>
          <Link to="/" className="nav-link text-white">
            Accueil
          </Link>
        </li>
        <li>
          {" "}
          <Link to="/about" className="nav-link text-white">
            A propos
          </Link>
        </li>

        <li>
          <a href="#annonces">Annonces</a>
        </li>
        <li>
          <a href="#comment-ca-marche">Comment ça marche</a>
        </li>
      </ul>

      <div className="nav-cta">
        <Link to="/login">
          <button className="btn-ghost">Connexion</button>
        </Link>
        <Link to="/register">
          <button className="btn-primary-custom">S'inscrire gratuitement</button>
        </Link>
      
      </div>
    </nav>
  );
};

export default Header;
