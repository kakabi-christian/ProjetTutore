import React, { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../styles/Footer.css';
import { Link } from 'react-router-dom';
import { 
  FaFacebookF, FaLinkedinIn, FaGoogle, FaInstagram,
  FaEnvelope, FaPhoneAlt
} from 'react-icons/fa';

export default function Footer() {
  useEffect(() => {
    AOS.init({ duration: 800 });
  }, []);

  return (
    <footer className="footer-container">
      <div className="container py-4">
        <div className="row g-3">
          
          {/* Section 1: Brand */}
          <div className="col-lg-4 col-md-6 mb-3 mb-lg-0" data-aos="fade-up">
            <div className="footer-brand mb-2">
              <span className="text-excha-green">Excha</span><span className="text-excha-orange">Pay</span>
            </div>
            <p className="footer-description mb-3 small">
              La solution P2P de confiance pour l'échange de devises en Afrique. 
              Rapide, sécurisé, transparent.
            </p>
            <div className="social-links d-flex gap-2">
              <a href="https://facebook.com/exchapay" className="social-icon facebook" aria-label="Suivez-nous sur Facebook" target="_blank" rel="noopener noreferrer"><FaFacebookF /></a>
              <a href="mailto:contact@exchapay.com" className="social-icon google" aria-label="Envoyez-nous un email"><FaGoogle /></a>
              <a href="https://linkedin.com/company/exchapay" className="social-icon linkedin" aria-label="Suivez-nous sur LinkedIn" target="_blank" rel="noopener noreferrer"><FaLinkedinIn /></a>
              <a href="https://instagram.com/exchapay" className="social-icon instagram" aria-label="Suivez-nous sur Instagram" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
            </div>
          </div>

          {/* Section 2: Services */}
          <div className="col-lg-2 col-md-3 col-6" data-aos="fade-up" data-aos-delay="100">
            <h6 className="footer-title small fw-bold">Services</h6>
            <ul className="list-unstyled footer-links mb-0">
              <li><Link to="/annonces">Échanges</Link></li>
              <li><Link to="/security">Sécurité</Link></li>
              <li><Link to="/rates">Taux</Link></li>
            </ul>
          </div>

          {/* Section 3: Légal - ✅ CORRECTION LIGNE 52 */}
          <div className="col-lg-2 col-md-3 col-6" data-aos="fade-up" data-aos-delay="200">
            <h6 className="footer-title small fw-bold">Légal</h6>
            <ul className="list-unstyled footer-links mb-0">
              {/* Utilisation de routes explicites et sémantiques */}
              <li><Link to="/terms-of-service">Conditions</Link></li>
              <li><Link to="/privacy-policy">Privacy</Link></li>
            </ul>
          </div>

          {/* Section 4: Contact & CTA */}
          <div className="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay="300">
            <h6 className="footer-title small fw-bold">Contact</h6>
            <ul className="list-unstyled footer-contact small mb-3">
              <li className="mb-1">
                <a href="mailto:contact@exchapay.com" className="text-decoration-none text-reset">
                   <FaEnvelope className="me-2 text-excha-orange" /> contact@exchapay.com
                </a>
              </li>
              <li className="mb-1">
                <a href="tel:+237600000000" className="text-decoration-none text-reset">
                   <FaPhoneAlt className="me-2 text-excha-orange" /> +237 6XX XXX XXX
                </a>
              </li>
            </ul>
            <button type="button" className="btn btn-excha-orange btn-sm w-100 fw-bold py-2 rounded-3 shadow-sm">
              Besoin d'aide ? Contactez-nous
            </button>
          </div>
        </div>

        <hr className="footer-divider my-3" />

        <div className="footer-bottom d-flex flex-column flex-md-row justify-content-between align-items-center gap-2" data-aos="fade-in" data-aos-delay="500">
          <div className="footer-copy small opacity-75">
            © {new Date().getFullYear()} <span className="text-excha-orange fw-bold">ExchaPay</span>
          </div>
          <div className="footer-payment-icons d-flex gap-3 small fw-bold">
             <span className="text-excha-green">MTN</span>
             <span className="text-excha-orange">ORANGE</span>
             <span className="text-white opacity-50">VISA</span>
          </div>
        </div>
      </div>
    </footer>
  );
}