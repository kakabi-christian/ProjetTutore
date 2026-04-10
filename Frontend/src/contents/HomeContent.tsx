import React, { useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import AOS from 'aos';
import 'aos/dist/aos.css';
import '../styles/HomeContent.css';
import '../theme.css';

import { 
  LuPencilLine, 
  LuSearch, 
  LuShieldCheck, 
  LuCheck, 
  LuPlay, 
  LuZap,
  LuShieldAlert,
  LuSmartphone,
  LuBot,
  LuQuote,
  LuChevronDown
} from "react-icons/lu";
import { FaArrowRight } from "react-icons/fa6";

interface Step {
  num: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: string;
}

const HomeContent: React.FC = () => {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: false,
      mirror: true,
      easing: 'ease-out-back',
      offset: 100
    });
    AOS.refresh();
  }, []);

  const steps: Step[] = [
    { num: '01', icon: <LuPencilLine />, title: 'Créez votre annonce', desc: 'Publiez une offre avec la devise et le taux souhaité.', color: 'green' },
    { num: '02', icon: <LuSearch />, title: 'Matching automatique', desc: 'Notre algorithme trouve votre contrepartie idéale.', color: 'blue' },
    { num: '03', icon: <LuShieldCheck />, title: 'Escrow sécurisé', desc: 'Les fonds sont bloqués sur un compte séquestre neutre.', color: 'orange' },
    { num: '04', icon: <LuCheck />, title: 'Virement final', desc: 'Les fonds sont libérés dès confirmation des deux dépôts.', color: 'green' }
  ];

  const testimonials = [
    { name: "Samuel E.", role: "Commerçant", text: "ExchaPay a simplifié mes paiements fournisseurs. Plus besoin d'attendre des jours en banque.", city: "Douala" },
    { name: "Marie-Louise K.", role: "Freelance", text: "Le système Escrow me rassure énormément. Je sais que mon argent est en sécurité.", city: "Yaoundé" },
    { name: "Jean P.", role: "Particulier", text: "L'assistant IA m'a aidé à comprendre le taux de change en direct. Très intuitif !", city: "Abidjan" }
  ];

  return (
    <div className="home-content-wrapper overflow-hidden">
      
      {/* HERO SECTION */}
      <section className="container-fluid hero-container py-5">
        <div className="container">
          <div className="row align-items-center min-vh-100">
            <div className="col-lg-6 hero-left text-center text-lg-start" data-aos="fade-right">
              <h1 className="display-4 fw-bold mb-4">
                Échangez vos <span className="text-excha-green">devises</span><br />
                en toute <span className="text-excha-orange">confiance.</span>
              </h1>
              <p className="hero-sub mb-5 mx-auto mx-lg-0 lead text-muted">
                ExchaPay connecte directement acheteurs et vendeurs de devises FIAT en Afrique et dans le monde entier, 
                avec une sécurité escrow, le Mobile Money intégré et une IA assistante.
              </p>
              
              <div className="hero-actions d-flex flex-wrap justify-content-center justify-content-lg-start gap-3 mb-5">
                <button className="btn btn-excha-orange px-4 py-3 shadow d-flex align-items-center gap-2 rounded-pill fw-bold">
                  Commencer l'échange <FaArrowRight />
                </button>
                <button className="btn btn-excha-outline px-4 py-3 d-flex align-items-center gap-2 rounded-pill fw-bold">
                  <LuPlay /> Voir comment ça marche
                </button>
              </div>

              <div className="hero-stats d-flex align-items-center justify-content-center justify-content-lg-start gap-4">
                <div className="stat-item" data-aos="zoom-in" data-aos-delay="200">
                  <div className="stat-number fw-bold h2 text-excha-blue">50+</div>
                  <div className="stat-label small text-muted">Devises</div>
                </div>
                <div className="divider-vr bg-gray opacity-25" style={{width: '1px', height: '40px'}}></div>
                <div className="stat-item" data-aos="zoom-in" data-aos-delay="300">
                  <div className="stat-number fw-bold h2 text-excha-blue">0.5%</div>
                  <div className="stat-label small text-muted">Frais</div>
                </div>
                <div className="divider-vr bg-gray opacity-25" style={{width: '1px', height: '40px'}}></div>
                <div className="stat-item" data-aos="zoom-in" data-aos-delay="400">
                  <div className="stat-number fw-bold h2 text-excha-blue">100%</div>
                  <div className="stat-label small text-muted">Escrow</div>
                </div>
              </div>
            </div>

            <div className="col-lg-6 hero-visual position-relative mt-5 mt-lg-0 d-flex justify-content-center" data-aos="fade-left">
              <div className="visual-background-animate">
                <div className="blob b-1"></div><div className="blob b-2"></div><div className="blob b-3"></div>
              </div>
              <div className="float-card left glass-effect d-none d-md-flex align-items-center gap-2 shadow-sm" data-aos="fade-down" data-aos-delay="500">
                <div className="float-card-label fw-bold">MTN Mobile Money</div>
                <div className="float-card-val text-excha-green fw-bold">✓ Intégré</div>
              </div>
              <div className="phone-mockup shadow-2xl animate-float">
                <div className="phone-header d-flex justify-content-between align-items-center p-3">
                  <div className="phone-logo fw-bold text-excha-blue">ExchaPay</div>
                  <div className="phone-avatar bg-excha-green text-white rounded-circle d-flex align-items-center justify-content-center" style={{width: '35px', height: '35px'}}>JD</div>
                </div>
                <div className="rate-card glass-card mx-3 my-4 p-3 rounded-4">
                  <div className="rate-label small opacity-75">Taux en direct</div>
                  <div className="rate-value h4 fw-bold my-1 text-excha-blue">655,96 <span className="currency-unit small">FCFA</span></div>
                  <div className="rate-pair small text-success">EUR → XOF &nbsp;<span className="fw-bold">↑ +0.3%</span></div>
                </div>
                <div className="offers-title small fw-bold mb-3 px-3 text-start text-excha-blue">Offres disponibles</div>
                <div className="mini-offer d-flex justify-content-between align-items-center mb-2 mx-3 p-2 bg-light rounded-3">
                  <div className="offer-user d-flex align-items-center">
                    <div className="offer-dot a bg-excha-orange text-white rounded-circle d-flex align-items-center justify-content-center" style={{width: '30px', height: '30px', fontSize: '10px'}}>AB</div>
                    <div className="ms-2 text-start">
                      <div className="offer-name x-small fw-bold">Alpha Bah</div>
                      <div className="offer-sub x-small text-muted">★ 4.9</div>
                    </div>
                  </div>
                  <div className="offer-amount small fw-bold text-excha-blue">500 €</div>
                </div>
                <div className="px-3">
                    <button className="btn btn-excha-orange w-100 py-2 mt-3 fw-bold d-flex align-items-center justify-content-center gap-2 rounded-3">
                      <LuZap /> Matcher une offre
                    </button>
                </div>
              </div>
              <div className="float-card right glass-effect d-none d-md-flex align-items-center gap-2 shadow-sm" data-aos="fade-up" data-aos-delay="600">
                <div className="float-card-label fw-bold">Escrow sécurisé</div>
                <div className="float-card-val text-excha-orange d-flex align-items-center gap-1 fw-bold"><LuShieldCheck /> Protégé</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <div className="trust-bar bg-excha-blue py-4" id='security' data-aos="fade-up">
        <div className="container text-white">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-4 text-center">
            <div className="trust-item d-flex align-items-center gap-2 opacity-75"><LuShieldAlert className="text-excha-green" /> Sécurité PCI-DSS</div>
            <div className="trust-item d-flex align-items-center gap-2 opacity-75"><LuSmartphone className="text-excha-green" /> Mobile Money</div>
            {/* <div className="trust-item d-flex align-items-center gap-2 opacity-75"><LuBot className="text-excha-green" /> Assistant IA 24/7</div> */}
            <div className="trust-item d-flex align-items-center gap-2 opacity-75"><LuZap className="text-excha-green" /> Transactions rapides</div>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section className="container py-5 my-5">
        <div className="text-center mb-5" data-aos="fade-up">
          <span className="badge rounded-pill bg-soft-green text-excha-green px-3 py-2 mb-2 fw-bold">PROCESSUS</span>
          <h2 className="display-5 fw-bold text-excha-blue">Échangez en 4 étapes simples</h2>
        </div>
        <div className="row g-4">
          {steps.map((step, i) => (
            <div className="col-sm-6 col-lg-3" key={i} data-aos="fade-up" data-aos-delay={i * 100}>
              <div className="step-card h-100 p-4 border-0 shadow-sm rounded-4 position-relative overflow-hidden bg-white value-card">
                <div className="step-num-bg text-orange display-1 position-absolute top-0 end-0 opacity-10 fw-bold">{step.num}</div>
                <div className={`step-icon mb-3 fs-1 p-3 rounded-4 d-inline-block shadow-sm icon-${step.color}`} style={{position: 'relative', zIndex: 1}}>{step.icon}</div>
                <h5 className="step-title fw-bold text-excha-orange" style={{position: 'relative', zIndex: 1}}>{step.title}</h5>
                <p className="step-desc text-muted small mb-0" style={{position: 'relative', zIndex: 1}}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS SECTION (NEW) */}
      <section className="bg-light py-5">
        <div className="container py-5">
          <div className="text-center mb-5" data-aos="fade-up">
            <h2 className="display-6 fw-bold text-excha-blue">Ils nous font confiance</h2>
            <p className="text-muted">Rejoignez des milliers d'utilisateurs satisfaits à travers le continent.</p>
          </div>
          <div className="row g-4">
            {testimonials.map((t, i) => (
              <div className="col-md-4" key={i} data-aos="zoom-in" data-aos-delay={i * 150}>
                <div className="testimonial-card p-4 rounded-4 bg-white shadow-sm border-0 h-100">
                  <LuQuote className="text-excha-orange fs-2 mb-3 opacity-50" />
                  <p className="fst-italic text-muted mb-4">"{t.text}"</p>
                  <div className="d-flex align-items-center gap-3">
                    <div className="avatar-placeholder bg-soft-blue text-excha-blue rounded-circle p-2 fw-bold">{t.name[0]}</div>
                    <div>
                      <h6 className="mb-0 fw-bold">{t.name}</h6>
                      <small className="text-excha-green fw-medium">{t.role} • {t.city}</small>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomeContent;