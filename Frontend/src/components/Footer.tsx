import React, { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../styles/Footer.css';
import { 
  FaFacebookF, FaTwitter, FaLinkedinIn, FaGoogle, FaInstagram,
  FaEnvelope, FaPhoneAlt
} from 'react-icons/fa';

export default function Footer() {
  // Initialisation de AOS au cas où le footer est chargé indépendamment
  useEffect(() => {
    AOS.init({ duration: 800 });
  }, []);

  return (
    <footer className="footer-container">
      <div className="container py-4">
        <div className="row g-3">
          
          {/* Section 1: Brand - Apparaît en premier */}
          <div className="col-lg-4 col-md-6 mb-3 mb-lg-0" data-aos="fade-up">
            <div className="footer-brand mb-2">
              <span className="text-excha-green">Excha</span><span className="text-excha-orange">Pay</span>
            </div>
            <p className="footer-description mb-3 small">
              La solution P2P de confiance pour l'échange de devises en Afrique. 
              Rapide, sécurisé, transparent.
            </p>
            <div className="social-links d-flex gap-2">
              <a href="#" className="social-icon facebook"><FaFacebookF /></a>
              <a href="#" className="social-icon google"><FaGoogle /></a>
              <a href="#" className="social-icon linkedin"><FaLinkedinIn /></a>
              <a href="#" className="social-icon instagram"><FaInstagram /></a>
            </div>
          </div>

          {/* Section 2: Services - Délai de 100ms */}
          <div className="col-lg-2 col-md-3 col-6" data-aos="fade-up" data-aos-delay="100">
            <h6 className="footer-title small fw-bold">Services</h6>
            <ul className="list-unstyled footer-links mb-0">
              <li><a href="#">Échanges</a></li>
              <li><a href="#">Sécurité</a></li>
              <li><a href="#">Taux</a></li>
            </ul>
          </div>

          {/* Section 3: Légal - Délai de 200ms */}
          <div className="col-lg-2 col-md-3 col-6" data-aos="fade-up" data-aos-delay="200">
            <h6 className="footer-title small fw-bold">Légal</h6>
            <ul className="list-unstyled footer-links mb-0">
              <li><a href="#">Conditions</a></li>
              <li><a href="#">Privacy</a></li>
            </ul>
          </div>

          {/* Section 4: Contact & CTA - Délai de 300ms */}
          <div className="col-lg-4 col-md-6" data-aos="fade-up" data-aos-delay="300">
            <h6 className="footer-title small fw-bold">Contact</h6>
            <ul className="list-unstyled footer-contact small mb-3">
              <li className="mb-1"><FaEnvelope className="me-2 text-excha-orange" /> contact@exchapay.com</li>
              <li className="mb-1"><FaPhoneAlt className="me-2 text-excha-orange" /> +237 6XX XXX XXX</li>
            </ul>
            <button className="btn btn-excha-orange btn-sm w-100 fw-bold py-2 rounded-3 shadow-sm">
              Besoin d'aide ? Contactez-nous
            </button>
          </div>
        </div>

        <hr className="footer-divider my-3" />

        {/* Barre de copyright - Apparaît en dernier */}
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