import React from 'react'
import '../styles/Footer.css'

export default function Footer() {
  return (
    <footer className="footer-custom">
      <div className="footer-logo">
        ExchaPay
      </div>

      <ul className="footer-links">
        <li><a href="#">Conditions d'utilisation</a></li>
        <li><a href="#">Politique de confidentialité</a></li>
        <li><a href="#">Aide & Support</a></li>
        <li><a href="#">Contact</a></li>
      </ul>

      <div className="footer-copy">
        © {new Date().getFullYear()} ExchaPay. Tous droits réservés.
      </div>
    </footer>
  )
}